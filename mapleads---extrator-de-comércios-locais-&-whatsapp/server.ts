import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import QRCode from 'qrcode';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  ConnectionState
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
}

const waState: WhatsAppState = {
  status: 'disconnected',
  qrRaw: null,
  qrDataUrl: null,
  user: null,
  lastError: null,
  lastConnectedAt: null
};

let waSocket: WASocket | null = null;
let isInitializing = false;

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
    }

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    waState.status = 'connecting';
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const logger = pino({ level: 'silent' });

    waSocket = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['MapLeads CRM', 'Chrome', '124.0.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    waSocket.ev.on('creds.update', saveCreds);

    waSocket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && waState.status !== 'connected') {
        waState.qrRaw = qr;
        try {
          waState.qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: { dark: '#111b21', light: '#ffffff' }
          });
          waState.status = 'qr_ready';
        } catch (err: any) {
          console.error('Error generating QR DataURL:', err?.message);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`WhatsApp connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);

        waState.status = 'disconnected';
        waState.qrRaw = null;
        waState.qrDataUrl = null;
        waState.user = null;

        if (shouldReconnect) {
          isInitializing = false;
          setTimeout(() => initWhatsApp(false), 3000);
        } else {
          // Logged out
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          isInitializing = false;
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connection successfully opened!');
        const rawId = waSocket?.user?.id || '';
        const phone = rawId.split(':')[0] || rawId.split('@')[0];
        waState.status = 'connected';
        waState.qrRaw = null;
        waState.qrDataUrl = null;
        waState.user = {
          id: rawId,
          name: waSocket?.user?.name || 'Conexão MapLeads',
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
    lastError: waState.lastError
  });
});

// Trigger connection / Get QR code
app.post('/api/whatsapp/connect', async (req: Request, res: Response) => {
  if (waState.status !== 'connected' && waState.status !== 'qr_ready') {
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
    qrDataUrl: waState.qrDataUrl
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

    res.json({ success: true, message: 'WhatsApp desconectado com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Send message via connected WhatsApp
app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Telefone e mensagem são obrigatórios' });
    }

    if (waState.status !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp não está conectado. Por favor, escaneie o QR Code no painel CRM primeiro.'
      });
    }

    // Format phone to WhatsApp JID: 5521999999999@s.whatsapp.net
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
      cleanPhone = `55${cleanPhone}`;
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;
    let messageId = `msg-${Date.now()}`;
    let timestamp = Date.now();

    if (waSocket && waState.user?.id !== '5521998877665@s.whatsapp.net') {
      try {
        const sent = await waSocket.sendMessage(jid, { text: message.trim() });
        messageId = sent?.key?.id || messageId;
        timestamp = (sent?.messageTimestamp as number) || timestamp;
      } catch (socketErr: any) {
        console.error('Socket send error:', socketErr?.message);
        return res.status(500).json({
          success: false,
          error: `Erro ao enviar via WhatsApp conectado: ${socketErr?.message || 'Falha no envio'}`
        });
      }
    }

    return res.json({
      success: true,
      messageId,
      timestamp,
      recipient: cleanPhone
    });
  } catch (err: any) {
    console.error('Error sending WhatsApp message:', err?.message);
    return res.status(500).json({
      success: false,
      error: `Erro ao enviar mensagem: ${err?.message || 'Falha no envio'}`
    });
  }
});

// Test pairing simulation (for quick UI testing when phone is not immediately accessible)
app.post('/api/whatsapp/mock-pair', (req: Request, res: Response) => {
  waState.status = 'connected';
  waState.qrRaw = null;
  waState.qrDataUrl = null;
  waState.user = {
    id: '5521998877665@s.whatsapp.net',
    name: 'MapLeads Comercial',
    phone: '+55 21 99887-7665'
  };
  waState.lastConnectedAt = new Date().toISOString();
  res.json({ success: true, user: waState.user });
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
