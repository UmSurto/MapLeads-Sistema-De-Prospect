export interface Lead {
  id: string;
  name: string;
  phone: string;
  rawPhone: string;
  hasWhatsApp: boolean;
  neighborhood: string;
  city: string;
  hasWebsite: boolean;
  websiteUrl: string | null;
  rating: number;
  userRatingsTotal: number;
  category: string;
  address: string;
  lat: number;
  lng: number;
  status: 'novo' | 'contatado' | 'negociacao' | 'convertido' | 'perdido';
  messageSent: boolean;
  interest: 'interessante' | 'neutro' | 'desinteressante';
  crmColor?: 'active' | 'undecided' | 'disinterested' | 'closed';
  listId: string;
  notes?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  leadId: string;
  sender: 'user' | 'lead';
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface LeadList {
  id: string;
  name: string;
  location: string;
  category: string;
  createdAt: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  neighborhood?: string;
  hasWhatsAppOnly?: boolean;
  hasWebsiteOnly?: boolean;
  minRating?: number;
  dateRange?: string; // 'all' | 'today' | 'week' | 'month'
  messageStatus?: 'all' | 'sent' | 'not_sent';
  interestFilter?: 'all' | 'interessante' | 'neutro' | 'desinteressante';
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
}

export function getLeadIdentity(lead: Lead): string {
  const phone = (lead.rawPhone || '').replace(/\D/g, '');
  if (phone) return `phone:${phone}`;
  return `name:${lead.name.trim().toLowerCase()}|address:${lead.address.trim().toLowerCase()}`;
}

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Apresentação Comercial & Parceria',
    category: 'Comercial',
    content: 'Olá, tudo bem com a equipe da {nome}? Me chamo {meu_nome} e atendo empresas aqui em {bairro}, {cidade}. Gostaria de entender se vocês já possuem capacidade para receber novos clientes esta semana.'
  },
  {
    id: 'tpl-2',
    title: 'Criação de Site & Presença Digital',
    category: 'Marketing',
    content: 'Olá {nome}, tudo bem? Notei que vocês têm ótimas avaliações em {bairro}, mas ainda não contam com um site oficial estruturado no Google. Posso te enviar uma demonstração gratuita de como captar mais clientes na sua região?'
  },
  {
    id: 'tpl-3',
    title: 'Tráfego Pago & Atração Local',
    category: 'Vendas',
    content: 'Olá equipe da {nome}! Estive analisando os comércios de {categoria} em {cidade} e preparei uma estratégia prática para dobrar as chamadas no WhatsApp de vocês. Teria 5 minutos para conversarmos hoje?'
  },
  {
    id: 'tpl-4',
    title: 'Agendamento de Demonstração',
    category: 'Follow-up',
    content: 'Oi {nome}! Gostaria de agendar uma rápida conversa de 10 minutinhos com o responsável para apresentar uma solução que pode otimizar as vendas da sua empresa em {bairro}. Qual melhor horário para você?'
  }
];

/**
 * Normalizes Brazilian phone numbers into WhatsApp clean format (e.g. 5521999998888)
 */
