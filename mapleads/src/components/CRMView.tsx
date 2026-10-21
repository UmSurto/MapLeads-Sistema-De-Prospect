import React, { useState } from 'react';
import { Lead, MessageTemplate, generateCRMExportCSV, computeLeadMetrics } from '../utils/leads.ts';
import { WhatsAppCRMWindow } from './WhatsAppCRMWindow.tsx';
import {
  Kanban,
  Download,
  Send,
  CheckCircle2,
  Phone,
  MessageCircle,
  Zap,
  Globe,
  Star,
  LayoutGrid,
  Columns3,
  Bot
} from 'lucide-react';

interface CRMViewProps {
  leads: Lead[];
  onUpdateStatus: (leadId: string, newStatus: Lead['status']) => void;
  onOpenWhatsAppModal: (lead: Lead) => void;
  templates: MessageTemplate[];
  userName: string;
  onToggleMessageSent: (leadId: string) => void;
}

const STAGES: { key: Lead['status']; title: string; color: string; border: string; bg: string }[] = [
  { key: 'novo', title: 'Novos Leads', color: 'text-gray-700', border: 'border-gray-300', bg: 'bg-gray-100' },
  { key: 'contatado', title: 'Contato Feito', color: 'text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50' },
  { key: 'negociacao', title: 'Em Negociação', color: 'text-purple-700', border: 'border-purple-300', bg: 'bg-purple-50' },
  { key: 'convertido', title: 'Fechado / Convertido', color: 'text-emerald-700', border: 'border-emerald-300', bg: 'bg-emerald-50' },
  { key: 'perdido', title: 'Sem Resposta / Perdido', color: 'text-red-700', border: 'border-red-300', bg: 'bg-red-50' }
];

