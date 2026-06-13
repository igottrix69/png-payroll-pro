// lib/export/pdf.ts — Payslip PDF generation (jsPDF + AutoTable)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PayrollRun, PayrollLineItem, Company } from '@/types';
import { formatPGK, formatDate, formatFortnight } from '@/lib/utils';

const BURGUNDY: [number, number, number] = [139, 0, 0];
const GOLD: [number, number, number] = [201, 168, 76];
const DARK: [number, number, number] = [40, 30, 30];
const MUTED: [number, number, number] = [120, 110, 110];
const LINE: [number, number, number] = [210, 200, 200];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT: [number, number, number] = [245, 240, 240];

const PAGE_W = 210; // A4 portrait mm
const MARGIN = 14;

/** Draw a single payslip onto the document at the given top Y. Returns next Y. */
function drawPayslip(doc: jsPDF, run: PayrollRun, item: PayrollLineItem, company: Company): void {
  let y = MARGIN;

  // ---- Header band (burgundy) ----
  doc.setFillColor(...BURGUNDY);
  doc.rect(0, 0, PAGE_W, 30, 'F');

  // Logo (if uploaded)
  let textX = MARGIN;
  if (company.logoBase64) {
    try {
      doc.addImage(company.logoBase64, 'PNG', MARGIN, 6, 18, 18);
      textX = MARGIN + 22;
    } catch {
      /* ignore bad logo data */
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(company.name, textX, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(company.tradingName || 'PNG Payroll Pro', textX, 19);

  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAYSLIP', PAGE_W - MARGIN, 12, { align: 'right' });
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Run ${run.runNumber}`, PAGE_W - MARGIN, 18, { align: 'right' });
  doc.text(formatFortnight(run.periodStart, run.periodEnd), PAGE_W - MARGIN, 23, { align: 'right' });

  y = 38;

  // ---- Employee details ----
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EMPLOYEE DETAILS', MARGIN, y);
  y += 2;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;

  const detail = (label: string, value: string, x: number, yy: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(label, x, yy);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(value, x, yy + 4.5);
  };

  const colL = MARGIN;
  const colR = PAGE_W / 2 + 4;
  detail('Name', item.employeeName, colL, y);
  detail('Employee #', item.employeeNumber, colR, y);
  y += 11;
  detail('Position', '—', colL, y); // position not stored on line item; show department instead below
  detail('Department', item.department, colR, y);
  y += 11;
  detail('Period', formatFortnight(run.periodStart, run.periodEnd), colL, y);
  detail('Pay Date', formatDate(run.payDate), colR, y);
  y += 13;

  // ---- Earnings / Deductions tables side by side ----
  const earnings: Array<[string, string]> = [['Base Salary', formatPGK(item.grossSalary)]];
  if (item.housingAllowance) earnings.push(['Housing Allowance', formatPGK(item.housingAllowance)]);
  if (item.vehicleAllowance) earnings.push(['Vehicle Allowance', formatPGK(item.vehicleAllowance)]);
  if (item.mealAllowance) earnings.push(['Meal Allowance', formatPGK(item.mealAllowance)]);
  if (item.otherAllowances) earnings.push(['Other Allowances', formatPGK(item.otherAllowances)]);

  const deductions: Array<[string, string]> = [['SWT (Income Tax)', formatPGK(item.swtDeduction)]];
  if (item.employeeSuperDeduction) deductions.push(['Nasfund (Employee)', formatPGK(item.employeeSuperDeduction)]);
  if (item.loanDeduction) deductions.push(['Loan / Advance', formatPGK(item.loanDeduction)]);
  if (item.otherDeductions) deductions.push(['Other Deductions', formatPGK(item.otherDeductions)]);

  const tableTop = y;
  const halfW = (PAGE_W - MARGIN * 2 - 6) / 2;

  autoTable(doc, {
    startY: tableTop,
    margin: { left: MARGIN },
    tableWidth: halfW,
    head: [['EARNINGS', '']],
    body: earnings,
    foot: [['Total Earnings', formatPGK(item.totalEarnings)]],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: DARK, lineColor: LINE },
    headStyles: { fillColor: BURGUNDY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    footStyles: { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
  });

  autoTable(doc, {
    startY: tableTop,
    margin: { left: MARGIN + halfW + 6 },
    tableWidth: halfW,
    head: [['DEDUCTIONS', '']],
    body: deductions,
    foot: [['Total Deductions', formatPGK(item.totalDeductions)]],
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: DARK, lineColor: LINE },
    headStyles: { fillColor: BURGUNDY, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    footStyles: { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } },
  });

  // jspdf-autotable stores the final Y on the doc
  // @ts-expect-error lastAutoTable is injected by the plugin
  y = (doc.lastAutoTable?.finalY ?? tableTop + 40) + 8;

  // ---- Net pay band ----
  doc.setFillColor(...BURGUNDY);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET PAY', MARGIN + 4, y + 9);
  doc.setFontSize(13);
  doc.text(formatPGK(item.netPay), PAGE_W - MARGIN - 4, y + 9, { align: 'right' });
  y += 20;

  // ---- Employer info ----
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('EMPLOYER CONTRIBUTION (not deducted from employee)', MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(`Nasfund Employer Contribution: ${formatPGK(item.employerSuperContribution)}`, MARGIN, y);
  doc.text(`Total Cost to Employer: ${formatPGK(item.totalCostToCompany)}`, PAGE_W - MARGIN, y, { align: 'right' });
  y += 9;

  // ---- Footer ----
  doc.setFillColor(245, 240, 240);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 14, 'F');
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Effective Tax Rate: ${item.effectiveTaxRate.toFixed(2)}%`, MARGIN + 4, y + 6);
  doc.text(`Tax Bracket: ${item.taxBracket}`, MARGIN + 4, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.text('Generated by PNG Payroll Pro', PAGE_W - MARGIN - 4, y + 6, { align: 'right' });
  doc.text('IRC SWT per 2024/2025 fortnightly schedule', PAGE_W - MARGIN - 4, y + 10.5, { align: 'right' });
}

/** Build a single-payslip PDF document. */
export function buildPayslipDoc(run: PayrollRun, item: PayrollLineItem, company: Company): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawPayslip(doc, run, item, company);
  return doc;
}

/** Download one payslip PDF. */
export function downloadPayslip(run: PayrollRun, item: PayrollLineItem, company: Company): void {
  const doc = buildPayslipDoc(run, item, company);
  doc.save(`Payslip_${item.employeeNumber}_${run.runNumber}.pdf`);
}

/** Download all payslips for a run as one multi-page PDF (one payslip per page). */
export function downloadAllPayslips(run: PayrollRun, company: Company): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  run.lineItems.forEach((item, idx) => {
    if (idx > 0) doc.addPage();
    drawPayslip(doc, run, item, company);
  });
  doc.save(`Payslips_${run.runNumber}.pdf`);
}
