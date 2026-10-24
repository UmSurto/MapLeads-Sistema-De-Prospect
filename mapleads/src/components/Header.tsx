import React from 'react';
import { Search, BarChart3, Kanban, MessageSquare, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  activeTab: 'search' | 'dashboard' | 'crm' | 'templates';
  setActiveTab: (tab: 'search' | 'dashboard' | 'crm' | 'templates') => void;
  leadsCount: number;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  leadsCount,
  isDarkTheme,
  onToggleTheme
}) => {
  return (
    <header className="app-header sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('search')}>
              <div className="brand-mark w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div className="flex items-center">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900">Map</span>
                <span className="text-lg sm:text-xl font-bold tracking-tight text-teal-700">Leads</span>
              </div>
            </div>

          </div>

          {/* Navigation Tabs - Horizontally scrollable on mobile */}
          <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                activeTab === 'search'
                  ? 'app-nav-active bg-blue-50 text-blue-700 border border-blue-200'
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
                  ? 'app-nav-active bg-blue-50 text-blue-700 border border-blue-200'
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
                  ? 'app-nav-active bg-blue-50 text-blue-700 border border-blue-200'
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
                  ? 'app-nav-active bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Templates</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
              aria-pressed={isDarkTheme}
              title={isDarkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
              className="app-theme-toggle flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{isDarkTheme ? 'Claro' : 'Escuro'}</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};
