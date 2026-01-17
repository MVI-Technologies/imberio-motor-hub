import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Budget, Client } from '@/contexts/DataContext';

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

const COMPANY_NAME = 'Imberio Registros';
const COMPANY_SUBTITLE = 'Sistema de Gestão de Motores Elétricos e Orçamentos Técnicos';

export function exportBudgetToPDF(budget: Budget) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(26, 54, 71); // Primary color
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 20, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_SUBTITLE, 20, 32);
  
  doc.setFontSize(12);
  doc.text(`Orçamento #${budget.id.toUpperCase()}`, pageWidth - 20, 22, { align: 'right' });
  doc.text(`Data: ${new Date(budget.data).toLocaleDateString('pt-BR')}`, pageWidth - 20, 32, { align: 'right' });
  
  // Client Info
  let yPos = 55;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Cliente', 20, yPos);
  
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${budget.client_name}`, 20, yPos);
  yPos += 6;
  doc.text(`Operador: ${budget.operador_name}`, 20, yPos);
  
  // Motor Data
  yPos += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados Técnicos do Motor', 20, yPos);
  
  yPos += 5;
  const motorData = [
    ['Tipo', budget.motor.tipo, 'Modelo', budget.motor.modelo],
    ['CV', budget.motor.cv, 'Tensão', budget.motor.tensao],
    ['RPM', budget.motor.rpm, 'Nº Fios', budget.motor.fios],
    ['Espiras', budget.motor.espiras, 'Ligação', budget.motor.ligacao],
    ['Diâm. Externo', budget.motor.diametro_externo, 'Comp. Externo', budget.motor.comprimento_externo],
    ['Nº Série', budget.motor.numero_serie, 'Marca', budget.motor.marca],
    ['Original', budget.motor.original ? 'Sim' : 'Não', '', ''],
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
  doc.text('Assinatura do Cliente', 55, yPos + 5, { align: 'center' });
  
  doc.line(pageWidth - 90, yPos, pageWidth - 20, yPos);
  doc.text('Assinatura do Responsável', pageWidth - 55, yPos + 5, { align: 'center' });
  
  // Save
  doc.save(`orcamento_${budget.id}_${budget.client_name.replace(/\s+/g, '_')}.pdf`);
}

export function exportClientToPDF(client: Client, budgets: Budget[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(26, 54, 71);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 20, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_SUBTITLE, 20, 32);
  
  doc.setFontSize(12);
  doc.text('Ficha do Cliente', pageWidth - 20, 22, { align: 'right' });
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 32, { align: 'right' });
  
  // Client Info
  let yPos = 55;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(client.nome, 20, yPos);
  
  yPos += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const clientInfo = [
    ['Endereço', client.endereco],
    ['Telefone', client.telefone],
    ['Celular', client.celular],
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
      `${b.motor.marca} ${b.motor.modelo}`,
      `R$ ${b.valor_total.toFixed(2)}`,
      b.status === 'concluido' ? 'Concluído' : b.status === 'aprovado' ? 'Aprovado' : 'Pendente',
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
