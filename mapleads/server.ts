import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import QRCode from 'qrcode';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  normalizeMessageContent,
  WASocket,
  ConnectionState,
  WAMessage,
  Contact
} from '@whiskeysockets/baileys';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const AUTH_DIR = path.resolve(process.cwd(), '.baileys_auth');

app.use(express.json());

// WhatsApp State
interface WhatsAppState {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrRaw: string | null;
  qrDataUrl: string | null;
  user: { id: string; name?: string; phone: string } | null;
  lastError: string | null;
  lastConnectedAt: string | null;
  historySynced: boolean;
}

const waState: WhatsAppState = {
  status: 'disconnected',
  qrRaw: null,
  qrDataUrl: null,
  user: null,
  lastError: null,
  lastConnectedAt: null,
  historySynced: false
};

interface WhatsAppMessageRecord {
  id: string;
  jid: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  status?: number;
}

interface WhatsAppConversationRecord {
  id: string;
  name: string;
  phone: string | null;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTimestamp: number;
}

let waSocket: WASocket | null = null;
let isInitializing = false;
const waConversations = new Map<string, WhatsAppConversationRecord>();
const waContacts = new Map<string, Contact>();
const waMessages = new Map<string, WhatsAppMessageRecord[]>();
const waLidToJid = new Map<string, string>();

function contactName(jid: string, fallback?: string | null): string {
  const contact = waContacts.get(jid) || waContacts.get(waLidToJid.get(jid) || '');
  return contact?.name || contact?.verifiedName || contact?.notify || fallback || jid;
}

function upsertContact(contact: Contact) {
  waContacts.set(contact.id, { ...waContacts.get(contact.id), ...contact });
  const phoneJid =
    contact.jid ||
    (contact.id.endsWith('@s.whatsapp.net') ? contact.id : null);
  const lid = contact.id.endsWith('@lid')
    ? contact.id
    : contact.lid
    ? contact.lid.includes('@')
      ? contact.lid
      : `${contact.lid}@lid`
    : null;
  if (lid && phoneJid?.endsWith('@s.whatsapp.net')) waLidToJid.set(lid, phoneJid);
}

function getMessageText(message: WAMessage): string {
  const content = normalizeMessageContent(message.message);
  const type = getContentType(content);
  if (!content || !type) return 'Mensagem sem conteúdo de texto';

  switch (type) {
    case 'conversation':
      return content.conversation || '';
    case 'extendedTextMessage':
      return content.extendedTextMessage?.text || '';
    case 'imageMessage':
      return content.imageMessage?.caption || '📷 Imagem';
    case 'videoMessage':
      return content.videoMessage?.caption || '🎥 Vídeo';
    case 'audioMessage':
      return '🎤 Áudio';
    case 'documentMessage':
      return content.documentMessage?.caption || `📎 ${content.documentMessage?.fileName || 'Documento'}`;
    case 'stickerMessage':
      return 'Figurinha';
    case 'locationMessage':
      return '📍 Localização';
    case 'liveLocationMessage':
      return '📍 Localização em tempo real';
    case 'contactMessage':
    case 'contactsArrayMessage':
      return '👤 Contato';
    default:
      return 'Mensagem não textual';
  }
}

function upsertConversation(
  jid: string,
  update: Omit<Partial<WhatsAppConversationRecord>, 'name'> & { name?: string | null }
) {
  const previous = waConversations.get(jid);
  const isGroup = jid.endsWith('@g.us');
  const resolvedJid = waLidToJid.get(jid) || jid;
  const phone = resolvedJid.endsWith('@s.whatsapp.net')
    ? resolvedJid.split('@')[0].split(':')[0]
    : null;
  waConversations.set(jid, {
    id: jid,
    name: contactName(jid, update.name || previous?.name || phone || jid),
    phone,
    isGroup,
    unreadCount: update.unreadCount ?? previous?.unreadCount ?? 0,
    lastMessage: update.lastMessage ?? previous?.lastMessage ?? '',
    lastMessageTimestamp: update.lastMessageTimestamp ?? previous?.lastMessageTimestamp ?? 0
  });
}

