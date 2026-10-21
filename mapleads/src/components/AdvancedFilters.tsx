import React from 'react';
import { SearchFilters } from '../utils/leads.ts';
import { Filter, X, Smartphone, Globe, Star, Calendar, MapPin } from 'lucide-react';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  availableNeighborhoods: string[];
  totalResults: number;
  filteredResults: number;
  onClear: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  setFilters,
  availableNeighborhoods,
  totalResults,
  filteredResults,
  onClear
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm mb-6 transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">Filtros Avançados de Busca</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
            Exibindo {filteredResults} de {totalResults} comércios
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Redefinir filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Neighborhood select */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>Filtrar por Bairro</span>
          </label>
          <select
            value={filters.neighborhood || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, neighborhood: e.target.value }))}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todos os Bairros</option>
            {availableNeighborhoods.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Min Rating select */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Avaliação Mínima Google</span>
          </label>
          <select
            value={filters.minRating || 0}
            onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value={0}>Qualquer nota (3.0 a 5.0)</option>
            <option value={4.0}>⭐ 4.0 ou superior</option>
            <option value={4.5}>⭐ 4.5 ou superior</option>
            <option value={4.8}>⭐ 4.8+ (Excelente)</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Período da Busca</span>
          </label>
          <select
            value={filters.dateRange || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Instantânea (Agora)</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
          </select>
        </div>

        {/* Message Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <span>Status da Mensagem</span>
          </label>
          <select
            value={filters.messageStatus || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, messageStatus: e.target.value as any }))}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todas as mensagens</option>
            <option value="not_sent">✉️ Mensagem Não Enviada</option>
            <option value="sent">✅ Mensagem Já Enviada</option>
          </select>
        </div>

        {/* Interest Filter */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
            <span>Interesse / Qualificação</span>
          </label>
          <select
            value={filters.interestFilter || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, interestFilter: e.target.value as any }))}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
          >
            <option value="all">Todos os interesses</option>
            <option value="interessante">⭐ Apenas Interessantes</option>
            <option value="neutro">⚪ Neutros</option>
            <option value="desinteressante">❌ Descartados</option>
          </select>
        </div>

        {/* Toggles: WhatsApp & Website */}
        <div className="flex flex-col justify-center space-y-2 pt-1 sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!filters.hasWhatsAppOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, hasWhatsAppOnly: e.target.checked }))}
              className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Apenas com WhatsApp válido
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!filters.hasWebsiteOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, hasWebsiteOnly: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded-sm border-gray-300 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Apenas com Site Oficial
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
