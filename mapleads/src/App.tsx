/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Header } from './components/Header.tsx';
import { SearchHero } from './components/SearchHero.tsx';
import { SearchResults } from './components/SearchResults.tsx';
import { WhatsAppModal } from './components/WhatsAppModal.tsx';
import { TemplateManagerModal } from './components/TemplateManagerModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CRMView } from './components/CRMView.tsx';
import { Lead, LeadList, MessageTemplate, DEFAULT_TEMPLATES, getLeadIdentity } from './utils/leads.ts';
import { searchLocalBusinesses } from './services/leadSearchService.ts';

const STORAGE_LISTS_KEY = 'mapleads_static_lists_v1';
const STORAGE_LEADS_KEY = 'mapleads_static_leads_v1';
const STORAGE_THEME_KEY = 'mapleads_theme_v1';
const SEARCH_EMPTY_STATE_FADE_MS = 250;

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'dashboard' | 'crm' | 'templates'>('search');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_THEME_KEY) === 'dark';
    } catch (error) {
      console.error('Unable to read the saved theme preference:', error);
      return false;
    }
  });
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<string>('Salão de Beleza');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [showSearchEmptyState, setShowSearchEmptyState] = useState(true);
  const [isSearchEmptyStateFading, setIsSearchEmptyStateFading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationIsError, setNotificationIsError] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
    document.documentElement.style.colorScheme = isDarkTheme ? 'dark' : 'light';
  }, [isDarkTheme]);

  const [lists, setLists] = useState<LeadList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LISTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'list-default',
        name: 'Meus leads salvos',
        location: '',
        category: '',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    return lists[0]?.id || 'list-default';
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LEADS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LISTS_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Unable to persist CRM lists locally:', error);
      setNotification('Não foi possível salvar as listas no armazenamento local deste navegador.');
    }
  }, [lists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
    } catch (error) {
      console.error('Unable to persist CRM leads locally:', error);
      setNotification('Não foi possível salvar os leads do CRM no armazenamento local deste navegador.');
    }
  }, [leads]);

  const [whatsAppModalLead, setWhatsAppModalLead] = useState<Lead | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [userName, setUserName] = useState<string>('Consultor de Negócios');

  const activeListLeads = useMemo(() => {
    return leads.filter(l => (l.listId || 'list-default') === activeListId);
  }, [leads, activeListId]);

  const savedLeadIdentities = useMemo(
    () => new Set(leads.map(getLeadIdentity)),
    [leads]
  );

  const handleSearch = async () => {
    if (!location.trim()) {
      setNotification('Informe a cidade ou região antes de buscar.');
      setNotificationIsError(true);
      return;
    }
    setIsLoading(true);
    setNotification(null);
    setHasSearched(false);
    setSearchResults([]);
    if (showSearchEmptyState) {
      setIsSearchEmptyStateFading(true);
      await new Promise((resolve) => window.setTimeout(resolve, SEARCH_EMPTY_STATE_FADE_MS));
      setShowSearchEmptyState(false);
    }
    try {
      const results = await searchLocalBusinesses({
        location,
        category,
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
      });
      setSearchResults(results);
      setHasSearched(true);
      setNotificationIsError(false);
      if (results.length) {
        setNotification(`${results.length} resultados recebidos do Google Maps. Salve no CRM apenas os leads que deseja manter.`);
      } else {
        setNotification('O Google Maps não retornou estabelecimentos para essa busca.');
      }
    } catch (error) {
      console.error('Google Maps search failed:', error);
      setNotificationIsError(true);
      setNotification(error instanceof Error ? error.message : 'Falha ao buscar estabelecimentos no Google Maps.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = !isDarkTheme;
    setIsDarkTheme(nextTheme);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, nextTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Unable to persist the theme preference:', error);
      setNotification('O tema foi alterado, mas não foi possível salvar essa preferência neste navegador.');
      setNotificationIsError(true);
    }
  };

  const handleSaveToCRM = (lead: Lead) => {
    if (savedLeadIdentities.has(getLeadIdentity(lead))) {
      setNotification(`${lead.name} já está salvo no CRM.`);
      setNotificationIsError(false);
      return;
    }
    setLeads((currentLeads) => [
      { ...lead, listId: activeListId },
      ...currentLeads
    ]);
    setNotification(`${lead.name} foi salvo no CRM neste computador.`);
    setNotificationIsError(false);
  };

  const handleUpdateSearchInterest = (leadId: string, interest: Lead['interest']) => {
    setSearchResults((currentResults) =>
      currentResults.map((lead) => lead.id === leadId ? { ...lead, interest } : lead)
    );
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

  const handleUpdateLeadName = (leadId: string, name: string) => {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => lead.id === leadId ? { ...lead, name } : lead)
    );
  };

  const handleUpdateLeadColor = (leadId: string, crmColor: NonNullable<Lead['crmColor']>) => {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => lead.id === leadId ? { ...lead, crmColor } : lead)
    );
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== leadId));
  };

  const handleNavigateTab = (tab: 'search' | 'dashboard' | 'crm' | 'templates') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div className="app-shell min-h-screen flex flex-col bg-[#f4f7fb] text-[#202124]">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        leadsCount={activeListLeads.length}
        isDarkTheme={isDarkTheme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'search' && (
          <div>
            <SearchHero
              location={location}
              setLocation={setLocation}
              category={category}
              setCategory={setCategory}
              onSearch={() => void handleSearch()}
              isLoading={isLoading}
            />

            {showSearchEmptyState && (
              <section
                aria-label="Orientações para iniciar uma busca"
                className={`mx-auto max-w-3xl px-4 pb-8 text-center transition-opacity duration-300 ease-out motion-reduce:transition-none sm:px-6 ${
                  isSearchEmptyStateFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="search-empty-card rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm sm:px-10">
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Search className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">
                    Nenhum resultado exibido ainda
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                    Preencha a localização e o segmento acima e clique em <strong>Buscar</strong> para extrair nomes, telefones e dados de comércios locais direto para a sua base de prospecção.
                  </p>
                </div>
              </section>
            )}

            {notification && (
              <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6" role="status">
                <div className={`rounded-xl border p-3 text-sm ${
                  notificationIsError
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-blue-100 bg-blue-50 text-blue-900'
                }`}>
                  {notification}
                </div>
              </div>
            )}

            <SearchResults
              leads={searchResults}
              hasSearched={hasSearched}
              savedLeadIdentities={savedLeadIdentities}
              onUpdateInterest={handleUpdateSearchInterest}
              onSaveToCRM={handleSaveToCRM}
            />
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
            onUpdateLeadName={handleUpdateLeadName}
            onUpdateLeadColor={handleUpdateLeadColor}
            onDeleteLead={handleDeleteLead}
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

      {/* Modern Footer with Google Aesthetic */}
      <footer className="app-footer mt-auto bg-white border-t border-gray-200 py-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">MapLeads</span>
            <span>•</span>
            <span>Extrator de Comércios Locais & WhatsApp</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Leads do CRM salvos neste navegador</span>
            <span>Busca manual pelo Google Maps</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