export function sanitizePhoneForWhatsApp(phone: string): { raw: string; isValid: boolean; display: string } {
  if (!phone) return { raw: '', isValid: false, display: 'Não informado' };
  
  // Extract numbers only
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 8) {
    return { raw: '', isValid: false, display: phone };
  }

  let fullDigits = digits;

  // If starts with 0, remove it (e.g., 021 -> 21)
  if (fullDigits.startsWith('0')) {
    fullDigits = fullDigits.substring(1);
  }

  // If lacks Brazil country code (55)
  if (!fullDigits.startsWith('55')) {
    if (fullDigits.length === 10 || fullDigits.length === 11) {
      fullDigits = '55' + fullDigits;
    }
  }

  // Check validity: Brazil numbers with 55 should have 12 or 13 digits (55 + 2 digit DDD + 8 or 9 digits)
  const isValid = fullDigits.startsWith('55') && (fullDigits.length === 12 || fullDigits.length === 13);

  // Format display
  let display = phone;
  if (fullDigits.startsWith('55') && (fullDigits.length === 12 || fullDigits.length === 13)) {
    const ddd = fullDigits.substring(2, 4);
    const rest = fullDigits.substring(4);
    if (rest.length === 9) {
      display = `(${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else if (rest.length === 8) {
      display = `(${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
  }

  return {
    raw: fullDigits,
    isValid,
    display
  };
}

/**
 * Formats a phone number into WhatsApp standard JID (e.g. 5521999998888@s.whatsapp.net)
 */
export function formatWhatsAppJid(phone: string): string {
  const sanitized = sanitizePhoneForWhatsApp(phone);
  const digits = sanitized.raw || phone.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

/**
 * Builds direct WhatsApp URL with prefilled text
 */
export function buildWhatsAppLink(rawPhone: string, message?: string): string {
  if (!rawPhone) return '#';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (!message) {
    return `https://wa.me/${cleanPhone}`;
  }
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Interpolates template placeholders with lead data
 */
export function interpolateTemplate(template: string, lead: Partial<Lead>, senderName = 'Especialista'): string {
  if (!template) return '';
  return template
    .replace(/\{nome\}/gi, lead.name || 'Empresa')
    .replace(/\{categoria\}/gi, lead.category || 'Comércio')
    .replace(/\{bairro\}/gi, lead.neighborhood || 'sua região')
    .replace(/\{cidade\}/gi, lead.city || 'sua cidade')
    .replace(/\{telefone\}/gi, lead.phone || '')
    .replace(/\{meu_nome\}/gi, senderName);
}

/**
 * Generates an RFC 4180 CSV with UTF-8 BOM so Microsoft Excel and Google Sheets open special characters correctly.
 */
export function generateLeadsCSV(leads: Lead[]): string {
  const headers = [
    'ID',
    'Nome do Estabelecimento',
    'Telefone',
    'WhatsApp Link',
    'Mensagem Enviada',
    'Interesse / Qualificação',
    'Bairro',
    'Cidade',
    'Possui Site',
    'URL do Site',
    'Categoria',
    'Nota Google Maps',
    'Total de Avaliações',
    'Endereço Completo',
    'Status CRM',
    'Data da Busca'
  ];

  const escapeCSV = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const stringVal = String(value);
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes(';') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return `"${stringVal}"`;
  };

  const rows = leads.map(l => [
    escapeCSV(l.id),
    escapeCSV(l.name),
    escapeCSV(l.phone),
    escapeCSV(l.rawPhone ? `https://wa.me/${l.rawPhone}` : ''),
    escapeCSV(l.messageSent ? 'SIM' : 'NÃO'),
    escapeCSV(l.interest === 'interessante' ? 'INTERESSANTE' : l.interest === 'desinteressante' ? 'SEM INTERESSE' : 'NEUTRO'),
    escapeCSV(l.neighborhood),
    escapeCSV(l.city),
    escapeCSV(l.hasWebsite ? 'SIM' : 'NÃO'),
    escapeCSV(l.websiteUrl || 'Sem site'),
    escapeCSV(l.category),
    escapeCSV(l.rating > 0 ? l.rating.toFixed(1) : 'S/N'),
    escapeCSV(l.userRatingsTotal),
    escapeCSV(l.address),
    escapeCSV(l.status),
    escapeCSV(l.createdAt)
  ].join(';'));

  // Prepend UTF-8 BOM for Excel
  return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
}

/**
 * Generates CRM Import CSV formatted for Hubspot & RD Station
 */
export function generateCRMExportCSV(leads: Lead[], format: 'hubspot' | 'rdstation' = 'hubspot'): string {
  if (format === 'rdstation') {
    const headers = ['Nome da Empresa', 'Telefone Comercial', 'Cidade', 'Estado', 'Cargo', 'Origem', 'Anotações'];
    const rows = leads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.neighborhood || '').replace(/"/g, '""')}"`,
      `"Proprietário / Gerente"`,
      `"Google Maps Extractor"`,
      `"Categoria: ${l.category} | Site: ${l.hasWebsite ? l.websiteUrl : 'Sem site'} | Whats: ${l.messageSent ? 'Enviado' : 'Pendente'} | Interesse: ${l.interest}"`
    ].join(';'));
    return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  }

  // Hubspot
  const headers = ['Company name', 'Phone Number', 'City', 'Website URL', 'Lead Status', 'Description'];
  const rows = leads.map(l => [
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.city || '').replace(/"/g, '""')}"`,
    `"${(l.websiteUrl || '').replace(/"/g, '""')}"`,
    `"${l.status.toUpperCase()}"`,
    `"Bairro: ${l.neighborhood} | Categoria: ${l.category} | Avaliações: ${l.rating} | Whats Enviado: ${l.messageSent ? 'SIM' : 'NÃO'} | Interesse: ${l.interest}"`
  ].join(','));
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Filters lead list
 */
export function filterLeads(leads: Lead[], filters: SearchFilters): Lead[] {
  return leads.filter(lead => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchAddress = lead.address.toLowerCase().includes(q);
      const matchPhone = lead.phone.includes(q);
      if (!matchName && !matchAddress && !matchPhone) return false;
    }

    if (filters.category && filters.category !== 'all') {
      if (lead.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
    }

    if (filters.neighborhood && filters.neighborhood !== 'all') {
      if (lead.neighborhood.toLowerCase() !== filters.neighborhood.toLowerCase()) {
        return false;
      }
    }

    if (filters.hasWhatsAppOnly && !lead.hasWhatsApp) {
      return false;
    }

    if (filters.hasWebsiteOnly && !lead.hasWebsite) {
      return false;
    }

    if (filters.minRating && lead.rating < filters.minRating) {
      return false;
    }

    if (filters.messageStatus === 'sent' && !lead.messageSent) {
      return false;
    }
    if (filters.messageStatus === 'not_sent' && lead.messageSent) {
      return false;
    }

    if (filters.interestFilter && filters.interestFilter !== 'all') {
      if (lead.interest !== filters.interestFilter) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes live analytical metrics for dashboard
 */
export function computeLeadMetrics(leads: Lead[]) {
  const total = leads.length;
  if (total === 0) {
    return {
      total: 0,
      withWhatsApp: 0,
      withWhatsAppPct: 0,
      withWebsite: 0,
      withWebsitePct: 0,
      avgRating: 0,
      statusCounts: { novo: 0, contatado: 0, negociacao: 0, convertido: 0, perdido: 0 },
      messagesSentCount: 0,
      messagesSentPct: 0,
      interestedCount: 0,
      interestedPct: 0,
      topNeighborhoods: [] as { name: string; count: number; pct: number }[],
      categoryBreakdown: [] as { name: string; count: number }[],
      conversionRate: 0
    };
  }

  const withWhatsApp = leads.filter(l => l.hasWhatsApp).length;
  const withWebsite = leads.filter(l => l.hasWebsite).length;
  const messagesSentCount = leads.filter(l => l.messageSent).length;
  const interestedCount = leads.filter(l => l.interest === 'interessante').length;
  const ratingSum = leads.reduce((acc, l) => acc + (l.rating || 0), 0);
  const avgRating = Number((ratingSum / total).toFixed(1));

  const statusCounts = {
    novo: leads.filter(l => l.status === 'novo').length,
    contatado: leads.filter(l => l.status === 'contatado').length,
    negociacao: leads.filter(l => l.status === 'negociacao').length,
    convertido: leads.filter(l => l.status === 'convertido').length,
    perdido: leads.filter(l => l.status === 'perdido').length
  };

  const neighborhoodMap: Record<string, number> = {};
  leads.forEach(l => {
    const n = l.neighborhood || 'Centro';
    neighborhoodMap[n] = (neighborhoodMap[n] || 0) + 1;
  });

  const topNeighborhoods = Object.entries(neighborhoodMap)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const categoryMap: Record<string, number> = {};
  leads.forEach(l => {
    const c = l.category || 'Outros';
    categoryMap[c] = (categoryMap[c] || 0) + 1;
  });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const contactedOrBeyond = statusCounts.contatado + statusCounts.negociacao + statusCounts.convertido;
  const conversionRate = contactedOrBeyond > 0
    ? Math.round((statusCounts.convertido / contactedOrBeyond) * 100)
    : 0;

  return {
    total,
    withWhatsApp,
    withWhatsAppPct: Math.round((withWhatsApp / total) * 100),
    withWebsite,
    withWebsitePct: Math.round((withWebsite / total) * 100),
    messagesSentCount,
    messagesSentPct: Math.round((messagesSentCount / total) * 100),
    interestedCount,
    interestedPct: Math.round((interestedCount / total) * 100),
    avgRating,
    statusCounts,
    topNeighborhoods,
    categoryBreakdown,
    conversionRate
  };
}
