export interface WhatsAppUser {
  id: string;
  name?: string;
  phone: string;
}

export interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  user: WhatsAppUser | null;
  hasQr: boolean;
  qrDataUrl: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  historySynced: boolean;
  conversationCount: number;
}

export interface WhatsAppConversation {
  id: string;
  name: string;
  phone: string | null;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTimestamp: number;
}

export interface WhatsAppMessage {
  id: string;
  jid: string;
  fromMe: boolean;
  text: string;
  timestamp: number;
  status?: number;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || `Erro HTTP ${response.status}`);
  }
  return body as T;
}

export class WhatsAppService {
  static async getStatus(): Promise<WhatsAppStatus> {
    const response = await fetch('/api/whatsapp/status', {
      headers: { Accept: 'application/json' }
    });
    return readJson<WhatsAppStatus>(response);
  }

  static async requestConnect(): Promise<WhatsAppStatus> {
    const response = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    });
    return readJson<WhatsAppStatus>(response);
  }

  static async getConversations(): Promise<WhatsAppConversation[]> {
    const response = await fetch('/api/whatsapp/conversations', {
      headers: { Accept: 'application/json' }
    });
    const data = await readJson<{ conversations: WhatsAppConversation[] }>(response);
    return data.conversations;
  }

  static async getMessages(jid: string): Promise<WhatsAppMessage[]> {
    const response = await fetch(`/api/whatsapp/conversations/${encodeURIComponent(jid)}/messages`, {
      headers: { Accept: 'application/json' }
    });
    const data = await readJson<{ messages: WhatsAppMessage[] }>(response);
    return data.messages;
  }

  static async disconnect(): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    });
    return readJson<{ success: boolean; error?: string }>(response);
  }

  static async sendMessage(
    recipient: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; recipient?: string }> {
    const body = recipient.includes('@')
      ? { jid: recipient, message }
      : { phone: recipient, message };
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    return readJson<{ success: boolean; messageId?: string; error?: string; recipient?: string }>(response);
  }
}
