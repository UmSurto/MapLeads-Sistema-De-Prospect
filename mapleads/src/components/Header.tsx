import React from 'react';
import { Search, BarChart3, Kanban, MessageSquare, Share2, RotateCcw, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'search' | 'dashboard' | 'crm' | 'templates';
  setActiveTab: (tab: 'search' | 'dashboard' | 'crm' | 'templates') => void;
  leadsCount: number;
  onReset: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  leadsCount,
  onReset,
  onOpenShare
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('search')}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div className="flex items-center">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">Map</span>
                <span className="text-lg sm:text-xl font-bold tracking-tight text-blue-600">Leads</span>
              </div>
            </div>

            {/* Static session badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Armazenamento Estático de Listas</span>
            </div>
          </div>

          {/* Navigation Tabs - Horizontally scrollable on mobile */}
          <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'search'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Busca</span>
              {leadsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-600 text-white">
                  {leadsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'crm'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>CRM</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'templates'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Templates</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenShare}
              title="Compartilhar busca"
              className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={onReset}
              title="Limpar resultados da busca"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