function upsertWhatsAppMessage(message: WAMessage) {
  const jid = message.key.remoteJid;
  const id = message.key.id;
  if (!jid || !id) return;

  const timestamp = Number(message.messageTimestamp || Date.now() / 1000) * 1000;
  const record: WhatsAppMessageRecord = {
    id,
    jid,
    fromMe: Boolean(message.key.fromMe),
    text: getMessageText(message),
    timestamp,
    status: message.status ?? undefined
  };
  const messages = waMessages.get(jid) || [];
  const existingIndex = messages.findIndex((item) => item.id === id);
  if (existingIndex >= 0) messages[existingIndex] = { ...messages[existingIndex], ...record };
  else messages.push(record);
  messages.sort((a, b) => a.timestamp - b.timestamp);
  if (messages.length > 500) messages.splice(0, messages.length - 500);
  waMessages.set(jid, messages);

  const previousConversation = waConversations.get(jid);
  const isLatest = !previousConversation || timestamp >= previousConversation.lastMessageTimestamp;
  upsertConversation(jid, {
    lastMessage: isLatest ? record.text : previousConversation.lastMessage,
    lastMessageTimestamp: isLatest ? timestamp : previousConversation.lastMessageTimestamp,
    unreadCount: message.key.fromMe ? 0 : undefined
  });
}

function phoneDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = `55${digits}`;
  }
  return digits;
}

function isClosedWhatsAppConnectionRejection(reason: unknown): boolean {
  if (!(reason instanceof Error)) return false;
  const error = reason as Error & {
    isBoom?: boolean;
    output?: { statusCode?: number };
  };
  return error.isBoom === true && error.output?.statusCode === DisconnectReason.connectionClosed;
}

process.on('unhandledRejection', (reason) => {
  if (isClosedWhatsAppConnectionRejection(reason)) {
    console.warn('Ignoring a WhatsApp retry operation after its connection closed.');
    return;
  }

  throw reason;
});

