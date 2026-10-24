import React from 'react';
import { Loader2, MapPin, Search, Tag, Sparkles } from 'lucide-react';

interface SearchHeroProps {
  location: string;
  setLocation: (location: string) => void;
  category: string;
  setCategory: (category: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const CATEGORIES = [
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
  isLoading
}) => (
  <section className="search-hero mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
    <div className="search-hero-panel relative overflow-hidden rounded-[2rem] px-5 py-8 shadow-xl sm:px-9 sm:py-10 lg:px-12">
      <div aria-hidden="true" className="search-hero-orb search-hero-orb-one" />
      <div aria-hidden="true" className="search-hero-orb search-hero-orb-two" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-7 text-center">
          <span className="search-hero-eyebrow mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">
            <Sparkles className="h-3.5 w-3.5" />
            Prospecção local inteligente
          </span>
          <h1 className="search-hero-title text-3xl font-bold tracking-tight sm:text-4xl">
            Encontre novos clientes na sua região
          </h1>
          <p className="search-hero-subtitle mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            Pesquise estabelecimentos no Google Maps e escolha quais oportunidades deseja levar para o CRM.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (location.trim() && !isLoading) onSearch();
          }}
          className="search-form grid grid-cols-1 items-center gap-3 rounded-2xl p-3 shadow-lg md:grid-cols-[1fr_0.8fr_auto]"
        >
          <label className="relative block">
            <span className="sr-only">Cidade ou região</span>
            <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-teal-600" />
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Cidade ou região, por exemplo: Duque de Caxias, RJ"
              className="search-field w-full rounded-xl border py-3 pl-11 pr-3 text-sm focus:outline-none focus:ring-2"
              required
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Segmento</span>
            <Tag className="absolute left-3.5 top-3.5 h-5 w-5 text-blue-600" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="search-field w-full appearance-none rounded-xl border py-3 pl-11 pr-3 text-sm focus:outline-none focus:ring-2"
            >
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <button
            type="submit"
            disabled={isLoading || !location.trim()}
            className="search-submit flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>
    </div>
  </section>
);
