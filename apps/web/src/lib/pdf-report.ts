import type { Category, MonthSummary, Transaction } from '@spendly/shared';
import { formatDateKey, formatMoney, formatMonth, formatPercent } from './format';

/** Builds a one-month PDF statement. jsPDF is loaded on demand to keep the main bundle small. */
export async function downloadMonthReport({
  summary,
  transactions,
  categories,
  userName,
}: {
  summary: MonthSummary;
  transactions: Transaction[];
  categories: Map<string, Category>;
  userName: string;
}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const money = (value: number) => formatMoney(value, summary.currency);
  const violet: [number, number, number] = [124, 58, 237];

  doc.setFillColor(...violet);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Spendly', 40, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Monthly statement | ${formatMonth(summary.month)} | ${userName}`, 40, 68);

  doc.setTextColor(30, 30, 30);
  autoTable(doc, {
    startY: 115,
    head: [['Income', 'Expenses', 'Net', 'Savings rate']],
    body: [
      [
        money(summary.income),
        money(summary.expense),
        money(summary.net),
        summary.savingsRate === null ? '-' : formatPercent(summary.savingsRate),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: violet },
    styles: { fontSize: 11, cellPadding: 8 },
  });

  if (summary.byCategory.length) {
    autoTable(doc, {
      head: [['Category', 'Transactions', 'Spent', 'Share']],
      body: summary.byCategory.map((row) => [
        categories.get(row.categoryId)?.name ?? 'Unknown',
        String(row.count),
        money(row.total),
        formatPercent(row.total / summary.expense),
      ]),
      theme: 'striped',
      headStyles: { fillColor: violet },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
  }

  autoTable(doc, {
    head: [['Date', 'Title', 'Category', 'Amount']],
    body: transactions.map((tx) => [
      formatDateKey(tx.date, 'MMM d'),
      tx.title,
      categories.get(tx.categoryId)?.name ?? '',
      `${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount, tx.currency)}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: violet },
    columnStyles: { 3: { halign: 'right' } },
    didDrawPage: () => {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Generated ${new Date().toLocaleString()}`,
        40,
        doc.internal.pageSize.getHeight() - 20,
      );
    },
  });

  doc.save(`spendly-${summary.month}.pdf`);
}