export const CRMView: React.FC<CRMViewProps> = ({
  leads,
  onUpdateStatus,
  onOpenWhatsAppModal,
  templates,
  userName,
  onToggleMessageSent
}) => {
  const [crmTab, setCrmTab] = useState<'whatsapp' | 'kanban' | 'split'>('whatsapp');
  const [activeChatLeadId, setActiveChatLeadId] = useState<string | null>(leads[0]?.id || null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const metrics = computeLeadMetrics(leads);

  const handleTriggerWebhook = async () => {
    if (!webhookUrl.trim()) {
      alert('Por favor, informe a URL do seu Webhook (ex: n8n, Make, Zapier ou CRM).');
      return;
    }
    setIsSendingWebhook(true);
    setWebhookStatus(null);
    try {
      const payload = {
        app: 'MapLeads',
        event: 'leads_export',
        exportedAt: new Date().toISOString(),
        totalLeads: leads.length,
        leads: leads.map(l => ({
          name: l.name,
          phone: l.phone,
          rawPhone: l.rawPhone,
          neighborhood: l.neighborhood,
          city: l.city,
          hasWebsite: l.hasWebsite,
          websiteUrl: l.websiteUrl,
          category: l.category,
          rating: l.rating,
          status: l.status,
          messageSent: l.messageSent,
          interest: l.interest
        }))
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });

      setWebhookStatus('sucesso');
      setTimeout(() => setWebhookStatus(null), 5000);
    } catch {
      setWebhookStatus('erro');
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const downloadHubspot = () => {
    const csv = generateCRMExportCSV(leads, 'hubspot');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hubspot_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadRDStation = () => {
    const csv = generateCRMExportCSV(leads, 'rdstation');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rdstation_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenChatForLead = (leadId: string) => {
    setActiveChatLeadId(leadId);
    setCrmTab('whatsapp');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Navigation View Modes */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Central CRM & WhatsApp
            </span>
            <span className="text-xs text-gray-500">• {leads.length} estabelecimentos carregados</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Painel CRM & WhatsApp Integrado
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Converse diretamente com seus leads dentro do MapLeads, envie mensagens personalizadas e gerencie seu funil comercial.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setCrmTab('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                crmTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Integrado</span>
            </button>

            <button
              onClick={() => setCrmTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                crmTab === 'split'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns3 className="w-4 h-4" />
              <span>Visão Dividida</span>
            </button>

            <button
              onClick={() => setCrmTab('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                crmTab === 'kanban'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Funil Kanban</span>
            </button>
          </div>

          <button
            onClick={downloadHubspot}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>HubSpot</span>
          </button>

          <button
            onClick={downloadRDStation}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>RD Station</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: WHATSAPP INTEGRADO FULL WINDOW */}
      {crmTab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <strong>Integração de terceiros:</strong> As conversas só aparecem após o vínculo real da conta. Esta não é a interface oficial do WhatsApp.
            </span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">Baileys • Não oficial</span>
          </div>

          <WhatsAppCRMWindow
            leads={leads}
            activeLeadId={activeChatLeadId}
            onSelectLead={setActiveChatLeadId}
            templates={templates}
            userName={userName}
            onUpdateStatus={onUpdateStatus}
            onToggleMessageSent={onToggleMessageSent}
          />
        </div>
      )}

      {/* VIEW 2: SPLIT VIEW (KANBAN ON LEFT + WHATSAPP ON RIGHT) */}
      {crmTab === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Compact Kanban Funnel */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
              <span>Selecione no Funil para Conversar</span>
              <span className="text-[11px] font-normal text-gray-500">{leads.length} leads</span>
            </h3>

            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setActiveChatLeadId(lead.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                    activeChatLeadId === lead.id
                      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate">{lead.name}</span>
                      {lead.rating > 0 && (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {lead.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{lead.neighborhood} • {lead.phone}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      lead.status === 'convertido'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lead.status === 'contatado'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {lead.status.toUpperCase()}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Embedded WhatsApp Window */}
          <div className="lg:col-span-7">
            <WhatsAppCRMWindow
              leads={leads}
              activeLeadId={activeChatLeadId}
              onSelectLead={setActiveChatLeadId}
              templates={templates}
              userName={userName}
              onUpdateStatus={onUpdateStatus}
              onToggleMessageSent={onToggleMessageSent}
            />
          </div>
        </div>
      )}

      {/* VIEW 3: FULL KANBAN BOARD */}
      {crmTab === 'kanban' && (
        <div className="space-y-6">
          {/* Conversion Funnel Summary Banner */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <span>Taxa de Conversão da Rodada: <strong className="text-blue-700">{metrics.conversionRate}%</strong></span>
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <span>Novos: <strong className="text-gray-800">{metrics.statusCounts.novo}</strong></span>
              <span>Contatados: <strong className="text-blue-600">{metrics.statusCounts.contatado}</strong></span>
              <span>Em Negociação: <strong className="text-purple-600">{metrics.statusCounts.negociacao}</strong></span>
              <span>Convertidos: <strong className="text-emerald-600">{metrics.statusCounts.convertido}</strong></span>
            </div>
          </div>

          {/* Kanban Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter(l => l.status === stage.key);
              return (
                <div
                  key={stage.key}
                  className="bg-gray-50/80 rounded-2xl border border-gray-200 p-3 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-2 mb-2 rounded-xl bg-white border border-gray-100 shadow-2xs">
                    <span className={`text-xs font-bold ${stage.color}`}>{stage.title}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                    {stageLeads.length === 0 ? (
                      <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-center p-3 text-[11px] text-gray-400">
                        Nenhum comércio nesta etapa
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                                {lead.category}
                              </span>
                              <span className="text-[10px] text-gray-400">{lead.neighborhood}</span>
                            </div>

                            <h4 className="font-bold text-xs text-gray-900 leading-snug line-clamp-1">{lead.name}</h4>
                            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>

                          {/* Action buttons on card */}
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                            <select
                              value={lead.status}
                              onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
                              className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-1 text-gray-700 font-semibold cursor-pointer"
                            >
                              <option value="novo">Novo</option>
                              <option value="contatado">Contatado</option>
                              <option value="negociacao">Negociação</option>
                              <option value="convertido">Convertido</option>
                              <option value="perdido">Perdido</option>
                            </select>

                            <button
                              onClick={() => handleOpenChatForLead(lead.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                              title="Abrir no WhatsApp Integrado"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Chat</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Webhook Dispatch Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Integração por Webhook (Zapier, Make, n8n, CRM)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Dispare todos os {leads.length} leads com histórico de status e mensagens para seu CRM externo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://seu-crm.com/webhook-leads"
              className="w-full sm:w-80 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
            />
            <button
              onClick={handleTriggerWebhook}
              disabled={isSendingWebhook || leads.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingWebhook ? 'Enviando...' : 'Disparar Webhook'}</span>
            </button>
          </div>
        </div>

        {webhookStatus === 'sucesso' && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Payload disparado com sucesso para seu Webhook!</span>
          </div>
        )}
      </div>
    </div>
  );
};
