import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lead, MessageTemplate, interpolateTemplate } from '../utils/leads.ts';
import {
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppService,
  WhatsAppStatus
} from '../services/whatsappService.ts';
import { WhatsAppQRScanner } from './WhatsAppQRScanner.tsx';
import {
  AlertTriangle,
  CheckCheck,
  Copy,
  ExternalLink,
  LogOut,
  MessageSquare,
  QrCode,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star
} from 'lucide-react';

interface WhatsAppCRMWindowProps {
  leads: Lead[];
  activeLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  templates: MessageTemplate[];
  userName: string;
  onUpdateStatus: (leadId: string, newStatus: Lead['status']) => void;
  onToggleMessageSent: (leadId: string) => void;
}

interface InboxThread {
  id: string;
  name: string;
  phone: string | null;
  isGroup: boolean;
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  lead: Lead | null;
}

const emptyStatus: WhatsAppStatus = {
  status: 'disconnected',
  user: null,
  hasQr: false,
  qrDataUrl: null,
  lastConnectedAt: null,
  lastError: null,
  historySynced: false,
  conversationCount: 0
};

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
    digits = `55${digits}`;
  }
  return digits;
}

function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getMessageStatusLabel(status?: number): string {
  if (status === undefined) return 'enviando';
  if (status >= 4) return 'lida';
  if (status >= 3) return 'recebida';
  return 'enviada';
}