// Initialize WhatsApp Baileys Multi-Device Socket
async function initWhatsApp(forceReset = false) {
  if (isInitializing) return;
  isInitializing = true;

  try {
    if (forceReset) {
      if (waSocket) {
        try {
          waSocket.end(undefined);
        } catch {}
        waSocket = null;
      }
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
      waState.status = 'disconnected';
      waState.qrRaw = null;
      waState.qrDataUrl = null;
      waState.user = null;
      waState.historySynced = false;
      waConversations.clear();
      waContacts.clear();
      waMessages.clear();
      waLidToJid.clear();
    }

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    waState.status = 'connecting';
    waState.lastError = null;
    waState.historySynced = false;
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const logger = pino({ level: 'silent' });

    const socket = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['MapLeads CRM', 'Chrome', '124.0.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      syncFullHistory: true
    });
    waSocket = socket;

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messaging-history.set', ({ chats, contacts, messages, isLatest }) => {
      if (waSocket !== socket) return;
      for (const contact of contacts) upsertContact(contact);
      for (const chat of chats) {
        if (!chat.id) continue;
        upsertConversation(chat.id, {
          name: chat.name,
          unreadCount: chat.unreadCount ?? 0,
          lastMessageTimestamp: Number(chat.conversationTimestamp || 0) * 1000
        });
      }
      for (const message of messages) upsertWhatsAppMessage(message);
      for (const [jid, conversation] of waConversations) {
        waConversations.set(jid, { ...conversation, name: contactName(jid, conversation.name) });
      }
      if (isLatest) waState.historySynced = true;
    });

    socket.ev.on('chats.upsert', (chats) => {
      if (waSocket !== socket) return;
      for (const chat of chats) {
        if (!chat.id) continue;
        upsertConversation(chat.id, {
          name: chat.name,
          unreadCount: chat.unreadCount ?? 0,
          lastMessageTimestamp: chat.conversationTimestamp
            ? Number(chat.conversationTimestamp) * 1000
            : undefined
        });
      }
    });

    socket.ev.on('chats.update', (updates) => {
      if (waSocket !== socket) return;
      for (const update of updates) {
        if (!update.id) continue;
        upsertConversation(update.id, {
          name: update.name,
          unreadCount: update.unreadCount ?? undefined,
          lastMessageTimestamp: update.conversationTimestamp
            ? Number(update.conversationTimestamp) * 1000
            : undefined
        });
      }
    });

    socket.ev.on('chats.delete', (jids) => {
      if (waSocket !== socket) return;
      for (const jid of jids) {
        waConversations.delete(jid);
        waMessages.delete(jid);
      }
    });

    socket.ev.on('contacts.upsert', (contacts) => {
      if (waSocket !== socket) return;
      for (const contact of contacts) upsertContact(contact);
    });

    socket.ev.on('contacts.update', (updates) => {
      if (waSocket !== socket) return;
      for (const update of updates) {
        if (!update.id) continue;
        upsertContact({ ...waContacts.get(update.id), ...update, id: update.id });
      }
      for (const [jid, conversation] of waConversations) {
        waConversations.set(jid, { ...conversation, name: contactName(jid, conversation.name) });
      }
    });

    socket.ev.on('messages.upsert', ({ messages }) => {
      if (waSocket !== socket) return;
      for (const message of messages) upsertWhatsAppMessage(message);
    });

    socket.ev.on('messages.update', (updates) => {
      if (waSocket !== socket) return;
      for (const { key, update } of updates) {
        const jid = key.remoteJid;
        const id = key.id;
        if (!jid || !id || update.status === undefined) continue;
        const messages = waMessages.get(jid);
        const message = messages?.find((item) => item.id === id);
        if (message && update.status !== null) message.status = update.status;
      }
    });

    socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      if (waSocket !== socket) return;
      const { connection, lastDisconnect, qr } = update;

      if (qr && waState.status !== 'connected') {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: { dark: '#111b21', light: '#ffffff' }
          });
          if (waSocket !== socket) return;
          waState.qrRaw = qr;
          waState.qrDataUrl = qrDataUrl;
          waState.status = 'qr_ready';
        } catch (err: any) {
          console.error('Error generating QR DataURL:', err?.message);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`WhatsApp connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);

        waState.status = shouldReconnect ? 'connecting' : 'disconnected';
        waState.qrRaw = null;
        waState.qrDataUrl = null;
        waState.user = null;
        waState.historySynced = false;
        waSocket = null;

        if (shouldReconnect) {
          isInitializing = false;
          setTimeout(() => initWhatsApp(false), 3000);
        } else {
          waState.lastError = 'A sessão foi encerrada. Escaneie um novo QR Code para conectar novamente.';
          // Logged out
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          isInitializing = false;
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connection successfully opened!');
        const rawId = socket.user?.id;
        if (!rawId) {
          waState.status = 'disconnected';
          waState.lastError = 'O WhatsApp abriu a conexão sem confirmar a identidade da conta.';
          return;
        }
        const phone = rawId.split(':')[0] || rawId.split('@')[0];
        waState.status = 'connected';
        waState.qrRaw = null;
        waState.qrDataUrl = null;
        waState.user = {
          id: rawId,
          name: socket.user?.name || 'Conexão MapLeads',
          phone: phone ? `+${phone}` : 'Conectado'
        };
        waState.lastConnectedAt = new Date().toISOString();
        waState.lastError = null;
        isInitializing = false;
      }
    });
  } catch (error: any) {
    console.error('Failed to init WhatsApp socket:', error?.message);
    waState.status = 'disconnected';
    waState.lastError = error?.message || 'Falha na inicialização';
  } finally {
    isInitializing = false;
  }
}

// ----------------- API ROUTES ----------------- //

// Status & QR Endpoint
app.get('/api/whatsapp/status', (req: Request, res: Response) => {
  res.json({
    status: waState.status,
    user: waState.user,
    hasQr: !!waState.qrDataUrl,
    qrDataUrl: waState.qrDataUrl,
    lastConnectedAt: waState.lastConnectedAt,
    lastError: waState.lastError,
    historySynced: waState.historySynced,
    conversationCount: waConversations.size
  });
});

app.get('/api/whatsapp/conversations', (req: Request, res: Response) => {
  if (waState.status !== 'connected') {
    return res.status(503).json({ error: 'O WhatsApp não está conectado.' });
  }
  return res.json({
    conversations: [...waConversations.values()].sort(
      (a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp
    )
  });
});

app.get('/api/whatsapp/conversations/:jid/messages', (req: Request, res: Response) => {
  if (waState.status !== 'connected') {
    return res.status(503).json({ error: 'O WhatsApp não está conectado.' });
  }
  const jid = req.params.jid;
  if (
    !jid.endsWith('@s.whatsapp.net') &&
    !jid.endsWith('@g.us') &&
    !jid.endsWith('@lid')
  ) {
    return res.status(400).json({ error: 'Identificador de conversa inválido.' });
  }
  const canonicalJid = waLidToJid.get(jid);
  const messages = [
    ...(waMessages.get(jid) || []),
    ...(canonicalJid ? waMessages.get(canonicalJid) || [] : [])
  ]
    .filter((message, index, all) => all.findIndex((candidate) => candidate.id === message.id) === index)
    .sort((a, b) => a.timestamp - b.timestamp);
  return res.json({ messages });
});

// Trigger connection / Get QR code
app.post('/api/whatsapp/connect', async (req: Request, res: Response) => {
  if (waState.status === 'disconnected' && !isInitializing) {
    initWhatsApp(false);
  }
  // Wait shortly if QR is being generated
  let attempts = 0;
  while (!waState.qrDataUrl && waState.status === 'connecting' && attempts < 10) {
    await new Promise((r) => setTimeout(r, 400));
    attempts++;
  }

  res.json({
    status: waState.status,
    user: waState.user,
    hasQr: !!waState.qrDataUrl,
    qrDataUrl: waState.qrDataUrl,
    lastConnectedAt: waState.lastConnectedAt,
    lastError: waState.lastError,
    historySynced: waState.historySynced,
    conversationCount: waConversations.size
  });
});

// Disconnect / Reset WhatsApp session
app.post('/api/whatsapp/disconnect', async (req: Request, res: Response) => {
  try {
    if (waSocket) {
      try {
        await waSocket.logout();
      } catch {}
      try {
        waSocket.end(undefined);
      } catch {}
      waSocket = null;
    }
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
    waState.status = 'disconnected';
    waState.qrRaw = null;
    waState.qrDataUrl = null;
    waState.user = null;
    waState.lastError = null;
    waState.historySynced = false;
    waConversations.clear();
    waContacts.clear();
    waMessages.clear();
    waLidToJid.clear();

    res.json({ success: true, message: 'WhatsApp desconectado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Send message via connected WhatsApp
app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  try {
    const { jid, phone, message } = req.body;

    if (typeof message !== 'string' || !message.trim() || message.length > 4096) {
      return res.status(400).json({ success: false, error: 'A mensagem deve ter entre 1 e 4096 caracteres.' });
    }
    if (typeof jid !== 'string' && typeof phone !== 'string') {
      return res.status(400).json({ success: false, error: 'Telefone e mensagem são obrigatórios' });
    }

    if (waState.status !== 'connected' || !waSocket) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp não está conectado. Por favor, escaneie o QR Code no painel CRM primeiro.'
      });
    }

    let requestedJid: string | undefined;
    let recipientJid: string;
    if (jid) {
      const validDirectJid = jid.endsWith('@s.whatsapp.net');
      const validLid = jid.endsWith('@lid') && waLidToJid.has(jid);
      const validGroupJid = jid.endsWith('@g.us') && waConversations.has(jid);
      if (!validDirectJid && !validLid && !validGroupJid) {
        return res.status(400).json({ success: false, error: 'Conversa inválida ou não sincronizada.' });
      }
      requestedJid = jid;
      if (validDirectJid || validLid) {
        const phoneJid = validLid ? waLidToJid.get(jid)! : jid;
        const digits = phoneDigits(phoneJid.split('@')[0]);
        const matches = await waSocket.onWhatsApp(digits);
        const match = matches?.find((item) => item.exists && item.jid);
        if (!match?.jid) {
          return res.status(404).json({ success: false, error: 'Este número não possui uma conta WhatsApp disponível.' });
        }
        recipientJid = match.jid;
      } else {
        recipientJid = jid;
      }
    } else {
      const digits = phoneDigits(phone);
      if (digits.length < 8 || digits.length > 15) {
        return res.status(400).json({ success: false, error: 'Informe um número de telefone válido.' });
      }
      const matches = await waSocket.onWhatsApp(digits);
      const match = matches?.find((item) => item.exists && item.jid);
      if (!match?.jid) {
        return res.status(404).json({ success: false, error: 'Este número não possui uma conta WhatsApp disponível.' });
      }
      recipientJid = match.jid;
    }

    const sent = await waSocket.sendMessage(recipientJid, { text: message.trim() });
    if (!sent?.key?.id) {
      return res.status(502).json({
        success: false,
        error: 'O WhatsApp não confirmou o envio da mensagem.'
      });
    }
    upsertWhatsAppMessage(sent);

    return res.json({
      success: true,
      messageId: sent.key.id,
      timestamp: Number(sent.messageTimestamp || Date.now() / 1000) * 1000,
      recipient: requestedJid || recipientJid
    });
  } catch (err: any) {
    console.error('Error sending WhatsApp message:', err?.message);
    return res.status(500).json({
      success: false,
      error: `Erro ao enviar mensagem: ${err?.message || 'Falha no envio'}`
    });
  }
});

// ----------------- START SERVER & VITE ----------------- //

async function startServer() {
  // Start Baileys background initialization so QR is ready when user navigates to CRM
  initWhatsApp(false);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MapLeads Full-Stack Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
