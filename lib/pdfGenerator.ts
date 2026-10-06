import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './utils';
import { calculateProjectEstimate, calculateRequiredEquipment, EquipmentItem } from './estimation';
import { computeRisk } from './risk';

export function formatInr(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rs. 0';
  return 'Rs. ' + Math.round(amount).toLocaleString('en-IN');
}

// Colors for PDF
const COLORS = {
  navyDark: [7, 18, 36],       // #071224
  navyPrimary: [18, 37, 66],   // #122542
  tealAccent: [45, 191, 158],  // #2DBF9E
  slateMuted: [100, 116, 139], // #64748B
  slateLight: [241, 245, 249], // #F1F5F9
  textDark: [15, 23, 42],      // #0F172A
  white: [255, 255, 255],
  borderSlate: [203, 213, 225],
  amber: [217, 119, 6],        // #D97706
  coral: [239, 68, 68],        // #EF4444
};

function ensureProjectEstimate(project: any) {
  if (project.estimate && project.estimate.totalEstimatedCost > 0) {
    return {
      ...project.estimate,
      equipmentItems: calculateRequiredEquipment(project.builtUpAreaSqFt || 2000, 1),
    };
  }
  const defaultRates = {
    baseRatePerSqFt: 1700,
    cementBagRate: 380,
    steelKgRate: 65,
    sandCftRate: 55,
    aggregateCftRate: 42,
    brickRate: 9,
    masonDailyWage: 950,
    helperDailyWage: 550,
  };
  return calculateProjectEstimate(project.builtUpAreaSqFt || 2000, 1, defaultRates);
}

