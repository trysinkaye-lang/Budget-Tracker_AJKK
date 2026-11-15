import { Edit3, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PageKey } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/FormControls';
import { PageHeader } from '../components/ui/PageHeader';
import { useBudget } from '../store/BudgetContext';
import type { LedgerEntry, LedgerType } from '../types/finance';
import { ledgerEntries } from '../utils/calculations';
import { formatDate } from '../utils/dates';
import { formatMoney } from '../utils/money';

const typeStyles: Record<LedgerType, string> = { income: 'bg-emerald-50 text-emerald-700', expense: 'bg-red-50 text-red-700', transfer: 'bg-blue-50 text-blue-700', savings: 'bg-violet-50 text-violet-700' };
const typePages: Record<LedgerType, PageKey> = { income: 'income', expense: 'expenses', transfer: 'wallets', savings: 'savings' };

export function TransactionsPage({ navigate }: { navigate: (page: PageKey) => void }) {
  const { data, selectedMonth, reverseLedgerEntry } = useBudget();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | LedgerType>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState(`${selectedMonth}-01`);
  const [endDate, setEndDate] = useState(`${selectedMonth}-31`);
  const [pendingReverse, setPendingReverse] = useState<LedgerEntry | null>(null);
  useEffect(() => {
    setStartDate(`${selectedMonth}-01`);
    setEndDate(`${selectedMonth}-31`);
  }, [selectedMonth]);
  const allEntries = useMemo(() => ledgerEntries(data), [data]);
  const owners = Array.from(new Set(allEntries.map((item) => item.owner))).sort();
  const categories = Array.from(new Set(allEntries.map((item) => item.category))).sort();
  const entries = allEntries.filter((item) => item.date >= startDate && item.date <= endDate).filter((item) => typeFilter === 'all' || item.type === typeFilter).filter((item) => ownerFilter === 'all' || item.owner === ownerFilter).filter((item) => categoryFilter === 'all' || item.category === categoryFilter).filter((item) => `${item.description} ${item.category} ${item.wallet}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="space-y-7">
    <PageHeader eyebrow="Complete audit trail" title="Transactions" description="Review every income, expense, wallet transfer, and savings movement without double-counting." />
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card"><div className="border-b border-slate-100 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal size={17} />Filters</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><div className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ledger" className="pl-9" aria-label="Search transactions" /></div><Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | LedgerType)} aria-label="Transaction type"><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option><option value="transfer">Transfer</option><option value="savings">Savings</option></Select><Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} aria-label="Owner"><option value="all">All owners</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</Select><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start date" /><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="End date" /></div><div className="mt-3 max-w-xs"><Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category"><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select></div></div>
      {entries.length ? <div className="table-scroll overflow-x-auto"><table className="w-full min-w-[1060px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Type</th><th className="px-5 py-3 font-semibold">Description</th><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Owner</th><th className="px-5 py-3 font-semibold">Wallet</th><th className="px-5 py-3 text-right font-semibold">Amount</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 text-muted">{formatDate(item.date)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${typeStyles[item.type]}`}>{item.type}</span></td><td className="max-w-[220px] truncate px-5 py-4 font-medium text-ink">{item.description}</td><td className="px-5 py-4 text-muted">{item.category}</td><td className="px-5 py-4 text-muted">{item.owner}</td><td className="max-w-[230px] truncate px-5 py-4 text-muted">{item.wallet}</td><td className={`px-5 py-4 text-right font-bold ${item.type === 'income' ? 'text-emerald-700' : item.type === 'expense' ? 'text-red-600' : item.type === 'savings' ? 'text-violet-700' : 'text-blue-700'}`}>{item.type === 'income' ? '+' : item.type === 'expense' ? '−' : ''}{formatMoney(item.amount)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => navigate(typePages[item.type])} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label={`Edit ${item.type}`} title="Open source page to edit"><Edit3 size={16} /></button><button onClick={() => setPendingReverse(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Reverse ${item.type}`}><RotateCcw size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No matching transactions" description="Adjust the date range or filters to review more ledger activity." />}</section>
    <ConfirmDialog open={!!pendingReverse} onClose={() => setPendingReverse(null)} onConfirm={() => pendingReverse && reverseLedgerEntry(pendingReverse.type, pendingReverse.sourceId)} title={`Reverse ${pendingReverse?.type ?? 'transaction'}?`} message="The original record will be removed and every affected balance will be recalculated. The reversal is blocked if it would create an invalid wallet balance." confirmLabel="Reverse transaction" />
  </div>;
}
