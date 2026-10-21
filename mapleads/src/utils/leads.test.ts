import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizePhoneForWhatsApp,
  formatWhatsAppJid,
  buildWhatsAppLink,
  interpolateTemplate,
  generateLeadsCSV,
  filterLeads,
  computeLeadMetrics,
  Lead
} from './leads.ts';

test('formatWhatsAppJid formats JID correctly for WhatsApp socket', () => {
  const jid1 = formatWhatsAppJid('(21) 98765-4321');
  assert.equal(jid1, '5521987654321@s.whatsapp.net');

  const jid2 = formatWhatsAppJid('5511999998888');
  assert.equal(jid2, '5511999998888@s.whatsapp.net');
});

test('sanitizePhoneForWhatsApp correctly formats Brazilian phone numbers', () => {
  const res1 = sanitizePhoneForWhatsApp('(21) 98765-4321');
  assert.equal(res1.raw, '5521987654321');
  assert.equal(res1.isValid, true);
  assert.equal(res1.display, '(21) 98765-4321');

  const res2 = sanitizePhoneForWhatsApp('11 3456-7890');
  assert.equal(res2.raw, '551134567890');
  assert.equal(res2.isValid, true);
});

test('buildWhatsAppLink generates valid wa.me link directly', () => {
  const directLink = buildWhatsAppLink('5521987654321');
  assert.equal(directLink, 'https://wa.me/5521987654321');

  const messageLink = buildWhatsAppLink('5521987654321', 'Olá!');
  assert.equal(messageLink, 'https://wa.me/5521987654321?text=Ol%C3%A1!');
});

test('interpolateTemplate replaces placeholders correctly', () => {
  const template = 'Olá {nome}, vi que seu negócio em {bairro}, {cidade} não tem site.';
  const lead: Partial<Lead> = {
    name: 'Barbearia do Silva',
    neighborhood: 'Centro',
    city: 'Duque de Caxias'
  };
  const result = interpolateTemplate(template, lead);
  assert.equal(result, 'Olá Barbearia do Silva, vi que seu negócio em Centro, Duque de Caxias não tem site.');
});

test('filterLeads filters by messageSent and interest properly', () => {
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: 'Salão Alpha',
      phone: '(21) 99999-1111',
      rawPhone: '5521999991111',
      hasWhatsApp: true,
      neighborhood: 'Centro',
      city: 'Duque de Caxias',
      hasWebsite: true,
      websiteUrl: 'https://alpha.com',
      rating: 4.9,
      userRatingsTotal: 30,
      category: 'Salão de Beleza',
      address: 'Rua A, 1',
      lat: -22.78,
      lng: -43.30,
      status: 'novo',
      messageSent: true,
      interest: 'interessante',
      listId: 'list-1',
      createdAt: '2026-10-21'
    },
    {
      id: '2',
      name: 'Barbearia Bravo',
      phone: '(21) 3333-2222',
      rawPhone: '552133332222',
      hasWhatsApp: false,
      neighborhood: 'Vila São Luís',
      city: 'Duque de Caxias',
      hasWebsite: false,
      websiteUrl: null,
      rating: 4.0,
      userRatingsTotal: 12,
      category: 'Barbearia',
      address: 'Rua B, 2',
      lat: -22.79,
      lng: -43.31,
      status: 'novo',
      messageSent: false,
      interest: 'neutro',
      listId: 'list-1',
      createdAt: '2026-10-21'
    }
  ];

  const sentOnly = filterLeads(mockLeads, { messageStatus: 'sent' });
  assert.equal(sentOnly.length, 1);
  assert.equal(sentOnly[0].name, 'Salão Alpha');

  const notSentOnly = filterLeads(mockLeads, { messageStatus: 'not_sent' });
  assert.equal(notSentOnly.length, 1);
  assert.equal(notSentOnly[0].name, 'Barbearia Bravo');

  const interestingOnly = filterLeads(mockLeads, { interestFilter: 'interessante' });
  assert.equal(interestingOnly.length, 1);
  assert.equal(interestingOnly[0].name, 'Salão Alpha');
});
