import React, { useState, useEffect, useRef } from 'react';
import { Lead, MessageTemplate, ChatMessage, interpolateTemplate, buildWhatsAppLink } from '../utils/leads.ts';
import { WhatsAppService, WhatsAppStatus } from '../services/whatsappService.ts';
import { WhatsAppQRScanner } from './WhatsAppQRScanner.tsx';
import {
  MessageSquare,
  Search,
  Send,
  CheckCheck,
  Sparkles,
  Copy,
  ExternalLink,
  ShieldCheck,
  Star,
  Bot,
  QrCode,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
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

const STORAGE_CHATS_KEY = 'mapleads_whatsapp_chats_v1';

export const WhatsAppCRMWindow: React.FC<WhatsAppCRMWindowProps> = ({
  leads,
  activeLeadId,
  onSelectLead,
  templates,
  userName,
  onUpdateStatus,
  onToggleMessageSent
}) => {
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [inputMessage, setInputMessage] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'not_sent' | 'sent'>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Live WhatsApp Connection State
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    user: null,
    hasQr: false,
    qrDataUrl: null,
    lastConnectedAt: null,
    lastError: null
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll WhatsApp status
  const updateWaStatus = async () => {
    try {
      const status = await WhatsAppService.getStatus();
      setWaStatus(status);
    } catch {}
  };

  useEffect(() => {
    updateWaStatus();
    const interval = setInterval(updateWaStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(chats));
    } catch {}
  }, [chats]);

  // Current active lead
  const currentLead = leads.find(l => l.id === activeLeadId) || leads[0] || null;

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentLead?.id, chats[currentLead?.id || '']]);

  // If active lead has no messages yet and user selects a template, pre-populate
  useEffect(() => {
    if (currentLead && templates.length > 0 && !inputMessage.trim()) {
      const defaultTpl = templates[0];
      const interpolated = interpolateTemplate(defaultTpl.content, currentLead, userName);
      setInputMessage(interpolated);
    }
  }, [currentLead?.id]);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // Send message via connected WhatsApp socket or fallback
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentLead || isSending) return;

    // If WhatsApp is NOT connected, invite the user to scan the QR code
    if (waStatus.status !== 'connected') {
      setIsQRModalOpen(true);
      return;
    }

    setIsSending(true);

    try {
      const result = await WhatsAppService.sendMessage(currentLead.phone, inputMessage.trim());

      if (result.success) {
        const newMsg: ChatMessage = {
          id: result.messageId || `msg-${Date.now()}`,
          leadId: currentLead.id,
          sender: 'user',
          text: inputMessage.trim(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        };

        setChats(prev => ({
          ...prev,
          [currentLead.id]: [...(prev[currentLead.id] || []), newMsg]
        }));

        if (!currentLead.messageSent) {
          onToggleMessageSent(currentLead.id);
        }
        if (currentLead.status === 'novo') {
          onUpdateStatus(currentLead.id, 'contatado');
        }

        setInputMessage('');
        showToast('success', `✓ Mensagem enviada com sucesso para ${currentLead.name} via WhatsApp oficial!`);
      } else {
        showToast('error', `Falha no envio: ${result.error || 'Verifique a conexão do aparelho'}`);
      }
    } catch (err: any) {
      showToast('error', `Erro ao disparar mensagem: ${err?.message || 'Falha de rede'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyTemplate = (tpl: MessageTemplate) => {
    if (!currentLead) return;
    const interpolated = interpolateTemplate(tpl.content, currentLead, userName);
    setInputMessage(interpolated);
  };

  const handleCopyMessage = () => {
    if (!inputMessage.trim()) return;
    navigator.clipboard.writeText(inputMessage);
    showToast('info', 'Mensagem copiada para a área de transferência');
  };

  // Open in official external WhatsApp Web with the customized message
  const handleOpenExternalWhatsApp = () => {
    if (!currentLead) return;
    const url = buildWhatsAppLink(currentLead.rawPhone, inputMessage);
    window.open(url, '_blank');
    if (!currentLead.messageSent) {
      onToggleMessageSent(currentLead.id);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja desconectar seu WhatsApp do painel?')) return;
    await WhatsAppService.disconnect();
    await updateWaStatus();
    showToast('info', 'WhatsApp desconectado.');
  };

  // Simulate a realistic incoming response for testing CRM & chats
  const handleSimulateReply = () => {
    if (!currentLead) return;
    const sampleReplies = [
      'Olá! Tudo bem? Recebemos sua mensagem. Poderia me enviar mais detalhes da proposta?',
      'Boa tarde! Temos interesse sim. Qual seria o valor do investimento para nosso comércio?',
      'Oi, tudo bem? Podemos agendar uma ligação amanhã às 15h?',
      'Olá! Gostei muito da abordagem. Vocês atendem presencialmente aqui no bairro?',
      'Obrigado pelo contato! Pode nos enviar um portfólio no WhatsApp?'
    ];
    const text = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];

    const replyMsg: ChatMessage = {
      id: `reply-${Date.now()}`,
      leadId: currentLead.id,
      sender: 'lead',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };

    setChats(prev => ({
      ...prev,
      [currentLead.id]: [...(prev[currentLead.id] || []), replyMsg]
    }));

    onUpdateStatus(currentLead.id, 'negociacao');
    showToast('info', `Nova resposta recebida de ${currentLead.name}!`);
  };

  // Filter contacts
  const filteredContacts = leads.filter(l => {
    if (filterMode === 'not_sent' && l.messageSent) return false;
    if (filterMode === 'sent' && !l.messageSent) return false;
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.neighborhood.toLowerCase().includes(q);
    }
    return true;
  });

  const activeMessages = currentLead ? chats[currentLead.id] || [] : [];

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xl">
        <MessageSquare className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900">WhatsApp Integrado no MapLeads</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
          Nenhum comércio foi encontrado ainda. Faça uma busca no topo para carregar seus leads diretamente para cá.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[740px] transition-all">
        {/* Top Brand & Connection Bar */}
        <div className="bg-[#00a884] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                waStatus.status === 'connected'
                  ? 'bg-emerald-300 animate-pulse'
                  : 'bg-amber-300 animate-ping'
              }`}
            ></span>
            <span className="font-bold tracking-wide">WhatsApp Web • MapLeads CRM Hub</span>
            <span className="hidden sm:inline opacity-80 text-[11px] font-normal">
              {waStatus.status === 'connected'
                ? `| Conectado como ${waStatus.user?.phone || 'Aparelho Vinculado'}`
                : '| Escaneie o QR Code para conectar seu aparelho oficial'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {waStatus.status === 'connected' ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded text-emerald-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Sessão Oficial Ativa</span>
                </span>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Desconectar aparelho do painel"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Desconectar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-1 bg-white text-[#00a884] hover:bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Escanear QR Code</span>
              </button>
            )}

            <button
              onClick={handleOpenExternalWhatsApp}
              className="flex items-center gap-1 bg-emerald-800/40 hover:bg-emerald-800/60 text-white px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
              title="Abrir no WhatsApp Web externo em nova aba"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">wa.me</span>
            </button>
          </div>
        </div>

        {/* Inline QR Notice if not connected */}
        {waStatus.status !== 'connected' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Aparelho não conectado:</strong> Para enviar mensagens diretamente pelo CRM, vincule seu WhatsApp oficial.
              </span>
            </div>
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shrink-0 ml-2"
            >
              Abrir QR Code de Conexão
            </button>
          </div>
        )}

        {/* Main Split Container: Left Contact List & Right Live Chat */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Contact list */}
          <div className="w-full md:w-80 border-r border-gray-200 bg-[#f0f2f5] flex flex-col shrink-0">
            {/* Search bar inside contacts */}
            <div className="p-2.5 bg-white border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Pesquisar conversa ou comércio..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#f0f2f5] border-0 rounded-lg text-xs text-gray-800 placeholder-gray-500 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Quick filter buttons */}
              <div className="flex items-center gap-1 mt-2 text-[10px]">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                    filterMode === 'all' ? 'bg-[#00a884] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos ({leads.length})
                </button>
                <button
                  onClick={() => setFilterMode('not_sent')}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                    filterMode === 'not_sent' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setFilterMode('sent')}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                    filterMode === 'sent' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Enviados
                </button>
              </div>
            </div>

            {/* Contacts Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
              {filteredContacts.map((contact) => {
                const contactMsgs = chats[contact.id] || [];
                const lastMsg = contactMsgs[contactMsgs.length - 1];
                const isSelected = currentLead?.id === contact.id;

                return (
                  <div
                    key={contact.id}
                    onClick={() => onSelectLead(contact.id)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors hover:bg-[#f5f6f6] ${
                      isSelected ? 'bg-[#f0f2f5]' : ''
                    }`}
                  >
                    {/* Avatar with initials */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-gray-900 truncate">{contact.name}</h4>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                          {lastMsg?.timestamp || ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-gray-500 truncate">
                          {lastMsg ? lastMsg.text : `${contact.neighborhood} • ${contact.phone}`}
                        </p>
                        {contact.messageSent && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-1" />
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">
                          {contact.category}
                        </span>
                        {contact.interest === 'interessante' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Top Lead
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Active Live WhatsApp Chat Window */}
          {currentLead ? (
            <div className="flex-1 flex flex-col bg-[#efeae2] relative overflow-hidden">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#f0f2f5] p-3 border-b border-gray-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {currentLead.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900">{currentLead.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                        {currentLead.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="font-medium text-emerald-700">{currentLead.phone}</span>
                      <span>•</span>
                      <span>{currentLead.neighborhood}, {currentLead.city}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateReply}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 text-[11px] font-medium rounded-lg border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                    title="Simula uma resposta realista do cliente para testar o funil"
                  >
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                    <span>Simular Resposta</span>
                  </button>

                  <select
                    value={currentLead.status}
                    onChange={(e) => onUpdateStatus(currentLead.id, e.target.value as Lead['status'])}
                    className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1 font-semibold text-gray-800 cursor-pointer shadow-2xs"
                  >
                    <option value="novo">Novo Lead</option>
                    <option value="contatado">Contatado</option>
                    <option value="negociacao">Em Negociação</option>
                    <option value="convertido">Convertido</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
              </div>

              {/* Chat Messages Container with WhatsApp Background Texture */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                  backgroundImage: `radial-gradient(#d1d7db 0.75px, transparent 0.75px)`,
                  backgroundSize: '16px 16px'
                }}
              >
                {/* Security & Encryption Notice */}
                <div className="flex justify-center my-2">
                  <div className="bg-[#ffeecd] text-[#54656f] text-[10px] font-medium px-3 py-1.5 rounded-lg shadow-2xs max-w-sm text-center">
                    🔒 Mensagens com criptografia de ponta a ponta vinculadas ao seu WhatsApp.
                  </div>
                </div>

                {activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-emerald-600" />
                    <p className="text-xs font-medium text-gray-600">Nenhuma mensagem enviada ainda para este comércio.</p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                      Escolha um modelo de mensagem abaixo ou digite seu texto para iniciar o contato comercial.
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl shadow-xs text-xs relative ${
                            isUser
                              ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-xs'
                              : 'bg-white text-gray-900 rounded-tl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500">
                            <span>{msg.timestamp}</span>
                            {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Template Selector Bar (One-click message filling) */}
              <div className="bg-white/95 border-t border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 shrink-0 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Modelos:
                </span>
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
                    title={tpl.title}
                  >
                    {tpl.title.split('&')[0]}
                  </button>
                ))}
              </div>

              {/* Bottom Message Input Bar */}
              <div className="bg-[#f0f2f5] p-3 border-t border-gray-200 flex items-end gap-2 shrink-0">
                {/* Copy button */}
                <button
                  onClick={handleCopyMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                  title="Copiar texto da mensagem"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Text Input */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500">
                  <textarea
                    rows={2}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Escreva uma mensagem para ${currentLead.name}... (Enter para enviar)`}
                    className="w-full text-xs text-gray-900 placeholder-gray-400 border-0 focus:outline-hidden resize-none"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isSending}
                  className="p-3 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:bg-[#007a5e] text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center justify-center"
                  title={waStatus.status === 'connected' ? 'Enviar mensagem direta pelo WhatsApp' : 'Conectar WhatsApp para enviar'}
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Toast Notification */}
              {notification && (
                <div
                  className={`absolute top-16 right-6 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xl animate-in fade-in z-20 flex items-center gap-2 ${
                    notification.type === 'success'
                      ? 'bg-emerald-800 text-white'
                      : notification.type === 'error'
                      ? 'bg-red-800 text-white'
                      : 'bg-gray-900 text-white'
                  }`}
                >
                  {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                  {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-300" />}
                  <span>{notification.text}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">
              Selecione um contato na lista à esquerda para conversar.
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Official QR Code Connection Modal */}
      <WhatsAppQRScanner
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onConnected={() => {
          setIsQRModalOpen(false);
          updateWaStatus();
          showToast('success', 'WhatsApp Oficial vinculado com sucesso!');
        }}
      />
    </>
  );
};
