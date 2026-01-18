import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BudgetExpanded, Client } from '@/contexts/DataContext';

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

const COMPANY_NAME = 'Dyque & Daya';
const COMPANY_SUBTITLE = 'Rebobinagem de Motores Elétricos';
const COMPANY_PHONE = '(44) 3524-2171 / 98846-7576 / 98437-4616';
const COMPANY_ADDRESS = 'Rua Duque de Caxias, 166 (Fundos) - Jd. Lar Paraná - Campo Mourão - PR';

export function exportBudgetToPDF(budget: BudgetExpanded) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header with background
  doc.setFillColor(26, 54, 71); // Primary color
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Company Info (white text on dark background)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 20, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_SUBTITLE, 20, 26);

  doc.setFontSize(8);
  doc.text(`Fone: ${COMPANY_PHONE}`, 20, 34);
  doc.text(COMPANY_ADDRESS, 20, 41);

  // Date on the right
  doc.setFontSize(12);
  doc.text(`Data: ${new Date(budget.data).toLocaleDateString('pt-BR')}`, pageWidth - 20, 18, { align: 'right' });

  // Client Info
  let yPos = 65;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Cliente', 20, yPos);

  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${budget.client_name}`, 20, yPos);

  // Motor Data
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados Técnicos do Motor', 20, yPos);

  yPos += 5;
  const motor = budget.motor;
  const motorData = [
    ['Equipamento', motor?.equipamento || '-', 'Marca', motor?.marca || '-'],
    ['Modelo', motor?.modelo || '-', 'Nº Série', motor?.numero_serie || '-'],
    ['CV', motor?.cv || '-', 'Tensão', motor?.tensao || '-'],
    ['Passe', motor?.passe || '-', 'Espiras', motor?.espiras || '-'],
    ['Nº Fios', motor?.fios || '-', 'Ligação', motor?.ligacao || '-'],
    ['RPM', motor?.rpm || '-', 'Tipo', motor?.tipo || '-'],
    ['Diâm. Externo', motor?.diametro_externo || '-', 'Comp. Externo', motor?.comprimento_externo || '-'],
    ['Original', motor?.original ? 'Sim' : 'Não', '', ''],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: motorData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, fillColor: [245, 247, 250] },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 35, fillColor: [245, 247, 250] },
      3: { cellWidth: 45 },
    },
    margin: { left: 20, right: 20 },
  });

  // Laudo Técnico
  yPos = doc.lastAutoTable.finalY + 10;
  if (budget.laudo_tecnico) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Laudo Técnico', 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const laudoLines = doc.splitTextToSize(budget.laudo_tecnico, pageWidth - 40);
    doc.text(laudoLines, 20, yPos);
    yPos += laudoLines.length * 5 + 10;
  }

  // Parts and Services Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Peças e Serviços', 20, yPos);

  yPos += 5;
  const itemsData = budget.items.map(item => [
    item.part_name,
    item.quantidade.toString(),
    `R$ ${item.valor_unitario.toFixed(2)}`,
    `R$ ${item.subtotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Qtd', 'Valor Unit.', 'Subtotal']],
    body: itemsData,
    theme: 'striped',
    headStyles: { fillColor: [26, 54, 71], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    margin: { left: 20, right: 20 },
  });

  // Total
  yPos = doc.lastAutoTable.finalY + 5;
  doc.setFillColor(245, 247, 250);
  doc.rect(pageWidth - 90, yPos, 70, 15, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 71);
  doc.text(`TOTAL: R$ ${budget.valor_total.toFixed(2)}`, pageWidth - 25, yPos + 10, { align: 'right' });

  // Footer - Signature
  yPos += 40;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.line(20, yPos, 90, yPos);
  doc.text('Assinatura do Técnico', 55, yPos + 5, { align: 'center' });

  doc.line(pageWidth - 90, yPos, pageWidth - 20, yPos);
  doc.text('Assinatura do Cliente', pageWidth - 55, yPos + 5, { align: 'center' });

  // Save
  doc.save(`orcamento_${budget.id}_${budget.client_name.replace(/\s+/g, '_')}.pdf`);
}

