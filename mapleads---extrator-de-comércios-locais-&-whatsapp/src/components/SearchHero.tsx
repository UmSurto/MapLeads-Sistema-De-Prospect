import React, { useState } from 'react';
import { Search, MapPin, Tag, SlidersHorizontal, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface SearchHeroProps {
  location: string;
  setLocation: (loc: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  onSearch: (loc: string, cat: string) => void;
  isLoading: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const POPULAR_LOCATIONS = [
  'Duque de Caxias, RJ',
  'Rio de Janeiro, RJ',
  'São Paulo, SP',
  'Guaianases, SP',
  'Belo Horizonte, MG'
];

const POPULAR_CATEGORIES = [
  'Salão de Beleza',
  'Barbearia',
  'Lanchonete',
  'Pet Shop & Veterinária',
  'Oficina Mecânica',
  'Dentista & Odontologia',
  'Academia & Fitness',
  'Padaria & Confeitaria'
];

export const SearchHero: React.FC<SearchHeroProps> = ({
  location,
  setLocation,
  category,
  setCategory,
  onSearch,
  isLoading,
  showFilters,
  setShowFilters
}) => {
  const [localLocation, setLocalLocation] = useState(location);
  const [localCategory, setLocalCategory] = useState(category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localLocation.trim()) return;
    setLocation(localLocation);
    setCategory(localCategory);
    onSearch(localLocation, localCategory);
  };

  const handleQuickLoc = (loc: string) => {
    setLocalLocation(loc);
    setLocation(loc);
    onSearch(loc, localCategory);
  };

  const handleQuickCat = (cat: string) => {
    setLocalCategory(cat);
    setCategory(cat);
    onSearch(localLocation, cat);
  };

  return (
    <div className="bg-gradient-to-b from-white via-blue-50/20 to-transparent py-8 border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Subtitle / Intro */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/60 text-blue-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Extrator de Comércios Locais via Google Maps</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
            Descubra comércios locais e obtenha WhatsApp com 1 clique
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Busca instantânea e volátil de comércios no Google Maps. Encontre nome, WhatsApp, bairro e site, exporte em CSV/PDF ou envie mensagens personalizadas direto para o cliente.
          </p>
        </div>

        {/* Search Box Styled with Google Search Bar Aesthetic */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-blue-900/5 border border-gray-200 transition-all hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center">
            {/* Location Input */}
            <div className="md:col-span-5 relative flex items-center">
              <div className="absolute left-3.5 text-red-500 flex items-center pointer-events-none">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={localLocation}
                onChange={(e) => setLocalLocation(e.target.value)}
                placeholder="Ex: Duque de Caxias, Guaianases, São Paulo..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50/60 hover:bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 rounded-xl text-sm font-medium border border-transparent focus:border-blue-400 focus:outline-hidden transition-all"
                required
              />
            </div>

            {/* Category Select / Input */}
            <div className="md:col-span-4 relative flex items-center">
              <div className="absolute left-3.5 text-blue-600 flex items-center pointer-events-none">
                <Tag className="w-5 h-5" />
              </div>
              <select
                value={localCategory}
                onChange={(e) => setLocalCategory(e.target.value)}
                className="w-full pl-11 pr-8 py-3 bg-gray-50/60 hover:bg-gray-50 focus:bg-white text-gray-900 rounded-xl text-sm font-medium border border-transparent focus:border-blue-400 focus:outline-hidden appearance-none cursor-pointer transition-all"
              >
                {POPULAR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 pointer-events-none text-gray-400 text-xs">▼</div>
            </div>

            {/* Buttons: Filter Toggle + Search CTA */}
            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${
                  showFilters
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title="Filtros avançados de busca"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar Agora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-gray-500 font-medium mr-1">Regiões sugeridas:</span>
            {POPULAR_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleQuickLoc(loc)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 transition-colors font-medium cursor-pointer"
              >
                {loc.split(',')[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-gray-500">
            <span>Toda busca gera novos resultados sem histórico persistente.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
