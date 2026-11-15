import { Download, HandCoins, Landmark, PiggyBank, ReceiptText, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { useBudget } from '../store/BudgetContext';
import { categorySummary, dashboardSummary, expenseTotal, incomeTotal, savingsTotal } from '../utils/calculations';
import { formatMonth, recentMonths } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { getPartnerLabels } from '../types/finance';

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function ReportsPage() {
  const { data, selectedMonth, notify } = useBudget();
  const summary = dashboardSummary(data, selectedMonth);
  const partnerNames = getPartnerLabels(data.settings);
  const categories = categorySummary(data, selectedMonth);
  const myContributions = data.walletTransfers.filter((item) => item.date.startsWith(selectedMonth) && item.fromWallet === 'my-wallet' && item.toWallet === 'shared-wallet').reduce((sum, item) => sum + item.amount, 0);
  const andreContributions = data.walletTransfers.filter((item) => item.date.startsWith(selectedMonth) && item.fromWallet === 'andre-wallet' && item.toWallet === 'shared-wallet').reduce((sum, item) => sum + item.amount, 0);
  const sharedExpenses = data.expenses.filter((item) => item.date.startsWith(selectedMonth) && item.expenseType === 'shared').reduce((sum, item) => sum + item.amount, 0);
  const activity = recentMonths(6).reverse().map((month) => ({ month: formatMonth(month).split(' ')[0].slice(0, 3), Income: incomeTotal(data, month), Expenses: expenseTotal(data, month), Savings: savingsTotal(data, month) }));
  const tooltipMoney = (value: unknown) => formatMoney(Number(Array.isArray(value) ? value[0] : value ?? 0));

  const exportCsv = () => {
    const rows = [
      ['Our Budget Monthly Report', formatMonth(selectedMonth)],
      [],
      ['Summary', 'Amount (PHP)'],
      ['Total income', (summary.combinedIncome / 100).toFixed(2)],
      ['Total expenses', (summary.expenses / 100).toFixed(2)],
      ['Total savings contributions', (savingsTotal(data, selectedMonth) / 100).toFixed(2)],
      [`${partnerNames.me}'s shared contribution`, (myContributions / 100).toFixed(2)],
      [`${partnerNames.andre}'s shared contribution`, (andreContributions / 100).toFixed(2)],
      ['Shared expenses', (sharedExpenses / 100).toFixed(2)],
      ['Remaining spendable cash (all time)', (summary.spendableCash / 100).toFixed(2)],
      [],
      ['Category', 'Planned (PHP)', 'Actual (PHP)', 'Remaining (PHP)', 'Percent Used'],
      ...categories.map((item) => [item.category, (item.planned / 100).toFixed(2), (item.actual / 100).toFixed(2), (item.remaining / 100).toFixed(2), `${item.percentage}%`]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `our-budget-${selectedMonth}.csv`; anchor.click();
    URL.revokeObjectURL(url);
    notify('Monthly report exported to CSV.');
  };

  return <div className="space-y-7">
    <PageHeader eyebrow="Monthly close" title="Reports" description={`A complete financial summary for ${formatMonth(selectedMonth)}, ready to review or export.`} actions={<Button onClick={exportCsv}><Download size={17} />Export CSV</Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Monthly income" value={formatMoney(summary.combinedIncome)} icon={TrendingUp} /><StatCard label="Monthly expenses" value={formatMoney(summary.expenses)} icon={TrendingDown} tone="coral" /><StatCard label="Saved this month" value={formatMoney(savingsTotal(data, selectedMonth))} icon={PiggyBank} tone="violet" /><StatCard label="Remaining cash" value={formatMoney(summary.spendableCash)} icon={Landmark} tone="blue" hint="All-time spendable balance" /></section>
    <section className="grid gap-5 lg:grid-cols-3"><article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex items-center gap-3"><div className="rounded-xl bg-brand-50 p-2.5 text-brand-700"><HandCoins size={20} /></div><div><p className="text-sm text-muted">{partnerNames.me}'s shared contribution</p><p className="text-xl font-bold text-ink">{formatMoney(myContributions)}</p></div></div></article><article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><HandCoins size={20} /></div><div><p className="text-sm text-muted">{partnerNames.andre}'s shared contribution</p><p className="text-xl font-bold text-ink">{formatMoney(andreContributions)}</p></div></div></article><article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex items-center gap-3"><div className="rounded-xl bg-coral-50 p-2.5 text-coral-600"><ReceiptText size={20} /></div><div><p className="text-sm text-muted">Shared expenses</p><p className="text-xl font-bold text-ink">{formatMoney(sharedExpenses)}</p></div></div></article></section>
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"><div className="mb-5"><h2 className="font-bold text-ink">Six-month financial activity</h2><p className="text-sm text-muted">Income, expenses, and savings contributions</p></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={activity}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eeec" /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(value) => formatMoney(value, true)} width={64} /><Tooltip formatter={tooltipMoney} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} /><Legend iconType="circle" iconSize={8} /><Bar dataKey="Income" fill="#159981" radius={[6, 6, 0, 0]} /><Bar dataKey="Expenses" fill="#ee775c" radius={[6, 6, 0, 0]} /><Bar dataKey="Savings" fill="#8069d9" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></article><article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink">Budget performance</h2><p className="text-sm text-muted">Category usage for this month</p></div><Scale className="text-brand-600" size={20} /></div><div className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">{categories.length ? categories.map((item) => <div key={item.category}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-ink">{item.category}</span><span className={item.remaining < 0 ? 'font-semibold text-red-600' : 'text-muted'}>{item.percentage}%</span></div><ProgressBar value={item.percentage} tone={item.remaining < 0 ? 'danger' : item.percentage >= 80 ? 'warning' : 'brand'} /><div className="mt-1 flex justify-between text-xs text-muted"><span>{formatMoney(item.actual)} actual</span><span>{formatMoney(item.planned)} planned</span></div></div>) : <p className="py-10 text-center text-sm text-muted">No category activity for this month.</p>}</div></article></section>
  </div>;
}
