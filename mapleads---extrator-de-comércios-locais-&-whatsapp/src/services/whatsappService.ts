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
}

export class WhatsAppService {
  /**
   * Fetch current WhatsApp connection state and QR code
   */
  static async getStatus(): Promise<WhatsAppStatus> {
    try {
      const res = await fetch('/api/whatsapp/status', {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        status: 'disconnected',
        user: null,
        hasQr: false,
        qrDataUrl: null,
        lastConnectedAt: null,
        lastError: err?.message || 'Falha ao conectar ao servidor local'
      };
    }
  }

  /**
   * Request / Refresh connection and QR code
   */
  static async requestConnect(): Promise<WhatsAppStatus> {
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      return {
        status: 'disconnected',
        user: null,
        hasQr: false,
        qrDataUrl: null,
        lastConnectedAt: null,
        lastError: err?.message || 'Falha ao solicitar conexão'
      };
    }
  }

  /**
   * Disconnect WhatsApp session
   */
  static async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Send WhatsApp message to a phone number via connected session
   */
  static async sendMessage(
    phone: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; recipient?: string }> {
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || `Erro de envio (${res.status})`
        };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro de conexão com o servidor' };
    }
  }

  /**
   * Fast pairing simulation helper for dev/demo testing
   */
  static async mockPair(): Promise<{ success: boolean; user: WhatsAppUser }> {
    try {
      const res = await fetch('/api/whatsapp/mock-pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      throw err;
    }
  }
}
