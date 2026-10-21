import React, { useState } from 'react';
import { Lead, computeLeadMetrics } from '../utils/leads.ts';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Smartphone,
  Globe,
  Star,
  Users,
  Target,
  FileText,
  Printer,
  Sparkles,
  Award,
  Zap,
  Building2
} from 'lucide-react';

interface DashboardViewProps {
  leads: Lead[];
  searchCity: string;
  category: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ leads, searchCity, category }) => {
  const [selectedMonth, setSelectedMonth] = useState('Outubro / 2026');
  const metrics = computeLeadMetrics(leads);

  const withoutWebsiteCount = metrics.total - metrics.withWebsite;
  const withoutWebsitePct = metrics.total > 0 ? Math.round((withoutWebsiteCount / metrics.total) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  if (metrics.total === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Nenhum dado para o Dashboard</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
          Faça uma busca na aba "Busca & Resultados" para gerar gráficos e métricas de tendências em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Análise em Tempo Real
            </span>
            <span className="text-xs text-gray-500">• {searchCity || 'Todas as Regiões'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Dashboard de Tendências & Inteligência Comercial
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Métricas estratégicas para captação de clientes, funil de prospecção e oportunidades locais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-700 focus:outline-hidden"
          >
            <option value="Outubro / 2026">Relatório Outubro / 2026</option>
            <option value="Novembro / 2026">Projeção Novembro / 2026</option>
            <option value="Dezembro / 2026">Projeção Dezembro / 2026</option>
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Total de Leads Extraídos</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.total}</div>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              100% atualizados na busca
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Leads with WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Com WhatsApp Ativo</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {metrics.withWhatsApp} <span className="text-xs font-normal text-gray-400">({metrics.withWhatsAppPct}%)</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Contatos diretos para mensagens</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        {/* Opportunity: Without Website */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Sem Site Oficial</span>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">
              {withoutWebsiteCount} <span className="text-xs font-normal text-gray-400">({withoutWebsitePct}%)</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Alto potencial para criação de site</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        {/* Google Average Rating */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">Média de Reputação</span>
            <div className="text-2xl font-extrabold text-gray-900 mt-1 flex items-center gap-1.5">
              <span>{metrics.avgRating.toFixed(1)}</span>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-[11px] text-gray-400">Com base nas avaliações do Maps</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Neighborhood Distribution Bar Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Distribuição por Bairros</h3>
              <p className="text-xs text-gray-500">Concentração de estabelecimentos por região local</p>
            </div>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-3.5 mt-6">
            {metrics.topNeighborhoods.map((n, idx) => (
              <div key={n.name}>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    {n.name}
                  </span>
                  <span className="text-gray-500">{n.count} locais ({n.pct}%)</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, n.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Presence & WhatsApp Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Maturidade Digital</h3>
                <p className="text-xs text-gray-500">Canais de venda e presença online</p>
              </div>
              <PieChart className="w-4 h-4 text-gray-400" />
            </div>

            {/* Visual Ring / Progress indicators */}
            <div className="space-y-4 my-4">
              {/* Has WhatsApp */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Atendimento via WhatsApp
                  </span>
                  <span>{metrics.withWhatsAppPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${metrics.withWhatsAppPct}%` }}
                  />
                </div>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  {metrics.withWhatsApp} de {metrics.total} possuem número com WhatsApp disponível
                </span>
              </div>

              {/* Has Website */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Possuem Website Próprio
                  </span>
                  <span>{metrics.withWebsitePct}%</span>
                </div>
                <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${metrics.withWebsitePct}%` }}
                  />
                </div>
                <span className="text-[11px] text-blue-700 mt-1 block">
                  {metrics.withWebsite} de {metrics.total} contam com site ativo
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-100">
            <span className="font-bold text-gray-800">Oportunidade Comercial:</span>{' '}
            {withoutWebsiteCount} estabelecimentos não possuem site e dependem apenas do Google Maps, sendo potenciais clientes de desenvolvimento web e tráfego pago.
          </div>
        </div>
      </div>

      {/* Monthly Strategic Report Card */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Relatório Estratégico Mensal Personalizado</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Plano de Ação para {searchCity || 'Região Selecionada'} ({selectedMonth})
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Insights calculados para prospecção B2B de {category || 'comércios locais'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Capacidade do Funil</span>
              <span className="text-lg font-bold text-emerald-400">{metrics.total} empresas mapeadas</span>
            </div>
          </div>
        </div>

        {/* 3 Pillars of Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm mb-3">
              01
            </div>
            <h4 className="font-bold text-sm text-white mb-1.5">Campanha de WhatsApp Direto</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Você possui {metrics.withWhatsApp} números prontos com WhatsApp. Utilizando nosso script de primeiro contato, uma cadência de 15 mensagens por dia cobre esta base em 3 a 5 dias.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm mb-3">
              02
            </div>
            <h4 className="font-bold text-sm text-white mb-1.5">Pitch de Criação de Sites</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {withoutWebsitePct}% dos estabelecimentos pesquisados não têm site. Use o template de "Criação de Site" destacando que eles perdem clientes para concorrentes que possuem página oficial.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm mb-3">
              03
            </div>
            <h4 className="font-bold text-sm text-white mb-1.5">Foco no Bairro Principal</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              O bairro com maior concentração na busca é "{metrics.topNeighborhoods[0]?.name || 'Centro'}". Mencionar o nome do bairro no WhatsApp aumenta as taxas de resposta em até 38%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
