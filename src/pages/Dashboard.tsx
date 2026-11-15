import { ArrowDownRight, ArrowUpRight, Banknote, CircleDollarSign, HandCoins, Landmark, PiggyBank, Plus, Scale, WalletCards } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { useBudget } from '../store/BudgetContext';
import { categorySummary, dashboardSummary, expenseTotal, incomeTotal, savingsTotal } from '../utils/calculations';
import { formatMonth, recentMonths } from '../utils/dates';
import { formatMoney } from '../utils/money';
import type { PageKey } from '../components/layout/Sidebar';
import { getPartnerLabels, getWalletLabels } from '../types/finance';

const chartColors = ['#159981', '#4f7de8', '#ee775c', '#f2ad4d', '#8069d9', '#5ca6a0', '#d66d94'];
const tooltipMoney = (value: unknown) => formatMoney(Number(Array.isArray(value) ? value[0] : value ?? 0));

export function Dashboard({ navigate }: { navigate: (page: PageKey) => void }) {
  const { data, selectedMonth } = useBudget();
  const summary = dashboardSummary(data, selectedMonth);
  const partnerNames = getPartnerLabels(data.settings);
  const walletNames = getWalletLabels(data.settings);
  const categories = categorySummary(data, selectedMonth);
  const spendingData = categories.filter((item) => item.actual > 0).map((item) => ({ name: item.category, value: item.actual }));
  const monthlyData = recentMonths(6).reverse().map((month) => ({ month: formatMonth(month).split(' ')[0].slice(0, 3), Income: incomeTotal(data, month), Expenses: expenseTotal(data, month), Savings: savingsTotal(data, month) }));
  const budgetChart = categories.filter((item) => item.planned > 0 || item.actual > 0).map((item) => ({ category: item.category.length > 11 ? `${item.category.slice(0, 9)}…` : item.category, Planned: item.planned, Actual: item.actual }));

  return <div className="space-y-7">
    <PageHeader eyebrow="Overview" title="Good money decisions start here" description={`A clear view of your income, spending, and shared plan for ${formatMonth(selectedMonth)}.`} actions={<><Button variant="secondary" onClick={() => navigate('income')}><Plus size={17} />Add income</Button><Button onClick={() => navigate('expenses')}><Plus size={17} />Add expense</Button></>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={`${partnerNames.me}'s total income`} value={formatMoney(summary.myIncome)} icon={CircleDollarSign} hint={`Credited to ${walletNames['my-wallet']}`} />
      <StatCard label={`${partnerNames.andre}'s total income`} value={formatMoney(summary.andreIncome)} icon={CircleDollarSign} tone="blue" hint={`Credited to ${walletNames['andre-wallet']}`} />
      <StatCard label="Combined income" value={formatMoney(summary.combinedIncome)} icon={Landmark} tone="violet" hint="Budget funding this month" />
      <StatCard label="Total allocated" value={formatMoney(summary.allocated)} icon={Scale} tone="amber" hint={`${summary.combinedIncome ? Math.round(summary.allocated / summary.combinedIncome * 100) : 0}% of monthly income`} />
      <StatCard label="Unallocated money" value={formatMoney(summary.unallocated)} icon={Banknote} tone={summary.unallocated < 0 ? 'coral' : 'brand'} hint="Income minus planned budget" />
      <StatCard label="Actual expenses" value={formatMoney(summary.expenses)} icon={ArrowDownRight} tone="coral" hint="Recorded once across all wallets" />
      <StatCard label="Available cash" value={formatMoney(summary.spendableCash)} icon={WalletCards} tone="blue" hint="Spendable wallet balances" />
      <StatCard label="Total savings" value={formatMoney(summary.savings)} icon={PiggyBank} tone="violet" hint="Protected from spendable cash" />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-ink">Monthly activity</h2><p className="text-sm text-muted">Income, expenses, and savings over six months</p></div><ArrowUpRight className="text-brand-600" size={20} /></div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} barGap={4}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eeec" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#62716e', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#62716e', fontSize: 11 }} tickFormatter={(value) => formatMoney(value, true)} width={64} /><Tooltip formatter={tooltipMoney} cursor={{ fill: '#f5f7f6' }} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} /><Legend iconType="circle" iconSize={8} /><Bar dataKey="Income" fill="#159981" radius={[6, 6, 0, 0]} /><Bar dataKey="Expenses" fill="#ee775c" radius={[6, 6, 0, 0]} /><Bar dataKey="Savings" fill="#8069d9" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"><div className="mb-3"><h2 className="font-bold text-ink">Spending by category</h2><p className="text-sm text-muted">Where actual expenses went this month</p></div>{spendingData.length ? <><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={spendingData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>{spendingData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={tooltipMoney} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-2">{spendingData.slice(0, 6).map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs text-muted"><span className="h-2.5 w-2.5 rounded-full" style={{ background: chartColors[index % chartColors.length] }} /><span className="truncate">{item.name}</span></div>)}</div></> : <EmptyState title="No spending yet" description="Recorded expenses will appear here without counting transfers or savings." />}</article>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"><div className="mb-5"><h2 className="font-bold text-ink">Budget vs. actual</h2><p className="text-sm text-muted">Compare every planned peso with recorded spending</p></div>{budgetChart.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={budgetChart} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e9eeec" /><XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => formatMoney(value, true)} /><YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#62716e', fontSize: 11 }} width={85} /><Tooltip formatter={tooltipMoney} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} /><Legend iconType="circle" iconSize={8} /><Bar dataKey="Planned" fill="#b9d9d3" radius={[0, 6, 6, 0]} /><Bar dataKey="Actual" fill="#159981" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState title="No budget yet" description="Allocate this month's income to see plan performance." action={<Button onClick={() => navigate('budget')}>Plan this month</Button>} />}</article>
      <article className="rounded-2xl bg-brand-900 p-6 text-white shadow-card"><div className="flex items-center justify-between"><div className="rounded-xl bg-white/10 p-2.5"><HandCoins size={21} /></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">All-time balances</span></div><p className="mt-6 text-sm text-brand-100">Combined available money</p><p className="mt-1 text-3xl font-bold tracking-tight">{formatMoney(summary.combinedMoney)}</p><p className="mt-2 text-xs leading-5 text-brand-100">Wallet cash plus savings, after actual expenses. Planned allocations do not reduce this total.</p><div className="mt-6 space-y-4">{Object.entries(summary.balances).map(([id, balance]) => <div key={id}><div className="mb-1.5 flex justify-between text-xs"><span className="text-brand-100">{walletNames[id as keyof typeof walletNames]}</span><span className="font-semibold">{formatMoney(balance)}</span></div><ProgressBar value={summary.spendableCash > 0 ? balance / summary.spendableCash * 100 : 0} tone="brand" /></div>)}</div><Button className="mt-6 w-full bg-white text-brand-900 hover:bg-brand-50" onClick={() => navigate('wallets')}>Manage wallets</Button></article>
    </section>
  </div>;
}
