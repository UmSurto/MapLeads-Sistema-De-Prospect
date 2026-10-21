import React, { useState } from 'react';
import { Lead, LeadList, generateLeadsCSV, generateCRMExportCSV, buildWhatsAppLink } from '../utils/leads.ts';
import { exportLeadsToPDF } from '../utils/pdfExport.ts';
import {
  Download,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  ExternalLink,
  Star,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Phone,
  Globe,
  Plus,
  Trash2,
  Check,
  Send,
  HelpCircle,
  FolderOpen
} from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  searchCity: string;
  category: string;
  lists: LeadList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (id: string) => void;
  onOpenWhatsAppModal: (lead: Lead) => void;
  onToggleMessageSent: (leadId: string) => void;
  onUpdateInterest: (leadId: string, interest: Lead['interest']) => void;
  onUpdateStatus: (leadId: string, newStatus: Lead['status']) => void;
  onSelectLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onClearActiveList: () => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  searchCity,
  category,
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onDeleteList,
  onOpenWhatsAppModal,
  onToggleMessageSent,
  onUpdateInterest,
  onUpdateStatus,
  onSelectLead,
  onDeleteLead,
  onClearActiveList
}) => {
  const [tableSearch, setTableSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'not_sent' | 'sent' | 'interessante' | 'desinteressante'>('all');
  const [sortField, setSortField] = useState<'name' | 'rating' | 'neighborhood'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // New list modal/input state
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Filter within table
  const displayedLeads = leads
    .filter(lead => {
      if (quickFilter === 'not_sent' && lead.messageSent) return false;
      if (quickFilter === 'sent' && !lead.messageSent) return false;
      if (quickFilter === 'interessante' && lead.interest !== 'interessante') return false;
      if (quickFilter === 'desinteressante' && lead.interest !== 'desinteressante') return false;

      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        return (
          lead.name.toLowerCase().includes(q) ||
          lead.neighborhood.toLowerCase().includes(q) ||
          lead.phone.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  // Direct WhatsApp click handler
  const handleDirectWhatsAppClick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const url = buildWhatsAppLink(lead.rawPhone);
    window.open(url, '_blank');
    if (!lead.messageSent) {
      onToggleMessageSent(lead.id);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = generateLeadsCSV(displayedLeads);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_${(searchCity || 'maps').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    exportLeadsToPDF(displayedLeads, searchCity, category);
  };

  const handleExportHubspot = () => {
    const csvContent = generateCRMExportCSV(displayedLeads, 'hubspot');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_hubspot_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRDStation = () => {
    const csvContent = generateCRMExportCSV(displayedLeads, 'rdstation');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `crm_rdstation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onCreateList(newListName.trim());
    setNewListName('');
    setIsCreatingList(false);
  };

  // Metrics for quick filter counters
  const totalCount = leads.length;
  const notSentCount = leads.filter(l => !l.messageSent).length;
  const sentCount = leads.filter(l => l.messageSent).length;
  const interestingCount = leads.filter(l => l.interest === 'interessante').length;
  const discardedCount = leads.filter(l => l.interest === 'desinteressante').length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Listas Separadas Management Bar */}
      <div className="p-3.5 sm:px-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span>Lista Ativa:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => onSelectList(list.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeListId === list.id
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <span>{list.name}</span>
                {activeListId === list.id && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                )}
              </button>
            ))}

            <button
              onClick={() => setIsCreatingList(true)}
              className="px-2.5 py-1.5 rounded-lg border border-dashed border-blue-400 bg-white hover:bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Criar nova lista separada"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Lista</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lists.length > 1 && (
            <button
              onClick={() => onDeleteList(activeListId)}
              className="text-xs text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              title="Excluir esta lista"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClearActiveList}
            className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
            title="Limpar todos os comércios desta lista"
          >
            Limpar Lista
          </button>
        </div>
      </div>

      {/* New List Inline Input */}
      {isCreatingList && (
        <form onSubmit={handleCreateListSubmit} className="p-3 bg-blue-100/60 border-b border-blue-200 flex items-center gap-2 animate-in fade-in">
          <input
            type="text"
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nome da nova lista (ex: Barbearias - São Paulo, Salões RJ...)"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
          >
            Criar
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingList(false)}
            className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Top action toolbar */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Comércios Armazenados na Lista</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {displayedLeads.length} estabelecimentos
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Novas buscas acumulam estabelecimentos nesta lista. Clique no botão de WhatsApp para abrir direto a conversa!
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export Button */}
          <button
            onClick={handleDownloadCSV}
            disabled={displayedLeads.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Baixar lista completa em formato CSV para Excel/Planilhas"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Baixar CSV</span>
          </button>

          {/* PDF Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={displayedLeads.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Exportar relatório formatado em PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>

          {/* CRM Export Dropdown / Menu */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Exportar para sistemas de CRM"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CRM</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg hidden group-hover:block z-30 p-1">
              <button
                onClick={handleExportHubspot}
                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer"
              >
                Formato HubSpot
              </button>
              <button
                onClick={handleExportRDStation}
                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer"
              >
                Formato RD Station
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Facilitator Filter Pills */}
      <div className="p-3 sm:px-5 bg-gray-50/90 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500 mr-1">Filtrar por:</span>
          
          <button
            onClick={() => setQuickFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              quickFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            Todos ({totalCount})
          </button>

          <button
            onClick={() => setQuickFilter('not_sent')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              quickFilter === 'not_sent'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            ✉️ Não Enviados ({notSentCount})
          </button>

          <button
            onClick={() => setQuickFilter('sent')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              quickFilter === 'sent'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            ✅ Mensagem Enviada ({sentCount})
          </button>

          <button
            onClick={() => setQuickFilter('interessante')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              quickFilter === 'interessante'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            ⭐ Interessantes ({interestingCount})
          </button>

          <button
            onClick={() => setQuickFilter('desinteressante')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              quickFilter === 'desinteressante'
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-800 border border-red-200 hover:bg-red-50'
            }`}
          >
            ❌ Descartados ({discardedCount})
          </button>
        </div>

        {/* Search input inside list */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Buscar nesta lista..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>
      </div>

      {/* Leads Table */}
      {displayedLeads.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-gray-700">Nenhum estabelecimento nesta seleção</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Faça uma nova busca no topo para adicionar novos comércios a esta lista ou ajuste os filtros.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th
                  onClick={() => {
                    if (sortField === 'name') setSortAsc(!sortAsc);
                    else { setSortField('name'); setSortAsc(true); }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-gray-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Estabelecimento</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-emerald-700 font-extrabold">WhatsApp Direto (Clique para Abrir)</th>
                <th className="py-3 px-4">Status de Envio</th>
                <th className="py-3 px-4">Qualificação / Interesse</th>
                <th
                  onClick={() => {
                    if (sortField === 'neighborhood') setSortAsc(!sortAsc);
                    else { setSortField('neighborhood'); setSortAsc(true); }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-gray-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Bairro</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4 text-right">Remover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {displayedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${
                    lead.interest === 'interessante'
                      ? 'bg-blue-50/15'
                      : lead.interest === 'desinteressante'
                      ? 'opacity-60 bg-gray-50/50'
                      : ''
                  }`}
                >
                  {/* Name and address */}
                  <td className="py-3.5 px-4 min-w-[200px]">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      <span>{lead.name}</span>
                      {lead.rating > 0 && (
                        <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5 ml-1">
                          <Star className="w-3 h-3 fill-current" />
                          {lead.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate max-w-xs mt-0.5">
                      {lead.address}
                    </div>
                  </td>

                  {/* DIRECT CLICKABLE WHATSAPP BUTTON & PHONE */}
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <a
                        href={buildWhatsAppLink(lead.rawPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleDirectWhatsAppClick(e, lead)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer group/wa"
                        title="CLIQUE AQUI PARA ABRIR O WHATSAPP DESTE CONTATO AGORA"
                      >
                        <MessageCircle className="w-4 h-4 fill-white text-emerald-600 group-hover/wa:scale-110 transition-transform" />
                        <span className="tracking-wide">{lead.phone}</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>

                      <button
                        onClick={() => onOpenWhatsAppModal(lead)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 text-[11px] font-medium transition-colors"
                        title="Personalizar texto antes de enviar"
                      >
                        Template
                      </button>
                    </div>
                  </td>

                  {/* BOTÃO FACILITADOR: MENSAGEM ENVIADA */}
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleMessageSent(lead.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        lead.messageSent
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                      title="Clique para alternar se já enviou mensagem ou não"
                    >
                      {lead.messageSent ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mensagem Enviada</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-amber-600" />
                          <span>Não Enviado</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* BOTÕES FACILITADORES: INTERESSE / QUALIFICAÇÃO */}
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                      {/* Interessante */}
                      <button
                        onClick={() => onUpdateInterest(lead.id, 'interessante')}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          lead.interest === 'interessante'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-gray-600 hover:text-blue-700 hover:bg-gray-100'
                        }`}
                        title="Marcar como estabelecimento interessante"
                      >
                        <Star className="w-3 h-3" />
                        <span>Interessante</span>
                      </button>

                      {/* Neutro */}
                      <button
                        onClick={() => onUpdateInterest(lead.id, 'neutro')}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          lead.interest === 'neutro'
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                        title="Marcar como neutro"
                      >
                        <span>Neutro</span>
                      </button>

                      {/* Descartar / Sem Interesse */}
                      <button
                        onClick={() => onUpdateInterest(lead.id, 'desinteressante')}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer ${
                          lead.interest === 'desinteressante'
                            ? 'bg-red-600 text-white shadow-2xs'
                            : 'text-gray-500 hover:text-red-700 hover:bg-gray-100'
                        }`}
                        title="Descartar ou marcar sem interesse"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Descartar</span>
                      </button>
                    </div>
                  </td>

                  {/* Neighborhood */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-xs">
                      {lead.neighborhood}
                    </span>
                  </td>

                  {/* Website Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {lead.hasWebsite && lead.websiteUrl ? (
                      <a
                        href={lead.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] hover:bg-blue-100 transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Possui Site</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium text-[11px] border border-amber-200">
                        <XCircle className="w-3 h-3 text-amber-600" />
                        <span>Sem site</span>
                      </span>
                    )}
                  </td>

                  {/* Delete individual lead */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDeleteLead(lead.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remover este lead da lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
