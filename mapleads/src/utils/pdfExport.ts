import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Lead } from './leads.ts';

export function exportLeadsToPDF(leads: Lead[], searchCity: string, category: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(26, 115, 232); // Google Blue
  doc.text('MapLeads - Relatório de Comércios Locais', 14, 15);

  // Subtitle & Search Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(95, 99, 104); // Google Grey
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Local: ${searchCity || 'Todas as Regiões'}  |  Categoria: ${category || 'Geral'}  |  Gerado em: ${now}`, 14, 22);
  doc.text(`Total de Estabelecimentos Extraídos: ${leads.length}  |  Relatório Volátil Instantâneo`, 14, 27);

  // Table Data
  const tableHeaders = [
    'Estabelecimento',
    'Telefone / WhatsApp',
    'Bairro',
    'Site',
    'Categoria',
    'Avaliação',
    'Endereço'
  ];

  const tableRows = leads.map(l => [
    l.name,
    l.phone + (l.hasWhatsApp ? ' (WhatsApp)' : ''),
    l.neighborhood || 'Centro',
    l.hasWebsite ? (l.websiteUrl || 'Sim') : 'Sem site',
    l.category,
    l.rating > 0 ? `${l.rating.toFixed(1)} (${l.userRatingsTotal})` : 'S/N',
    l.address
  ]);

  autoTable(doc, {
    startY: 32,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 115, 232],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 253]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
      6: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 134, 139);
    doc.text(
      `Página ${i} de ${pageCount} - Gerado pelo MapLeads via Google Maps (Não persistente)`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  const cleanName = (searchCity || 'comércios').toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`mapleads_${cleanName}_${Date.now()}.pdf`);
}
