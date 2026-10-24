import React from 'react';
import { Loader2, MapPin, Search, Tag } from 'lucide-react';

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
  <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
    <div className="mb-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Buscar estabelecimentos no Google Maps
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Escolha uma região e uma categoria. Os resultados só serão carregados quando você iniciar a busca.
      </p>
    </div>

    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (location.trim() && !isLoading) onSearch();
      }}
      className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_1fr_auto]"
    >
      <label className="relative block">
        <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-red-500" />
        <input
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Cidade ou região, por exemplo: Duque de Caxias, RJ"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          required
        />
      </label>

      <label className="relative block">
        <Tag className="absolute left-3.5 top-3.5 h-5 w-5 text-blue-600" />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <button
        type="submit"
        disabled={isLoading || !location.trim()}
        className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {isLoading ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  </section>
);
