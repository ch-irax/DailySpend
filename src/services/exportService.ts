import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CurrencyCode, Expense } from '../types/expense'
import { formatMoney } from '../utils/currency'
import { formatDisplayDate, inRange, monthLabel } from '../utils/date'
import { CATEGORIES } from '../types/expense'

export type ExportRange = 'today' | 'week' | 'month' | 'custom' | 'all'

export function filterForExport(
  expenses: Expense[],
  range: ExportRange,
  from?: string,
  to?: string,
): Expense[] {
  const today = new Date()
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  let start: string | undefined
  let end: string | undefined
  if (range === 'today') {
    start = end = iso(today)
  } else if (range === 'week') {
    const day = today.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - diff)
    start = iso(monday)
    end = iso(today)
  } else if (range === 'month') {
    start = iso(new Date(today.getFullYear(), today.getMonth(), 1))
    end = iso(today)
  } else if (range === 'custom') {
    start = from
    end = to
  }
  return expenses
    .filter((item) => !item.deletedAt)
    .filter((item) => inRange(item.date, start, end))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

function rows(expenses: Expense[]) {
  return expenses.map((item) => ({
    ID: item.id,
    Title: item.title,
    Description: item.description,
    Amount: item.amount,
    Category: item.category,
    Date: item.date,
    CreatedAt: item.createdAt,
    UpdatedAt: item.updatedAt,
  }))
}

function stamp() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function filenameFor(kind: 'xlsx' | 'csv' | 'pdf', range: ExportRange) {
  const rangeTag = range === 'custom' ? 'custom' : range
  if (kind === 'pdf') {
    return `DailySpend_${monthLabel().replace(' ', '_')}_${rangeTag}.pdf`
  }
  const ext = kind === 'xlsx' ? 'xlsx' : 'csv'
  return `DailySpend_Expenses_${rangeTag}_${stamp()}.${ext}`
}

export function buildExcel(expenses: Expense[]): Blob {
  const sheet = XLSX.utils.json_to_sheet(rows(expenses))
  sheet['!cols'] = [
    { wch: 36 },
    { wch: 24 },
    { wch: 32 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 24 },
    { wch: 24 },
  ]
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Expenses')
  const out = XLSX.write(book, { bookType: 'xlsx', type: 'array' })
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function buildCsv(expenses: Expense[]): Blob {
  const header = ['ID', 'Title', 'Description', 'Amount', 'Category', 'Date', 'CreatedAt', 'UpdatedAt']
  const escape = (value: string | number) => {
    const text = String(value ?? '')
    if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`
    return text
  }
  const lines = [
    header.join(','),
    ...expenses.map((item) =>
      [
        item.id,
        item.title,
        item.description,
        item.amount,
        item.category,
        item.date,
        item.createdAt,
        item.updatedAt,
      ]
        .map(escape)
        .join(','),
    ),
  ]
  const bom = '\uFEFF'
  return new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
}

function formatPdfMoney(amount: number, currency: CurrencyCode): string {
  const formatted = formatMoney(amount, currency)
  // Standard Helvetica in jsPDF does not encode Unicode U+20B9 (₹), which turns into '¹'.
  // Using 'Rs. ' keeps the PDF clean and readable across all PDF viewers without requiring custom font bundles.
  return currency === 'INR' ? formatted.replace('₹', 'Rs. ') : formatted
}

export function buildPdf(
  expenses: Expense[],
  currency: CurrencyCode,
  periodLabel: string,
): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const total = expenses.reduce((sum, item) => sum + item.amount, 0)

  doc.setFillColor(255, 249, 244)
  doc.rect(0, 0, pageWidth, 110, 'F')
  doc.setFillColor(252, 232, 232)
  doc.rect(0, 110, pageWidth, 6, 'F')

  doc.setTextColor(217, 140, 145)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('DAILYSPEND', 40, 42)

  doc.setTextColor(64, 52, 47)
  doc.setFontSize(22)
  doc.text('Expense report', 40, 70)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(155, 139, 131)
  doc.text(periodLabel, 40, 90)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(64, 52, 47)
  doc.setFontSize(12)
  doc.text(`Total ${formatPdfMoney(total, currency)}`, pageWidth - 40, 70, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(155, 139, 131)
  doc.text(`${expenses.length} transaction${expenses.length === 1 ? '' : 's'}`, pageWidth - 40, 90, {
    align: 'right',
  })

  const byCategory = CATEGORIES.map((category) => ({
    category,
    total: expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0),
  })).filter((row) => row.total > 0)

  autoTable(doc, {
    startY: 136,
    head: [['Category', 'Total']],
    body: byCategory.map((row) => [row.category, formatPdfMoney(row.total, currency)]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 10, textColor: [64, 52, 47] },
    headStyles: { fillColor: [252, 232, 232], textColor: [139, 111, 97], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 249, 244] },
    margin: { left: 40, right: 40 },
  })

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24,
    head: [['Date', 'Title', 'Category', 'Amount']],
    body: expenses.map((item) => [
      formatDisplayDate(item.date),
      item.title,
      item.category,
      formatPdfMoney(item.amount, currency),
    ]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: [64, 52, 47], cellPadding: 6 },
    headStyles: { fillColor: [217, 140, 145], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 249, 244] },
    columnStyles: { 3: { halign: 'right' } },
    margin: { left: 40, right: 40, bottom: 48 },
    didDrawPage: (data) => {
      const page = doc.getNumberOfPages()
      doc.setFontSize(9)
      doc.setTextColor(155, 139, 131)
      doc.text('DailySpend · a little space for everyday spending', 40, doc.internal.pageSize.getHeight() - 24)
      doc.text(`Page ${String(page)}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 24, {
        align: 'right',
      })
      void data
    },
  })

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(64, 52, 47)
  doc.text(`Final total  ${formatPdfMoney(total, currency)}`, pageWidth - 40, finalY + 28, { align: 'right' })

  return doc.output('blob')
}

export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function shareOrDownload(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text: 'DailySpend export' })
    return
  }
  await downloadBlob(blob, filename)
}
