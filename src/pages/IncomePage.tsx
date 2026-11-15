import { Edit3, Plus, Search, Trash2, TrendingUp, UserRound } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { incomeSources } from '../data/categories';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useBudget } from '../store/BudgetContext';
import type { Income, Partner } from '../types/finance';
import { getPartnerLabels } from '../types/finance';
import { incomeTotal } from '../utils/calculations';
import { formatDate } from '../utils/dates';
import { formatMoney, pesosToCentavos, centavosToPesos } from '../utils/money';

type IncomeDraft = { amount: string; owner: Partner; source: string; date: string; description: string };
const emptyDraft = (month: string): IncomeDraft => ({ amount: '', owner: 'me', source: 'Salary', date: `${month}-01`, description: '' });

export function IncomePage() {
  const { data, selectedMonth, addIncome, updateIncome, deleteIncome } = useBudget();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [draft, setDraft] = useState<IncomeDraft>(() => emptyDraft(selectedMonth));
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'all' | Partner>('all');
  const [pendingDelete, setPendingDelete] = useState<Income | null>(null);
  const partnerNames = getPartnerLabels(data.settings);
  const monthItems = useMemo(() => data.incomes.filter((item) => item.date.startsWith(selectedMonth)).filter((item) => ownerFilter === 'all' || item.owner === ownerFilter).filter((item) => `${item.source} ${item.description}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [data.incomes, ownerFilter, search, selectedMonth]);

  const launchAdd = () => { setEditing(null); setDraft(emptyDraft(selectedMonth)); setOpen(true); };
  const launchEdit = (item: Income) => { setEditing(item); setDraft({ amount: centavosToPesos(item.amount), owner: item.owner, source: item.source, date: item.date, description: item.description }); setOpen(true); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = { ...draft, amount: pesosToCentavos(draft.amount) };
    const result = editing ? updateIncome(editing.id, payload) : addIncome(payload);
    if (result.ok) setOpen(false);
  };

  return <div className="space-y-7">
    <PageHeader eyebrow="Money in" title="Income" description="Track each partner’s income. Every entry is credited directly to its owner’s personal wallet." actions={<Button onClick={launchAdd}><Plus size={17} />Add income</Button>} />
    <section className="grid gap-4 sm:grid-cols-3"><StatCard label={`${partnerNames.me}'s income`} value={formatMoney(incomeTotal(data, selectedMonth, 'me'))} icon={UserRound} /><StatCard label={`${partnerNames.andre}'s income`} value={formatMoney(incomeTotal(data, selectedMonth, 'andre'))} icon={UserRound} tone="blue" /><StatCard label="Combined income" value={formatMoney(incomeTotal(data, selectedMonth))} icon={TrendingUp} tone="violet" /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search source or description" className="pl-9" aria-label="Search income" /></div><Select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value as 'all' | Partner)} className="sm:w-44" aria-label="Filter by owner"><option value="all">All owners</option><option value="me">{partnerNames.me}</option><option value="andre">{partnerNames.andre}</option></Select></div>
      {monthItems.length ? <div className="table-scroll overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Owner</th><th className="px-5 py-3 font-semibold">Source</th><th className="px-5 py-3 font-semibold">Description</th><th className="px-5 py-3 text-right font-semibold">Amount</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{monthItems.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 text-muted">{formatDate(item.date)}</td><td className="px-5 py-4 font-medium text-ink">{partnerNames[item.owner]}</td><td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{item.source}</span></td><td className="max-w-xs truncate px-5 py-4 text-muted">{item.description || '—'}</td><td className="px-5 py-4 text-right font-bold text-emerald-700">+{formatMoney(item.amount)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => launchEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label={`Edit ${item.source}`}><Edit3 size={17} /></button><button onClick={() => setPendingDelete(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${item.source}`}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No income found" description="Add an income record or adjust the current filters." action={<Button onClick={launchAdd}><Plus size={17} />Add income</Button>} />}
    </section>
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit income' : 'Add income'} description="Amounts are stored as exact centavos and credited to the owner’s wallet."><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Amount (₱)"><Input required min="0.01" step="0.01" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0.00" autoFocus /></Field><Field label="Owner"><Select value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value as Partner })}><option value="me">{partnerNames.me}</option><option value="andre">{partnerNames.andre}</option></Select></Field><Field label="Source"><Select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })}>{incomeSources.map((source) => <option key={source}>{source}</option>)}</Select></Field><Field label="Date received"><Input type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field></div><Field label="Description" hint="Optional"><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Add a useful note" maxLength={160} /></Field><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Add income'}</Button></div></form></Modal>
    <ConfirmDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={() => pendingDelete && deleteIncome(pendingDelete.id)} title="Delete income?" message="This removes the income from its owner’s wallet and may be blocked if later spending would overdraw that wallet." confirmLabel="Delete income" />
  </div>;
}