export function exportMotorHeaderToPDF(budget: BudgetExpanded) {
  // Formato de etiqueta larga para impressora térmica
  // Tamanho: 100mm x 60mm (largura x altura) - formato paisagem
  const labelWidth = 100; // mm
  const labelHeight = 60; // mm

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [labelHeight, labelWidth] // [height, width] em landscape
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 3;
  const motor = budget.motor;

  // Borda da etiqueta
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2), 'S');

  // Header com fundo escuro
  doc.setFillColor(30, 30, 30);
  doc.rect(margin, margin, pageWidth - (margin * 2), 10, 'F');

  // Título "IDENTIFICAÇÃO DO MOTOR"
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFICAÇÃO DO MOTOR', pageWidth / 2, margin + 6.5, { align: 'center' });

  // Linha 1: CLIENTE (grande e em destaque)
  let yPos = margin + 15;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('CLIENTE:', margin + 2, yPos);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  // Truncar nome se muito longo
  const clientName = budget.client_name.length > 30
    ? budget.client_name.substring(0, 30) + '...'
    : budget.client_name;
  doc.text(clientName, margin + 2, yPos + 5);

  // Linha divisória
  yPos += 9;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin + 2, yPos, pageWidth - margin - 2, yPos);

  // Linha 2: NÚMERO e MODELO lado a lado
  yPos += 4;

  // Número do orçamento (lado esquerdo)
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Nº:', margin + 2, yPos);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const shortId = budget.id.toUpperCase().substring(0, 8);
  doc.text(shortId, margin + 2, yPos + 5);

  // Modelo do motor (lado direito)
  const midPoint = pageWidth / 2;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('MOTOR:', midPoint, yPos);

  const motorModel = [
    motor?.marca,
    motor?.modelo
  ].filter(Boolean).join(' ') || '-';

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const truncatedMotor = motorModel.length > 20
    ? motorModel.substring(0, 20) + '...'
    : motorModel;
  doc.text(truncatedMotor, midPoint, yPos + 5);

  // Linha divisória
  yPos += 9;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin + 2, yPos, pageWidth - margin - 2, yPos);

  // Linha 3: CV, Tipo e Data
  yPos += 4;

  // CV
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('CV:', margin + 2, yPos);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(motor?.cv || '-', margin + 2, yPos + 4);

  // Tipo
  const col2 = margin + 25;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('TIPO:', col2, yPos);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(motor?.tipo || '-', col2, yPos + 4);

  // Data
  const col3 = pageWidth - margin - 25;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('DATA:', col3, yPos);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(budget.data).toLocaleDateString('pt-BR'), col3, yPos + 4);

  // Save
  doc.save(`etiqueta_motor_${budget.id}_${budget.client_name.replace(/\s+/g, '_')}.pdf`);
}

export function exportClientToPDF(client: Client, budgets: BudgetExpanded[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(26, 54, 71);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 20, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_SUBTITLE, 20, 26);

  doc.setFontSize(8);
  doc.text(`Fone: ${COMPANY_PHONE}`, 20, 34);
  doc.text(COMPANY_ADDRESS, 20, 41);

  doc.setFontSize(12);
  doc.text('Ficha do Cliente', pageWidth - 20, 18, { align: 'right' });
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 28, { align: 'right' });

  // Client Info
  let yPos = 65;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(client.nome, 20, yPos);

  yPos += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const clientInfo = [
    ['Endereço', client.endereco || '-'],
    ['Telefone', client.telefone || '-'],
    ['Celular', client.celular || '-'],
    ['Data de Cadastro', new Date(client.created_at).toLocaleDateString('pt-BR')],
    ['Observações', client.observacoes || '-'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: clientInfo,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 100] },
      1: { cellWidth: 120 },
    },
    margin: { left: 20, right: 20 },
  });

  // Budget History
  yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Histórico de Orçamentos', 20, yPos);

  if (budgets.length > 0) {
    yPos += 5;
    const budgetData = budgets.map(b => [
      `#${b.id.toUpperCase().substring(0, 6)}`,
      new Date(b.data).toLocaleDateString('pt-BR'),
      `${b.motor?.marca || ''} ${b.motor?.modelo || ''}`.trim() || '-',
      `R$ ${b.valor_total.toFixed(2)}`,
      b.status === 'baixado' ? 'Baixado' : b.status === 'concluido' ? 'Concluído' : 'Pendente',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Código', 'Data', 'Motor', 'Valor', 'Status']],
      body: budgetData,
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 71], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 20, right: 20 },
    });
  } else {
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum orçamento registrado.', 20, yPos);
  }

  // Save
  doc.save(`cliente_${client.nome.replace(/\s+/g, '_')}.pdf`);
}
