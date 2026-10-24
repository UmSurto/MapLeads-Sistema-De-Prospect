import React from 'react';
import { Check, MapPin, Star, UserPlus, SearchX } from 'lucide-react';
import { getLeadIdentity, Lead } from '../utils/leads.ts';

interface SearchResultsProps {
  leads: Lead[];
  hasSearched: boolean;
  savedLeadIdentities: Set<string>;
  onUpdateInterest: (leadId: string, interest: Lead['interest']) => void;
  onSaveToCRM: (lead: Lead) => void;
}

const interestOptions: { value: Lead['interest']; label: string; className: string }[] = [
  { value: 'interessante', label: 'Interesse', className: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
  { value: 'neutro', label: 'Neutro', className: 'border-gray-200 text-gray-600 hover:bg-gray-50' },
  { value: 'desinteressante', label: 'Desinteresse', className: 'border-red-200 text-red-700 hover:bg-red-50' }
];

export const SearchResults: React.FC<SearchResultsProps> = ({
  leads,
  hasSearched,
  savedLeadIdentities,
  onUpdateInterest,
  onSaveToCRM
}) => {
  if (!hasSearched) return null;

  if (!leads.length) {
    return (
      <div className="search-empty-state mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <div className="search-empty-card rounded-2xl border p-10 text-center text-sm">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <SearchX className="h-5 w-5" />
          </span>
          <h2 className="font-semibold text-gray-900">Nenhum estabelecimento encontrado</h2>
          <p className="mt-1 text-gray-600">Tente outra região ou ajuste o segmento da pesquisa.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="search-results mx-auto max-w-7xl px-4 pb-10 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-700">Sua prospecção</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">Resultados da busca</h2>
        </div>
        <span className="results-count rounded-full px-3 py-1.5 text-xs font-semibold">{leads.length} estabelecimentos</span>
      </div>

      <div className="results-table-wrap overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="results-table w-full min-w-[860px] text-left text-xs">
          <thead className="border-b bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Estabelecimento</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Avaliação</th>
              <th className="px-4 py-3">Interesse</th>
              <th className="px-4 py-3 text-right">CRM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => {
              const isSaved = savedLeadIdentities.has(getLeadIdentity(lead));
              return (
                <tr key={lead.id} className="transition-colors hover:bg-gray-50/70">
                  <td className="max-w-lg px-4 py-3">
                    <div className="font-semibold text-gray-900">{lead.name}</div>
                    <div className="mt-1 flex items-start gap-1 text-[11px] text-gray-500">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{lead.address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{lead.phone}</td>
                  <td className="px-4 py-3">
                    {lead.rating > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Star className="h-3 w-3 fill-current" /> {lead.rating.toFixed(1)} ({lead.userRatingsTotal})
                      </span>
                    ) : 'Sem avaliação'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {interestOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onUpdateInterest(lead.id, option.value)}
                          aria-pressed={lead.interest === option.value}
                          className={`rounded-md border px-2 py-1 font-medium transition-colors ${
                            lead.interest === option.value
                              ? option.value === 'interessante'
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : option.value === 'desinteressante'
                                  ? 'border-red-600 bg-red-600 text-white'
                                  : 'border-gray-600 bg-gray-600 text-white'
                              : option.className
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSaveToCRM(lead)}
                      disabled={isSaved}
                      aria-label={isSaved ? `${lead.name} salvo no CRM` : `Salvar ${lead.name} no CRM`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-default disabled:bg-emerald-100 disabled:text-emerald-800"
                    >
                      {isSaved ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {isSaved ? 'Salvo no CRM' : 'Salvar no CRM'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