export const WhatsAppCRMWindow: React.FC<WhatsAppCRMWindowProps> = ({
  leads,
  activeLeadId,
  onSelectLead,
  templates,
  userName,
  onUpdateStatus,
  onToggleMessageSent
}) => {
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>(emptyStatus);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedJid, setSelectedJid] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'not_sent' | 'sent'>('all');
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(false);
  const seenMessageIds = useRef<Set<string> | null>(null);
  const lastActiveLeadId = useRef(activeLeadId);
  const selectionInitialized = useRef(false);

  const refreshInbox = async () => {
    try {
      const status = await WhatsAppService.getStatus();
      setWaStatus(status);
      if (status.status === 'connected') {
        const latestConversations = await WhatsAppService.getConversations();
        setConversations((current) => {
          const unchanged =
            current.length === latestConversations.length &&
            current.every((conversation, index) => {
              const latest = latestConversations[index];
              return (
                conversation.id === latest.id &&
                conversation.name === latest.name &&
                conversation.phone === latest.phone &&
                conversation.lastMessage === latest.lastMessage &&
                conversation.lastMessageTimestamp === latest.lastMessageTimestamp &&
                conversation.unreadCount === latest.unreadCount
              );
            });
          return unchanged ? current : latestConversations;
        });
      } else {
        setConversations([]);
        setMessages([]);
      }
      setErrorMessage('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar as conversas.';
      setWaStatus({ ...emptyStatus, lastError: message });
      setConversations([]);
      setMessages([]);
      setErrorMessage(message);
    }
  };

  useEffect(() => {
    void refreshInbox();
    const interval = window.setInterval(() => void refreshInbox(), 2500);
    return () => window.clearInterval(interval);
  }, []);

  const threads = useMemo(() => {
    const leadByPhone = new Map<string, Lead>();
    for (const lead of leads) {
      const phone = normalizePhone(lead.rawPhone || lead.phone);
      if (phone) leadByPhone.set(phone, lead);
    }

    return conversations
      .map((conversation): InboxThread => {
      const lead = conversation.phone ? leadByPhone.get(normalizePhone(conversation.phone)) || null : null;
      return { ...conversation, lead };
      })
      .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
  }, [conversations, leads]);

  const selectedLeadThread = leads.find((lead) => lead.id === activeLeadId);
  const selectedLeadJid = selectedLeadThread
    ? threads.find((thread) => thread.lead?.id === selectedLeadThread.id)?.id || ''
    : '';

  useEffect(() => {
    const leadChanged = lastActiveLeadId.current !== activeLeadId;
    if (leadChanged) lastActiveLeadId.current = activeLeadId;
    if (leadChanged) {
      selectionInitialized.current = true;
      setSelectedJid(selectedLeadJid);
      return;
    }
    if (selectedLeadJid && !selectedJid) {
      selectionInitialized.current = true;
      setSelectedJid(selectedLeadJid);
      return;
    }
    if (!selectionInitialized.current) {
      selectionInitialized.current = true;
      if (activeLeadId) return;
    }
    if (!activeLeadId && !selectedJid && threads.length) {
      setSelectedJid(threads[0].id);
    }
  }, [activeLeadId, selectedLeadJid, threads, selectedJid]);

  useEffect(() => {
    if (waStatus.status !== 'connected' || !selectedJid) {
      setMessages([]);
      return;
    }
    let active = true;
    let requestPending = false;
    seenMessageIds.current = null;
    const refreshMessages = async () => {
      if (requestPending) return;
      requestPending = true;
      try {
        const latest = await WhatsAppService.getMessages(selectedJid);
        if (!active) return;
        const nextIds = new Set(latest.map((message) => message.id));
        const previousIds = seenMessageIds.current;
        const hasNewMessages =
          previousIds !== null && latest.some((message) => !previousIds.has(message.id));
        seenMessageIds.current = nextIds;
        setMessages((current) => {
          const unchanged =
            current.length === latest.length &&
            current.every((message, index) => {
              const next = latest[index];
              return (
                message.id === next.id &&
                message.text === next.text &&
                message.timestamp === next.timestamp &&
                message.status === next.status
              );
            });
          return unchanged ? current : latest;
        });
        if (previousIds === null) {
          requestAnimationFrame(() => {
            const container = messagesContainerRef.current;
            if (!container) return;
            isNearBottom.current =
              container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          });
        } else if (hasNewMessages && isNearBottom.current) {
          requestAnimationFrame(() => {
            const container = messagesContainerRef.current;
            if (!container) return;
            container.scrollTop = container.scrollHeight;
            isNearBottom.current = true;
          });
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Falha ao sincronizar mensagens.');
        }
      } finally {
        requestPending = false;
      }
    };
    void refreshMessages();
    const interval = window.setInterval(() => void refreshMessages(), 2000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [selectedJid, waStatus.status]);

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    isNearBottom.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  };

  const selectedThread = threads.find((thread) => thread.id === selectedJid) || null;
  const canSendToSelectedThread =
    Boolean(selectedThread?.phone) || Boolean(selectedThread?.isGroup);
  const filteredThreads = threads.filter((thread) => {
    if (filterMode === 'not_sent' && thread.lead?.messageSent) return false;
    if (filterMode === 'sent' && !thread.lead?.messageSent) return false;
    const query = contactSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      thread.name.toLowerCase().includes(query) ||
      (thread.phone || '').includes(query) ||
      (thread.lastMessage || '').toLowerCase().includes(query) ||
      Boolean(thread.lead?.neighborhood.toLowerCase().includes(query))
    );
  });

  const showNotice = (message: string, type: 'error' | 'info' = 'info') => {
    if (type === 'error') {
      setErrorMessage(message);
      setInfoMessage('');
    } else {
      setInfoMessage(message);
      setErrorMessage('');
    }
    window.setTimeout(() => {
      setInfoMessage('');
      setErrorMessage('');
    }, 4500);
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !inputMessage.trim() || isSending) return;
    if (waStatus.status !== 'connected') {
      setIsQRModalOpen(true);
      return;
    }

    setIsSending(true);
    try {
      const result = await WhatsAppService.sendMessage(selectedThread.id, inputMessage.trim());
      if (!result.success || !result.messageId || !result.recipient) {
        throw new Error(result.error || 'O WhatsApp não confirmou o envio.');
      }

      setInputMessage('');
      if (result.recipient !== selectedJid) setSelectedJid(result.recipient);
      if (selectedThread.lead) {
        if (!selectedThread.lead.messageSent) onToggleMessageSent(selectedThread.lead.id);
        if (selectedThread.lead.status === 'novo') {
          onUpdateStatus(selectedThread.lead.id, 'contatado');
        }
      }
      showNotice('Mensagem enviada ao WhatsApp. A entrega ao destinatário depende da confirmação do WhatsApp.');
      await refreshInbox();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja desconectar a sessão WhatsApp deste painel?')) return;
    try {
      const result = await WhatsAppService.disconnect();
      if (!result.success) throw new Error(result.error || 'Não foi possível desconectar.');
      await refreshInbox();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Falha ao desconectar.', 'error');
    }
  };

  const handleCopyMessage = async () => {
    if (!inputMessage.trim()) return;
    try {
      await navigator.clipboard.writeText(inputMessage);
      showNotice('Texto copiado.');
    } catch {
      showNotice('Não foi possível copiar o texto para a área de transferência.', 'error');
    }
  };

  const handleOpenExternalWhatsApp = () => {
    if (!selectedThread?.phone) return;
    const phone = normalizePhone(selectedThread.phone);
    const message = inputMessage.trim();
    const url = `https://web.whatsapp.com/send?phone=${phone}${
      message ? `&text=${encodeURIComponent(message)}` : ''
    }`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSelectThread = (thread: InboxThread) => {
    setSelectedJid(thread.id);
    if (thread.lead) onSelectLead(thread.lead.id);
  };

  const handleApplyTemplate = (template: MessageTemplate) => {
    if (!selectedThread?.lead) return;
    setInputMessage(interpolateTemplate(template.content, selectedThread.lead, userName));
  };

  if (!leads.length && !conversations.length && waStatus.status !== 'connected') {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-xl">
        <MessageSquare className="mx-auto mb-3 h-16 w-16 text-emerald-500" />
        <h3 className="text-lg font-bold text-gray-900">Caixa de entrada do WhatsApp</h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">
          Vincule uma sessão para sincronizar as conversas reais ou faça uma busca para selecionar estabelecimentos.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[740px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#008069] px-4 py-2.5 text-xs font-semibold text-white">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                waStatus.status === 'connected' ? 'bg-emerald-300' : 'bg-amber-300'
              }`}
            />
            <span className="font-bold">Caixa MapLeads • Integração WhatsApp não oficial</span>
            <span className="hidden text-[11px] font-normal opacity-90 sm:inline">
              {waStatus.status === 'connected'
                ? `| ${waStatus.user?.phone || 'Sessão vinculada'} • ${
                    waStatus.historySynced
                      ? `${waStatus.conversationCount} conversas sincronizadas`
                      : 'Sincronizando conversas...'
                  }`
                : waStatus.status === 'connecting'
                ? '| Conectando ao WhatsApp...'
                : '| Sessão desconectada'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {waStatus.status === 'connected' ? (
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-[11px] hover:bg-white/30"
              >
                <LogOut className="h-3 w-3" /> Desconectar
              </button>
            ) : (
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-1 rounded bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800"
              >
                <QrCode className="h-3.5 w-3.5" /> Vincular conta
              </button>
            )}
            <button
              onClick={handleOpenExternalWhatsApp}
              disabled={!selectedThread?.phone}
              className="flex items-center gap-1 rounded bg-emerald-950/30 px-2 py-1 text-[11px] hover:bg-emerald-950/50 disabled:opacity-40"
              title="Abre o WhatsApp Web oficial em outra aba; pode exigir login separado"
            >
              <ExternalLink className="h-3 w-3" /> WhatsApp Web oficial
            </button>
          </div>
        </div>

        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] text-amber-900">
          Esta tela não é o aplicativo oficial do WhatsApp. Conversas e mensagens exibidas vêm da sessão vinculada; o conteúdo é processado por este servidor.
        </div>

        {waStatus.status !== 'connected' && (
          <div className="flex items-center justify-between border-b border-amber-200 bg-white px-4 py-2 text-xs text-amber-900">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Vincule uma conta para carregar conversas reais e enviar mensagens.
            </span>
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="ml-2 shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white"
            >
              Abrir QR Code
            </button>
          </div>
        )}

        {(errorMessage || infoMessage || waStatus.lastError) && (
          <div
            role="status"
            className={`border-b px-4 py-2 text-xs ${
              errorMessage || waStatus.lastError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {errorMessage || waStatus.lastError || infoMessage}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="flex w-full shrink-0 flex-col border-r border-gray-200 bg-white md:w-80">
            <div className="border-b border-gray-200 p-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                  placeholder="Pesquisar conversas e estabelecimentos"
                  className="w-full rounded-lg bg-gray-100 py-1.5 pl-9 pr-3 text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="mt-2 flex gap-1 text-[10px]">
                {[
                  ['all', `Todos (${threads.length})`],
                  ['not_sent', 'Pendentes'],
                  ['sent', 'Enviados']
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode as typeof filterMode)}
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      filterMode === mode ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleSelectThread(thread)}
                  className={`flex w-full items-start gap-3 p-3 text-left hover:bg-gray-50 ${
                    selectedJid === thread.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                    {thread.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-gray-900">{thread.name}</span>
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {formatTime(thread.lastMessageTimestamp)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                      {thread.lastMessage || thread.phone || 'Nova conversa'}
                    </span>
                    <span className="mt-1 flex items-center gap-1">
                      {thread.isGroup && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-600">Grupo</span>
                      )}
                      {thread.lead && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-800">
                          {thread.lead.category}
                        </span>
                      )}
                      {thread.lead?.interest === 'interessante' && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      )}
                    </span>
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </button>
              ))}
              {filteredThreads.length === 0 && (
                <p className="p-5 text-center text-xs text-gray-500">
                  {waStatus.status === 'connected' && waStatus.historySynced
                    ? 'Nenhuma conversa ou estabelecimento encontrado.'
                    : 'Aguardando conversas do WhatsApp vinculado.'}
                </p>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#efeae2]">
            {selectedThread ? (
              <>
                <header className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                    {selectedThread.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-bold text-gray-900">{selectedThread.name}</h2>
                    <p className="truncate text-[11px] text-gray-500">
                      {selectedThread.phone || selectedThread.id}
                      {selectedThread.lead
                        ? ` • ${selectedThread.lead.neighborhood}, ${selectedThread.lead.city}`
                        : ''}
                    </p>
                  </div>
                  {selectedThread.lead && (
                    <select
                      value={selectedThread.lead.status}
                      onChange={(event) =>
                        onUpdateStatus(selectedThread.lead!.id, event.target.value as Lead['status'])
                      }
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                      aria-label="Etapa do lead"
                    >
                      <option value="novo">Novo Lead</option>
                      <option value="contatado">Contatado</option>
                      <option value="negociacao">Em Negociação</option>
                      <option value="convertido">Convertido</option>
                      <option value="perdido">Perdido</option>
                    </select>
                  )}
                </header>

                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="flex-1 space-y-3 overflow-y-auto p-4"
                >
                  <div className="mx-auto max-w-lg rounded-lg bg-[#fff4d2] px-3 py-2 text-center text-[10px] text-gray-600">
                    <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                    Exibindo mensagens recebidas da sessão vinculada. Não é uma interface oficial do WhatsApp.
                  </div>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-sm ${
                          message.fromMe
                            ? 'rounded-tr-sm bg-[#d9fdd3] text-gray-900'
                            : 'rounded-tl-sm bg-white text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-500">
                          <span>{formatTime(message.timestamp)}</span>
                          {message.fromMe && (
                            <span title={`Status: ${getMessageStatusLabel(message.status)}`}>
                              <CheckCheck className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!messages.length && (
                    <div className="flex h-48 flex-col items-center justify-center text-center text-gray-500">
                      <MessageSquare className="mb-2 h-10 w-10 text-emerald-600 opacity-50" />
                      <p className="text-xs font-medium">
                        {waStatus.status === 'connected'
                          ? 'Nenhuma mensagem sincronizada nesta conversa.'
                          : 'Conecte a sessão para visualizar mensagens reais.'}
                      </p>
                    </div>
                  )}
                </div>

                {selectedThread.lead && templates.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto border-t border-gray-200 bg-white px-3 py-2">
                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-gray-500">
                      <Sparkles className="h-3 w-3 text-amber-500" /> Modelos:
                    </span>
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"
                        title={template.title}
                      >
                        {template.title.split('&')[0]}
                      </button>
                    ))}
                  </div>
                )}

                <footer className="flex items-end gap-2 border-t border-gray-200 bg-gray-100 p-3">
                  <button
                    onClick={() => void handleCopyMessage()}
                    disabled={!inputMessage.trim()}
                    className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 disabled:opacity-40"
                    title="Copiar texto"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <textarea
                    rows={2}
                    value={inputMessage}
                    onChange={(event) => setInputMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder={
                      canSendToSelectedThread
                        ? `Mensagem para ${selectedThread.name}...`
                        : 'Esta conversa sincronizada é somente leitura'
                    }
                    className="min-w-0 flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => void handleSendMessage()}
                    disabled={
                      !inputMessage.trim() ||
                      isSending ||
                      waStatus.status !== 'connected' ||
                      !canSendToSelectedThread
                    }
                    className="flex shrink-0 items-center justify-center rounded-full bg-[#00a884] p-3 text-white shadow-md disabled:opacity-40"
                    title="Enviar mensagem pelo WhatsApp vinculado"
                  >
                    {isSending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-xs text-gray-500">
                {waStatus.status === 'connected'
                  ? 'Selecione uma conversa sincronizada do WhatsApp na lista.'
                  : 'Vincule seu WhatsApp para carregar as conversas.'}
              </div>
            )}
          </section>
        </div>
      </div>

      <WhatsAppQRScanner
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onConnected={() => {
          setIsQRModalOpen(false);
          void refreshInbox();
        }}
      />
    </>
  );
};