// Header & Banner
function drawDocHeader(doc: jsPDF, title: string, subtitle: string, docRef: string, project: any) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Dark Navy Bar
  doc.setFillColor(COLORS.navyDark[0], COLORS.navyDark[1], COLORS.navyDark[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Teal Accent Line
  doc.setFillColor(COLORS.tealAccent[0], COLORS.tealAccent[1], COLORS.tealAccent[2]);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company Name
  doc.setTextColor(COLORS.tealAccent[0], COLORS.tealAccent[1], COLORS.tealAccent[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BUILDSMART AI PRO', 14, 12);

  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Civil Engineering AI Estimation & Project Management Platform', 14, 18);

  // Document Ref Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.tealAccent[0], COLORS.tealAccent[1], COLORS.tealAccent[2]);
  doc.text(`REF: ${docRef}`, pageWidth - 14, 12, { align: 'right' });

  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 18, { align: 'right' });

  // Document Title Box
  doc.setTextColor(COLORS.navyPrimary[0], COLORS.navyPrimary[1], COLORS.navyPrimary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title.toUpperCase(), 14, 38);

  doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(subtitle, 14, 43);

  // Project Info Metadata Grid Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(COLORS.borderSlate[0], COLORS.borderSlate[1], COLORS.borderSlate[2]);
  doc.roundedRect(14, 47, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
  doc.text('Project Name:', 18, 54);
  doc.text('Site Location:', 18, 60);
  doc.text('Built-up Area:', 18, 66);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
  doc.text(project.name || 'N/A', 46, 54);
  doc.text(project.location || 'N/A', 46, 60);
  doc.text(`${(project.builtUpAreaSqFt || 0).toLocaleString('en-IN')} sq.ft`, 46, 66);

  const midCol = pageWidth / 2 + 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
  doc.text('Project Status:', midCol, 54);
  doc.text('Schedule Period:', midCol, 60);
  doc.text('Client / Owner:', midCol, 66);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
  doc.text((project.status || 'PLANNING').toUpperCase(), midCol + 28, 54);
  doc.text(`${formatDate(project.startDate)} - ${formatDate(project.endDate)}`, midCol + 28, 60);
  doc.text(project.user?.name || project.user?.email || 'Authorized Client', midCol + 28, 66);

  return 76; // Next Y coordinate
}

// Section Header with subtle background ribbon
function drawSectionHeader(doc: jsPDF, y: number, sectionNumber: string, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(COLORS.navyPrimary[0], COLORS.navyPrimary[1], COLORS.navyPrimary[2]);
  doc.roundedRect(14, y, pageWidth - 28, 6.5, 1, 1, 'F');

  doc.setFillColor(COLORS.tealAccent[0], COLORS.tealAccent[1], COLORS.tealAccent[2]);
  doc.rect(14, y, 3, 6.5, 'F');

  doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`${sectionNumber}  ${title.toUpperCase()}`, 20, y + 4.5);

  return y + 9;
}

// Signatures Block
function drawSignaturesBlock(doc: jsPDF, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 12) / 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(COLORS.borderSlate[0], COLORS.borderSlate[1], COLORS.borderSlate[2]);

  // Box 1
  doc.roundedRect(14, y, boxWidth, 24, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.navyPrimary[0], COLORS.navyPrimary[1], COLORS.navyPrimary[2]);
  doc.text('PREPARED BY', 18, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
  doc.text('AI Quantity Surveyor & Estimator', 18, y + 9);
  doc.line(18, y + 18, 14 + boxWidth - 4, y + 18);
  doc.text('Signature / Seal', 18, y + 22);

  // Box 2
  const box2X = 14 + boxWidth + 6;
  doc.roundedRect(box2X, y, boxWidth, 24, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.navyPrimary[0], COLORS.navyPrimary[1], COLORS.navyPrimary[2]);
  doc.text('CHECKED & REVIEWED', box2X + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
  doc.text('Chief Structural / Civil Engineer', box2X + 4, y + 9);
  doc.line(box2X + 4, y + 18, box2X + boxWidth - 4, y + 18);
  doc.text('Signature & License No.', box2X + 4, y + 22);

  // Box 3
  const box3X = box2X + boxWidth + 6;
  doc.roundedRect(box3X, y, boxWidth, 24, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.navyPrimary[0], COLORS.navyPrimary[1], COLORS.navyPrimary[2]);
  doc.text('CLIENT APPROVAL', box3X + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
  doc.text('Authorized Representative / Owner', box3X + 4, y + 9);
  doc.line(box3X + 4, y + 18, box3X + boxWidth - 4, y + 18);
  doc.text('Acceptance Signature', box3X + 4, y + 22);

  return y + 28;
}

// Page Numbers & Footer on All Pages
function applyFooters(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(COLORS.borderSlate[0], COLORS.borderSlate[1], COLORS.borderSlate[2]);
    doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
    doc.text('BuildSmart AI Pro · Automated Civil Intelligence Report · Confidential', 14, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
}

// ==========================================
// 1. PDF ESTIMATE REPORT / CLIENT QUOTATION
// ==========================================
export async function generateEstimatePDF(project: any) {
  const doc = new jsPDF();
  const estimate = ensureProjectEstimate(project);
  const docRef = `EST-${(project.id || 'PROJ').slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  let y = drawDocHeader(
    doc,
    'Client-Ready Cost Quotation & AI Estimate Report',
    'Comprehensive budget forecast, material takeoff schedule, and machinery requirements.',
    docRef,
    project
  );

  // 1.0 Executive Cost Summary
  y = drawSectionHeader(doc, y, '1.0', 'Executive Budget & Cost Analysis');

  const costData = [
    ['1', 'Raw Material Procurement (Cement, Steel, Sand, Bricks, Aggregate)', formatInr(estimate.materialCost), `${Math.round((estimate.materialCost / (estimate.totalEstimatedCost || 1)) * 100)}%`],
    ['2', 'Skilled & General Labour Force (Masons, Helpers, Electricians, Plumbers)', formatInr(estimate.labourCost), `${Math.round((estimate.labourCost / (estimate.totalEstimatedCost || 1)) * 100)}%`],
    ['3', 'Required Civil Machinery & Plant Rentals (Mixers, Vibrators, Rebar Benders, JCB)', formatInr(estimate.equipmentCost), `${Math.round((estimate.equipmentCost / (estimate.totalEstimatedCost || 1)) * 100)}%`],
    ['4', 'Site Overhead, Contingency & Engineering Supervision (8%)', formatInr(estimate.overheadCost), `${Math.round((estimate.overheadCost / (estimate.totalEstimatedCost || 1)) * 100)}%`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['#', 'Cost Center / Engineering Component', 'Estimated Cost (INR)', '% Share']],
    body: costData,
    foot: [['', 'TOTAL ESTIMATED PROJECT COST', formatInr(estimate.totalEstimatedCost), '100%']],
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [45, 191, 158], textColor: [7, 18, 36], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Rate Benchmarks Callout
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(COLORS.borderSlate[0], COLORS.borderSlate[1], COLORS.borderSlate[2]);
  doc.roundedRect(14, y, doc.internal.pageSize.getWidth() - 28, 12, 1.5, 1.5, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.navyPrimary[0], COLORS.navyPrimary[1], COLORS.navyPrimary[2]);
  doc.text(`Estimated Rate per Sq.Ft: ${formatInr(estimate.costPerSqFt)} / sq.ft`, 18, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
  doc.text(`Calculated for ${project.builtUpAreaSqFt?.toLocaleString('en-IN') || 2000} sq.ft total built-up slab area under standard civil structural parameters.`, 18, y + 9);

  y += 16;

  // 2.0 Equipment & Machinery Schedule
  y = drawSectionHeader(doc, y, '2.0', 'Required Construction Equipment & Machinery');

  const equipList: EquipmentItem[] = estimate.equipmentItems || calculateRequiredEquipment(project.builtUpAreaSqFt || 2000, 1);
  const equipTableData = equipList.map((item, idx) => [
    (idx + 1).toString(),
    item.name,
    item.category,
    item.quantity,
    `${item.durationDays} Days`,
    formatInr(item.estCost),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Machinery & Equipment Item', 'Category', 'Quantity', 'Duration', 'Est. Rental Cost']],
    body: equipTableData,
    foot: [['', 'TOTAL EQUIPMENT & PLANT ALLOCATION', '', '', '', formatInr(estimate.equipmentCost)]],
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [241, 245, 249], textColor: [18, 37, 66], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26 },
      3: { cellWidth: 24 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // If page overflow, add new page for section 3 & signatures
  if (y > 220) {
    doc.addPage();
    y = 18;
  }

  // 3.0 Raw Material Takeoff & Labour Force
  y = drawSectionHeader(doc, y, '3.0', 'Bill of Materials & Labour Force Breakdown');

  const matData = [
    ['OPC 43/53 Grade Cement', `${estimate.cementBags?.toLocaleString('en-IN')} Bags`, 'Masonry & RCC Structures'],
    ['Fe-550D TMT Rebar Steel', `${estimate.steelKg?.toLocaleString('en-IN')} Kg`, 'Columns, Beams & Slab Mesh'],
    ['River Sand / Manufactured Sand', `${estimate.sandCft?.toLocaleString('en-IN')} CFT`, 'Mortar & Plasterwork'],
    ['Coarse Crushed Aggregate (20mm/10mm)', `${estimate.aggregateCft?.toLocaleString('en-IN')} CFT`, 'RCC Concrete Casting'],
    ['Clay Red Bricks / AAC Blocks', `${estimate.bricksCount?.toLocaleString('en-IN')} Nos.`, 'External & Internal Wall Partitions'],
    ['Skilled Civil Masons', `${estimate.masonCount} Persons`, 'Structural Brickwork & Finishing'],
    ['General Site Helpers', `${estimate.helperCount} Persons`, 'Material Handling & Batching'],
    ['Total Engineering Man-Hours', `${estimate.totalManHours?.toLocaleString('en-IN')} Man-Hours`, 'Estimated Project Construction Cycle'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Material / Trade Description', 'Required Quantity', 'Civil Engineering Application']],
    body: matData,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  // 4.0 Signatures
  y = drawSectionHeader(doc, y, '4.0', 'Authorization & Technical Sign-off');
  drawSignaturesBlock(doc, y);

  applyFooters(doc);
  doc.save(`${project.name.replace(/\s+/g, '_')}_Cost_Estimate_Quotation.pdf`);
}

// ==========================================
// 2. MATERIAL, EQUIPMENT & LABOUR REPORT
// ==========================================
export async function generateMaterialLabourPDF(project: any) {
  const doc = new jsPDF();
  const estimate = ensureProjectEstimate(project);
  const docRef = `MAT-${(project.id || 'PROJ').slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  let y = drawDocHeader(
    doc,
    'Material Takeoff, Equipment & Labour Deployment Schedule',
    'Comprehensive schedule of civil supplies, required plant machinery, and site trade labor.',
    docRef,
    project
  );

  // 1.0 Material Takeoff Table
  y = drawSectionHeader(doc, y, '1.0', 'Raw Material Takeoff & Procurement Specifications');

  const matTable = [
    ['1', 'Ordinary Portland Cement (OPC 53)', `${estimate.cementBags?.toLocaleString('en-IN')} Bags`, 'IS 12269 certified fresh batch', '50 Kg Bags', 'Priority 1'],
    ['2', 'High-Yield Fe-550D TMT Steel', `${estimate.steelKg?.toLocaleString('en-IN')} Kg`, 'IS 1786 primary rolling mill rebar', 'Tons / Bundles', 'Priority 1'],
    ['3', 'River Sand / M-Sand (Zone II)', `${estimate.sandCft?.toLocaleString('en-IN')} CFT`, 'Silt content < 3%, dry screened', 'Truck Loads', 'Priority 2'],
    ['4', 'Graded Granite Aggregate (20mm/10mm)', `${estimate.aggregateCft?.toLocaleString('en-IN')} CFT`, 'Angular, clean washed aggregate', 'Dumper Loads', 'Priority 2'],
    ['5', 'Standard Red Bricks / AAC Blocks', `${estimate.bricksCount?.toLocaleString('en-IN')} Pcs`, 'Class 1 burnt clay / 4-inch AAC', 'Pallets', 'Priority 3'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['#', 'Material Item', 'Takeoff Quantity', 'Technical Specification', 'Supply Unit', 'Procurement']],
    body: matTable,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // 2.0 Equipment Schedule
  y = drawSectionHeader(doc, y, '2.0', 'Civil Machinery, Equipment & Tooling Schedule');

  const equipList: EquipmentItem[] = estimate.equipmentItems || calculateRequiredEquipment(project.builtUpAreaSqFt || 2000, 1);
  const equipData = equipList.map((item, idx) => [
    (idx + 1).toString(),
    item.name,
    item.category,
    item.quantity,
    `${item.durationDays} Days`,
    item.purpose,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Equipment Description', 'Category', 'Required Units', 'Duration', 'Civil Site Purpose']],
    body: equipData,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 24 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  if (y > 220) {
    doc.addPage();
    y = 18;
  }

  // 3.0 Trade Labour Force Roster
  y = drawSectionHeader(doc, y, '3.0', 'Trade Workforce & Labour Sizing');

  const labourData = [
    ['Skilled Masons', `${estimate.masonCount} Personnel`, '8 Hours / Shift', 'Foundation, brick masonry, plastering & flooring'],
    ['General Helpers & Beldars', `${estimate.helperCount} Personnel`, '8 Hours / Shift', 'Batch mixing, curing, rebar carriage & material feed'],
    ['Licensed Electricians', `${estimate.electricianCount || 1} Personnel`, 'Phase Dependent', 'Concealed conduit piping, DB installation & earthing'],
    ['Certified Plumbers', `${estimate.plumberCount || 1} Personnel`, 'Phase Dependent', 'CPVC water supply lines, drainage & sewer stacks'],
    ['Project Site Supervisor', '1 Engineer', 'Full Project Cycle', 'Quality inspection, level verification & daily reporting'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Trade Role', 'Staffing Headcount', 'Shift Schedule', 'Operational Scope']],
    body: labourData,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  // 4.0 Signatures
  y = drawSectionHeader(doc, y, '4.0', 'Engineering Approval & Material Dispatch Authorization');
  drawSignaturesBlock(doc, y);

  applyFooters(doc);
  doc.save(`${project.name.replace(/\s+/g, '_')}_Material_Equipment_Report.pdf`);
}

// ==========================================
// 3. BUDGET VARIANCE & FINANCIAL AUDIT REPORT
// ==========================================
export async function generateBudgetVariancePDF(project: any) {
  const doc = new jsPDF();
  const estimate = ensureProjectEstimate(project);
  const docRef = `FIN-${(project.id || 'PROJ').slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const totalBudget = estimate.totalEstimatedCost || project.budget || 1;
  const spentSoFar = (project.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
  const remainingBudget = totalBudget - spentSoFar;
  const burnPercent = Math.round((spentSoFar / totalBudget) * 100);

  let y = drawDocHeader(
    doc,
    'Budget Variance & Financial Expenditure Audit',
    'Itemized expense register, cost variance tracking, and budget utilization audit.',
    docRef,
    project
  );

  // 1.0 Executive Financial Metrics
  y = drawSectionHeader(doc, y, '1.0', 'Executive Financial Health & Variance Summary');

  // 4 KPI Summary Cards
  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = (pageWidth - 28 - 9) / 4;

  const kpis = [
    { label: 'TOTAL BUDGET', val: formatInr(totalBudget), color: COLORS.navyPrimary },
    { label: 'TOTAL EXPENDITURE', val: formatInr(spentSoFar), color: [37, 99, 235] },
    { label: 'REMAINING BALANCE', val: formatInr(remainingBudget), color: remainingBudget >= 0 ? COLORS.tealAccent : COLORS.coral },
    { label: 'BUDGET BURN RATE', val: `${burnPercent}%`, color: burnPercent > 100 ? COLORS.coral : COLORS.navyPrimary },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(COLORS.borderSlate[0], COLORS.borderSlate[1], COLORS.borderSlate[2]);
    doc.roundedRect(x, y, cardWidth, 16, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
    doc.text(kpi.label, x + 3, y + 4.5);

    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, y + 11.5);
  });

  y += 20;

  // 2.0 Category Breakdown Table
  y = drawSectionHeader(doc, y, '2.0', 'Expenditure by Cost Center Category');

  const categories = ['MATERIAL', 'LABOUR', 'EQUIPMENT', 'OVERHEAD', 'SUBCONTRACTOR', 'OTHER'];
  const catSummary = categories.map((cat) => {
    const total = (project.expenses || [])
      .filter((e: any) => (e.category || 'MATERIAL').toUpperCase() === cat)
      .reduce((s: number, e: any) => s + e.amount, 0);
    const share = spentSoFar > 0 ? Math.round((total / spentSoFar) * 100) : 0;
    return [cat, formatInr(total), `${share}%`];
  }).filter((row) => row[1] !== 'Rs. 0');

  if (catSummary.length === 0) {
    catSummary.push(['ALL CATEGORIES (NO EXPENSES LOGGED YET)', 'Rs. 0', '0%']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Cost Category', 'Actual Amount Spent', 'Expenditure Share %']],
    body: catSummary,
    foot: [['TOTAL RECORDED DISBURSEMENTS', formatInr(spentSoFar), '100%']],
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [241, 245, 249], textColor: [18, 37, 66], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // 3.0 Itemized Expense Audit Log
  y = drawSectionHeader(doc, y, '3.0', 'Itemized Expense Voucher Audit Register');

  const expenseRows = (project.expenses || []).map((e: any, idx: number) => [
    (idx + 1).toString(),
    formatDate(e.date),
    e.category || 'MATERIAL',
    e.itemName || 'Expense Item',
    e.receiptUrl ? 'Verified Receipt' : 'Direct Invoice',
    formatInr(e.amount),
  ]);

  if (expenseRows.length === 0) {
    expenseRows.push(['-', '-', 'GENERAL', 'No expense vouchers logged in current billing cycle', '-', 'Rs. 0']);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'Date', 'Category', 'Item / Description', 'Voucher Type', 'Amount (INR)']],
    body: expenseRows,
    foot: [['', '', '', 'NET EXPENSES LOGGED', '', formatInr(spentSoFar)]],
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [45, 191, 158], textColor: [7, 18, 36], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 28 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 28, halign: 'center' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  // 4.0 Signatures
  y = drawSectionHeader(doc, y, '4.0', 'Financial Controller & Project Auditor Sign-off');
  drawSignaturesBlock(doc, y);

  applyFooters(doc);
  doc.save(`${project.name.replace(/\s+/g, '_')}_Budget_Variance_Audit.pdf`);
}

// ==========================================
// 4. TIMELINE, MILESTONES & RISK REPORT
// ==========================================
export async function generateTimelineRiskPDF(project: any) {
  const doc = new jsPDF();
  const estimate = ensureProjectEstimate(project);
  const docRef = `SCH-${(project.id || 'PROJ').slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const spentSoFar = (project.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
  const completedTasks = (project.tasks || []).filter((t: any) => t.isCompleted);
  const incompleteTasks = (project.tasks || []).filter((t: any) => !t.isCompleted);
  const completedDueDates = incompleteTasks.map((t: any) => new Date(t.dueDate));

  const riskResult = computeRisk({
    budget: project.budget || estimate.totalEstimatedCost,
    totalEstimatedCost: estimate.totalEstimatedCost,
    spentSoFar,
    progressPercent: project.progressPercent || 0,
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate),
    completedTaskDueDates: completedDueDates,
    plannedLabourHeadcount: estimate.masonCount + estimate.helperCount,
    actualLabourHeadcount: estimate.masonCount + estimate.helperCount,
  });

  let y = drawDocHeader(
    doc,
    'Project Timeline, Phase Milestones & AI Risk Audit',
    'Comprehensive stage-by-stage work breakdown structure, task status, and risk analysis.',
    docRef,
    project
  );

  // 1.0 Executive Progress & Risk Overview
  y = drawSectionHeader(doc, y, '1.0', 'Executive Progress & Risk Gauge Overview');

  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = (pageWidth - 28 - 9) / 4;

  const kpis = [
    { label: 'PHYSICAL PROGRESS', val: `${Math.round(project.progressPercent || 0)}%`, color: COLORS.tealAccent },
    { label: 'TASKS COMPLETED', val: `${completedTasks.length} / ${(project.tasks || []).length}`, color: COLORS.navyPrimary },
    { label: 'OVERALL RISK LEVEL', val: `${riskResult.level.toUpperCase()} (${riskResult.overallScore}/100)`, color: riskResult.level === 'High' ? COLORS.coral : riskResult.level === 'Medium' ? COLORS.amber : COLORS.tealAccent },
    { label: 'SCHEDULE GAP', val: `${Math.round(riskResult.delayScore)} pts`, color: riskResult.delayScore > 40 ? COLORS.coral : COLORS.navyPrimary },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(COLORS.borderSlate[0], COLORS.borderSlate[1], COLORS.borderSlate[2]);
    doc.roundedRect(x, y, cardWidth, 16, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
    doc.text(kpi.label, x + 3, y + 4.5);

    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, y + 11.5);
  });

  y += 20;

  // 2.0 AI Risk Matrix Table
  y = drawSectionHeader(doc, y, '2.0', 'AI Predictive Risk Assessment Matrix');

  const riskData = [
    ['1', 'Budget Overrun & Burn Rate Risk', `${Math.round(riskResult.budgetOverrunScore)} / 100`, riskResult.budgetOverrunScore > 50 ? 'HIGH' : riskResult.budgetOverrunScore > 25 ? 'MEDIUM' : 'LOW', 'Enforce tight procurement limits on material deliveries'],
    ['2', 'Schedule Delay & Critical Path Risk', `${Math.round(riskResult.delayScore)} / 100`, riskResult.delayScore > 50 ? 'HIGH' : riskResult.delayScore > 25 ? 'MEDIUM' : 'LOW', 'Deploy parallel trades for plumbing and electrical conduits'],
    ['3', 'Raw Material Volatility & Inflation', `${Math.round(riskResult.materialVolatilityScore)} / 100`, riskResult.materialVolatilityScore > 40 ? 'MEDIUM' : 'LOW', 'Lock bulk pricing for Fe-550D TMT rebar and OPC cement'],
    ['4', 'Labour Headcount Shortage Risk', `${Math.round(riskResult.labourShortageScore)} / 100`, riskResult.labourShortageScore > 40 ? 'MEDIUM' : 'LOW', 'Ensure contractor maintains on-site mason/helper staffing'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['#', 'Risk Vector', 'Score', 'Severity', 'AI Mitigation Strategy']],
    body: riskData,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 54, fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // 3.0 Work Breakdown Structure & Phase Task Register
  y = drawSectionHeader(doc, y, '3.0', 'Phase Milestones & Task Progress Register');

  const taskRows = (project.tasks || []).map((t: any, idx: number) => [
    (idx + 1).toString(),
    t.phaseName || 'General Phase',
    t.title,
    formatDate(t.dueDate),
    t.assignee || 'Civil Contractor',
    t.isCompleted ? 'COMPLETED (100%)' : `${Math.round(t.progressPercent || 0)}%`,
  ]);

  if (taskRows.length === 0) {
    taskRows.push(['-', 'PLANNING', 'Project Initial Planning & Blueprint Setup', formatDate(project.startDate), 'Lead Architect', '100%']);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'Phase Name', 'Task / Milestone Title', 'Target Date', 'Assignee Trade', 'Status']],
    body: taskRows,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 30 },
      5: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  // 4.0 Signatures
  y = drawSectionHeader(doc, y, '4.0', 'Project Manager & Quality Assurance Sign-off');
  drawSignaturesBlock(doc, y);

  applyFooters(doc);
  doc.save(`${project.name.replace(/\s+/g, '_')}_Timeline_Risk_Report.pdf`);
}

// ==========================================
// 5. MASTER COMPREHENSIVE PROJECT DOSSIER
// ==========================================
export async function generateMasterDossierPDF(project: any) {
  const doc = new jsPDF();
  const estimate = ensureProjectEstimate(project);
  const docRef = `DOS-${(project.id || 'PROJ').slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const totalBudget = estimate.totalEstimatedCost || project.budget || 1;
  const spentSoFar = (project.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
  const remainingBudget = totalBudget - spentSoFar;
  const burnPercent = Math.round((spentSoFar / totalBudget) * 100);

  // PAGE 1: Executive Overview & Cost Estimation
  let y = drawDocHeader(
    doc,
    'Comprehensive Project Master Dossier',
    'Executive master dossier integrating cost estimations, material takeoff, plant machinery, budget, and timeline.',
    docRef,
    project
  );

  y = drawSectionHeader(doc, y, '1.0', 'Executive Project Summary & KPI Dashboard');

  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = (pageWidth - 28 - 9) / 4;

  const kpis = [
    { label: 'ESTIMATED BUDGET', val: formatInr(totalBudget), color: COLORS.navyPrimary },
    { label: 'RATE / SQ.FT', val: `${formatInr(estimate.costPerSqFt)}/sq.ft`, color: COLORS.tealAccent },
    { label: 'ACTUAL EXPENDITURE', val: formatInr(spentSoFar), color: [37, 99, 235] },
    { label: 'PHYSICAL PROGRESS', val: `${Math.round(project.progressPercent || 0)}%`, color: COLORS.navyPrimary },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(COLORS.borderSlate[0], COLORS.borderSlate[1], COLORS.borderSlate[2]);
    doc.roundedRect(x, y, cardWidth, 16, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.slateMuted[0], COLORS.slateMuted[1], COLORS.slateMuted[2]);
    doc.text(kpi.label, x + 3, y + 4.5);

    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3, y + 11.5);
  });

  y += 20;

  // Cost Center Breakdown
  y = drawSectionHeader(doc, y, '2.0', 'Cost Center Breakdown & Budget Allocations');

  const costData = [
    ['1', 'Raw Material Procurement (Cement, Steel, Sand, Bricks, Aggregate)', formatInr(estimate.materialCost), `${Math.round((estimate.materialCost / totalBudget) * 100)}%`],
    ['2', 'Skilled & General Labour Force (Masons, Helpers, Electricians, Plumbers)', formatInr(estimate.labourCost), `${Math.round((estimate.labourCost / totalBudget) * 100)}%`],
    ['3', 'Required Civil Machinery & Plant Rentals (Mixers, Vibrators, Rebar Benders, JCB)', formatInr(estimate.equipmentCost), `${Math.round((estimate.equipmentCost / totalBudget) * 100)}%`],
    ['4', 'Site Overhead, Contingency & Engineering Supervision (8%)', formatInr(estimate.overheadCost), `${Math.round((estimate.overheadCost / totalBudget) * 100)}%`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['#', 'Cost Center / Engineering Component', 'Estimated Cost (INR)', '% Share']],
    body: costData,
    foot: [['', 'TOTAL ESTIMATED PROJECT COST', formatInr(totalBudget), '100%']],
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [45, 191, 158], textColor: [7, 18, 36], fontStyle: 'bold', fontSize: 8.5 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // PAGE 2: Material Takeoff & Equipment Schedule
  doc.addPage();
  y = 18;

  y = drawSectionHeader(doc, y, '3.0', 'Raw Material Takeoff & Procurement Specifications');

  const matTable = [
    ['1', 'Ordinary Portland Cement (OPC 53)', `${estimate.cementBags?.toLocaleString('en-IN')} Bags`, 'IS 12269 certified fresh batch', '50 Kg Bags'],
    ['2', 'High-Yield Fe-550D TMT Steel', `${estimate.steelKg?.toLocaleString('en-IN')} Kg`, 'IS 1786 primary rolling mill rebar', 'Tons / Bundles'],
    ['3', 'River Sand / M-Sand (Zone II)', `${estimate.sandCft?.toLocaleString('en-IN')} CFT`, 'Silt content < 3%, dry screened', 'Truck Loads'],
    ['4', 'Graded Granite Aggregate (20mm/10mm)', `${estimate.aggregateCft?.toLocaleString('en-IN')} CFT`, 'Angular, clean washed aggregate', 'Dumper Loads'],
    ['5', 'Standard Red Bricks / AAC Blocks', `${estimate.bricksCount?.toLocaleString('en-IN')} Pcs`, 'Class 1 burnt clay / 4-inch AAC', 'Pallets'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['#', 'Material Item', 'Takeoff Quantity', 'Technical Specification', 'Supply Unit']],
    body: matTable,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 52, fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  y = drawSectionHeader(doc, y, '4.0', 'Civil Machinery, Equipment & Tooling Schedule');

  const equipList: EquipmentItem[] = estimate.equipmentItems || calculateRequiredEquipment(project.builtUpAreaSqFt || 2000, 1);
  const equipData = equipList.map((item, idx) => [
    (idx + 1).toString(),
    item.name,
    item.category,
    item.quantity,
    `${item.durationDays} Days`,
    formatInr(item.estCost),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Equipment Description', 'Category', 'Required Units', 'Duration', 'Est. Rental Cost']],
    body: equipData,
    foot: [['', 'TOTAL EQUIPMENT & PLANT ALLOCATION', '', '', '', formatInr(estimate.equipmentCost)]],
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [241, 245, 249], textColor: [18, 37, 66], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // PAGE 3: Milestones, Tasks, and Approvals
  doc.addPage();
  y = 18;

  y = drawSectionHeader(doc, y, '5.0', 'Phase Milestones & Execution Task Register');

  const taskRows = (project.tasks || []).map((t: any, idx: number) => [
    (idx + 1).toString(),
    t.phaseName || 'General Phase',
    t.title,
    formatDate(t.dueDate),
    t.assignee || 'Civil Contractor',
    t.isCompleted ? 'COMPLETED' : `${Math.round(t.progressPercent || 0)}%`,
  ]);

  if (taskRows.length === 0) {
    taskRows.push(['1', 'Planning', 'Architectural Blueprints & Foundation Layout', formatDate(project.startDate), 'Civil Contractor', '100%']);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'Phase Name', 'Milestone / Task', 'Target Due', 'Assignee', 'Status']],
    body: taskRows,
    theme: 'grid',
    headStyles: { fillColor: [18, 37, 66], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 30 },
      5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  y = drawSectionHeader(doc, y, '6.0', 'Executive Signatures & Technical Authorization');
  drawSignaturesBlock(doc, y);

  applyFooters(doc);
  doc.save(`${project.name.replace(/\s+/g, '_')}_Master_Comprehensive_Dossier.pdf`);
}

