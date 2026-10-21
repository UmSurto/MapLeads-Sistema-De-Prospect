import React, { useEffect, useState } from 'react';
import { WhatsAppService, WhatsAppStatus } from '../services/whatsappService.ts';
import {
  QrCode,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LogOut
} from 'lucide-react';

interface WhatsAppQRScannerProps {
  onConnected?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isInline?: boolean;
}

export const WhatsAppQRScanner: React.FC<WhatsAppQRScannerProps> = ({
  onConnected,
  isOpen = true,
  onClose,
  isInline = false
}) => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    user: null,
    hasQr: false,
    qrDataUrl: null,
    lastConnectedAt: null,
    lastError: null,
    historySynced: false,
    conversationCount: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll status every 2.5 seconds
  const checkStatus = async () => {
    try {
      const data = await WhatsAppService.getStatus();
      setStatus(data);
      if (data.status === 'connected') {
        onConnected?.();
      }
    } catch (err: any) {
      const message = err?.message || 'Erro ao verificar status';
      setStatus((current) => ({
        ...current,
        status: 'disconnected',
        user: null,
        hasQr: false,
        qrDataUrl: null,
        lastError: message
      }));
      setErrorMessage(message);
    }
  };

  useEffect(() => {
    // Initial request / connection trigger
    WhatsAppService.requestConnect()
      .then(data => {
        setStatus(data);
        if (data.status === 'connected') onConnected?.();
      })
      .catch(err => {
        const message = err.message || 'Não foi possível iniciar a conexão.';
        setStatus((current) => ({
          ...current,
          status: 'disconnected',
          user: null,
          hasQr: false,
          qrDataUrl: null,
          lastError: message
        }));
        setErrorMessage(message);
      });

    const interval = setInterval(checkStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown for QR refresh
  useEffect(() => {
    if (status.status === 'connected') return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          WhatsAppService.requestConnect()
            .then(setStatus)
            .catch(err => setErrorMessage(err.message || 'Não foi possível atualizar o QR Code.'));
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status.status]);

  const handleRefreshQR = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await WhatsAppService.requestConnect();
      setStatus(res);
      setTimerSeconds(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao atualizar QR Code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar seu WhatsApp do painel?')) return;
    setIsLoading(true);
    try {
      await WhatsAppService.disconnect();
      await checkStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-gray-200 shadow-2xl relative">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00a884] to-[#008069] flex items-center justify-center text-white shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Vincular uma conta WhatsApp</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                status.status === 'connected'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {status.status === 'connected'
                  ? 'SESSÃO CONECTADA'
                  : status.status === 'connecting'
                  ? 'CONECTANDO'
                  : status.status === 'qr_ready'
                  ? 'AGUARDANDO QR'
                  : 'DESCONECTADO'}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pareamento via Baileys, uma integração de terceiros não oficial.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Body: QR Code vs Connected state */}
      {status.status === 'connected' ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Sessão vinculada</h3>
            <p className="text-xs text-gray-600 mt-1">
              Aparelho vinculado: <strong className="text-emerald-700">{status.user?.phone || 'Dispositivo Ativo'}</strong>
              {status.user?.name && ` (${status.user.name})`}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {status.historySynced
                ? `${status.conversationCount} conversas recebidas do WhatsApp vinculado.`
                : 'A sessão abriu. Aguardando a sincronização das conversas do aparelho.'}
            </p>
            <p className="text-[11px] text-amber-700 mt-2 max-w-lg mx-auto">
              Esta não é a interface oficial do WhatsApp. Para integração oficial da Meta, é necessário configurar a WhatsApp Business Platform.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Continuar para as Conversas
              </button>
            )}
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar Aparelho</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Instructions Column (Left) */}
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Como conectar seu WhatsApp:</span>
            </h3>

            <ol className="space-y-3 text-xs text-gray-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <span>Abra o <strong>WhatsApp</strong> no seu smartphone.</span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Toque em <strong>Mais opções</strong> (⋮ no Android) ou <strong>Configurações</strong> (⚙ no iPhone).
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <span>Toque em <strong>Aparelhos Conectados</strong>.</span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  Toque no botão verde <strong>Conectar um Aparelho</strong> e aponte a câmera para o QR Code ao lado.
                </span>
              </li>
            </ol>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Integração de terceiros:</strong> este app usa Baileys para vincular o dispositivo. Não é o WhatsApp Web oficial nem a API oficial da Meta.
              </span>
            </div>
          </div>

          {/* QR Code Column (Right) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center bg-gray-50 p-6 rounded-2xl border border-gray-200 relative">
            {status.qrDataUrl ? (
              <div className="relative group">
                <div className="p-2 bg-white rounded-2xl shadow-lg border border-gray-200">
                  <img
                    src={status.qrDataUrl}
                    alt="QR Code do pareamento Baileys"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                </div>

                {/* Reload badge if timer running low */}
                <div className="mt-3 flex items-center justify-between w-full text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    QR ativo ({timerSeconds}s)
                  </span>
                  <button
                    onClick={handleRefreshQR}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Recarregar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-52 h-52 flex flex-col items-center justify-center text-center p-4">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
                <span className="text-xs font-bold text-gray-800">Aguardando QR Code...</span>
                <span className="text-[11px] text-gray-500 mt-1">Solicitando código à integração Baileys</span>
                <button
                  onClick={handleRefreshQR}
                  className="mt-4 px-3 py-1 bg-white border border-gray-300 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );

  if (isInline) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {content}
    </div>
  );
};
