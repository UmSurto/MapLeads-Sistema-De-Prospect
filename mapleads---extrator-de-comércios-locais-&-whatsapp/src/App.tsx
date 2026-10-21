/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { SearchHero } from './components/SearchHero.tsx';
import { AdvancedFilters } from './components/AdvancedFilters.tsx';
import { MapView } from './components/MapView.tsx';
import { LeadsTable } from './components/LeadsTable.tsx';
import { WhatsAppModal } from './components/WhatsAppModal.tsx';
import { TemplateManagerModal } from './components/TemplateManagerModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CRMView } from './components/CRMView.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { Lead, LeadList, SearchFilters, MessageTemplate, DEFAULT_TEMPLATES, filterLeads } from './utils/leads.ts';
import { searchLocalBusinesses } from './services/leadSearchService.ts';
import { ShieldAlert, Sparkles, MapPin, Building2, CheckCircle2, Plus, FolderCheck } from 'lucide-react';

const STORAGE_LISTS_KEY = 'mapleads_static_lists_v1';
const STORAGE_LEADS_KEY = 'mapleads_static_leads_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'dashboard' | 'crm' | 'templates'>('search');
  const [location, setLocation] = useState<string>('Duque de Caxias, RJ');
  const [category, setCategory] = useState<string>('Salão de Beleza');
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: -22.7856, lng: -43.3117 });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchSeed, setSearchSeed] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'split' | 'full-table'>('split');

  // Separate Lists Management (stored statically in browser storage)
  const [lists, setLists] = useState<LeadList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LISTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'list-default',
        name: 'Duque de Caxias - Salões de Beleza',
        location: 'Duque de Caxias, RJ',
        category: 'Salão de Beleza',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    return lists[0]?.id || 'list-default';
  });

  // Leads (stored statically in browser storage while open)
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LEADS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LISTS_KEY, JSON.stringify(lists));
    } catch {}
  }, [lists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    } catch {}
  }, [leads]);

  // Filters state
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<SearchFilters>({
    neighborhood: 'all',
    hasWhatsAppOnly: false,
    hasWebsiteOnly: false,
    minRating: 0,
    dateRange: 'all',
    messageStatus: 'all',
    interestFilter: 'all'
  });

  // Modal states
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [whatsAppModalLead, setWhatsAppModalLead] = useState<Lead | null>(null);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

  // Templates state
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [userName, setUserName] = useState<string>('Consultor de Negócios');

  // Google Maps API Key
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyDpho0hV3xAbiqmec8jTVG3XcwE5_1fydA';

  // Leads belonging to the currently active list
  const activeListLeads = useMemo(() => {
    return leads.filter(l => (l.listId || 'list-default') === activeListId);
  }, [leads, activeListId]);

  // Read URL params or do initial search if list is empty
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLoc = params.get('loc');
      const urlCat = params.get('cat');
      if (urlLoc) setLocation(urlLoc);
      if (urlCat) setCategory(urlCat);
      
      // If active list has 0 leads, run initial search to populate
      if (leads.length === 0) {
        handleSearch(urlLoc || 'Duque de Caxias, RJ', urlCat || 'Salão de Beleza');
      }
    }
  }, []);

  const handleSearch = async (locToSearch = location, catToSearch = category) => {
    setIsLoading(true);
    try {
      const nextSeed = searchSeed + 1;
      setSearchSeed(nextSeed);

      // Perform search: each search fetches fresh, varied businesses
      const res = await searchLocalBusinesses({
        location: locToSearch,
        category: catToSearch,
        seedOffset: nextSeed
      });

      setCenter(res.center);

      // Associate with active list
      const targetListId = activeListId;

      // Add new leads statically, accumulating into active list and deduplicating
      setLeads(prevLeads => {
        const existingPhones = new Set(prevLeads.map(l => l.rawPhone));
        const existingNames = new Set(prevLeads.map(l => l.name.toLowerCase()));

        const uniqueNewLeads = res.leads
          .filter(l => !existingPhones.has(l.rawPhone) && !existingNames.has(l.name.toLowerCase()))
          .map(l => ({ ...l, listId: targetListId }));

        // If all duplicates due to same seed, accept them with fresh IDs
        const finalNewLeads = uniqueNewLeads.length > 0 ? uniqueNewLeads : res.leads.map(l => ({
          ...l,
          id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          listId: targetListId
        }));

        setNotification(`+ ${finalNewLeads.length} novos comércios adicionados à lista atual!`);
        setTimeout(() => setNotification(null), 4000);

        return [...finalNewLeads, ...prevLeads];
      });

      if (res.leads.length > 0) {
        setSelectedLead(res.leads[0]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // List Management Handlers
  const handleCreateList = (name: string) => {
    const newList: LeadList = {
      id: `list-${Date.now()}`,
      name,
      location,
      category,
      createdAt: new Date().toISOString()
    };
    setLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    setNotification(`Lista "${name}" criada com sucesso!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteList = (id: string) => {
    if (lists.length <= 1) return;
    setLists(prev => prev.filter(l => l.id !== id));
    setLeads(prev => prev.filter(l => l.listId !== id));
    const remaining = lists.filter(l => l.id !== id);
    if (remaining.length > 0) {
      setActiveListId(remaining[0].id);
    }
  };

  const handleClearActiveList = () => {
    if (window.confirm('Deseja realmente limpar todos os comércios desta lista?')) {
      setLeads(prev => prev.filter(l => l.listId !== activeListId));
    }
  };

  // Facilitator buttons handlers
  const handleToggleMessageSent = (leadId: string) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, messageSent: !l.messageSent, status: !l.messageSent ? 'contatado' : l.status } : l))
    );
  };

  const handleUpdateInterest = (leadId: string, interest: Lead['interest']) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, interest } : l))
    );
  };

  const handleUpdateStatus = (leadId: string, newStatus: Lead['status']) => {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  // Neighborhoods present in current list
  const availableNeighborhoods = useMemo(() => {
    const list = Array.from(new Set(activeListLeads.map(l => l.neighborhood))).filter(Boolean);
    return list.sort();
  }, [activeListLeads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return filterLeads(activeListLeads, filters);
  }, [activeListLeads, filters]);

  const activeListName = lists.find(l => l.id === activeListId)?.name || 'Lista Padrão';

  const handleNavigateTab = (tab: 'search' | 'dashboard' | 'crm' | 'templates') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafd] text-[#202124]">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        leadsCount={activeListLeads.length}
        onReset={handleClearActiveList}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'search' && (
          <div>
            {/* Search Hero Area */}
            <SearchHero
              location={location}
              setLocation={setLocation}
              category={category}
              setCategory={setCategory}
              onSearch={handleSearch}
              isLoading={isLoading}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />

            {/* Notification Banner when new leads are accumulated */}
            {notification && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in slide-in-from-top-1">
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{notification}</span>
                  </div>
                  <span className="text-xs bg-emerald-700 px-2 py-0.5 rounded font-normal">
                    Armazenado estaticamente no sistema
                  </span>
                </div>
              </div>
            )}

            {/* Results & Map Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
              {/* Advanced Filters Drawer */}
              {showFilters && (
                <AdvancedFilters
                  filters={filters}
                  setFilters={setFilters}
                  availableNeighborhoods={availableNeighborhoods}
                  totalResults={activeListLeads.length}
                  filteredResults={filteredLeads.length}
                  onClear={() =>
                    setFilters({
                      neighborhood: 'all',
                      hasWhatsAppOnly: false,
                      hasWebsiteOnly: false,
                      minRating: 0,
                      dateRange: 'all',
                      messageStatus: 'all',
                      interestFilter: 'all'
                    })
                  }
                />
              )}

              {/* Layout Mode Toggle Bar */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span>{activeListName} ({filteredLeads.length} estabelecimentos)</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setLayoutMode('split')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      layoutMode === 'split' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Mapa + Lista
                  </button>
                  <button
                    onClick={() => setLayoutMode('full-table')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      layoutMode === 'full-table' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tabela Completa (100%)
                  </button>
                </div>
              </div>

              {/* Grid or Full Width: Google Map & Leads List */}
              <div className={layoutMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
                {/* Left Side: Interactive Map */}
                <div className={layoutMode === 'split' ? 'lg:col-span-5 lg:sticky lg:top-20 space-y-3' : 'space-y-3'}>
                  <MapView
                    apiKey={apiKey}
                    leads={filteredLeads}
                    center={center}
                    selectedLead={selectedLead}
                    onSelectLead={setSelectedLead}
                    onOpenWhatsAppModal={setWhatsAppModalLead}
                  />

                  {/* Informational Storage Badge */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FolderCheck className="w-4 h-4 text-blue-600" />
                      <span><strong>Armazenamento Estático:</strong> {activeListLeads.length} salvos nesta lista.</span>
                    </span>
                    <button
                      onClick={() => handleSearch(location, category)}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      + Buscar e adicionar mais
                    </button>
                  </div>
                </div>

                {/* Right Side / Full Width: Leads Table */}
                <div className={layoutMode === 'split' ? 'lg:col-span-7' : 'w-full'}>
                  <LeadsTable
                    leads={filteredLeads}
                    searchCity={location}
                    category={category}
                    lists={lists}
                    activeListId={activeListId}
                    onSelectList={setActiveListId}
                    onCreateList={handleCreateList}
                    onDeleteList={handleDeleteList}
                    onOpenWhatsAppModal={setWhatsAppModalLead}
                    onToggleMessageSent={handleToggleMessageSent}
                    onUpdateInterest={handleUpdateInterest}
                    onUpdateStatus={handleUpdateStatus}
                    onSelectLead={setSelectedLead}
                    onDeleteLead={handleDeleteLead}
                    onClearActiveList={handleClearActiveList}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            leads={activeListLeads}
            searchCity={location}
            category={category}
          />
        )}

        {activeTab === 'crm' && (
          <CRMView
            leads={activeListLeads}
            onUpdateStatus={handleUpdateStatus}
            onOpenWhatsAppModal={setWhatsAppModalLead}
            templates={templates}
            userName={userName}
            onToggleMessageSent={handleToggleMessageSent}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateManagerModal
            templates={templates}
            setTemplates={setTemplates}
            userName={userName}
            setUserName={setUserName}
          />
        )}
      </main>

      {/* WhatsApp Message Modal */}
      <WhatsAppModal
        lead={whatsAppModalLead}
        isOpen={!!whatsAppModalLead}
        onClose={() => setWhatsAppModalLead(null)}
        templates={templates}
        userName={userName}
        onMarkAsContacted={(id) => {
          handleUpdateStatus(id, 'contatado');
          handleToggleMessageSent(id);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        location={location}
        category={category}
        totalLeads={activeListLeads.length}
      />

      {/* Modern Footer with Google Aesthetic */}
      <footer className="mt-auto bg-white border-t border-gray-200 py-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">MapLeads</span>
            <span>•</span>
            <span>Extrator de Comércios Locais & WhatsApp</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Armazenamento Estático de Listas</span>
            <span>Acesso Direto ao WhatsApp</span>
            <span>Google Maps Platform Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
