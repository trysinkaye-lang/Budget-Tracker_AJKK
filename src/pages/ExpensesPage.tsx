import { Edit3, Plus, ReceiptText, Search, Trash2, TrendingDown, WalletCards } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { defaultCategories } from '../data/categories';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { useBudget } from '../store/BudgetContext';
import type { Expense, ExpenseType, Partner, WalletId } from '../types/finance';
import { getPartnerLabels, getWalletLabels } from '../types/finance';
import { categorySummary, expenseTotal, walletBalances } from '../utils/calculations';
import { formatDate } from '../utils/dates';
import { centavosToPesos, formatMoney, pesosToCentavos } from '../utils/money';

type Draft = { amount: string; category: string; customCategory: string; date: string; description: string; paidBy: Partner; expenseType: ExpenseType; walletId: WalletId };
const emptyDraft = (month: string): Draft => ({ amount: '', category: 'Food', customCategory: '', date: `${month}-01`, description: '', paidBy: 'me', expenseType: 'shared', walletId: 'shared-wallet' });

export function ExpensesPage() {
  const { data, selectedMonth, addExpense, updateExpense, deleteExpense, notify } = useBudget();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(selectedMonth));
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | Partner>('all');
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const categories = useMemo(() => Array.from(new Set([...defaultCategories, ...data.allocations.map((item) => item.category), ...data.expenses.map((item) => item.category)])).sort(), [data.allocations, data.expenses]);
  const items = useMemo(() => data.expenses.filter((item) => item.date.startsWith(selectedMonth)).filter((item) => categoryFilter === 'all' || item.category === categoryFilter).filter((item) => ownerFilter === 'all' || item.paidBy === ownerFilter).filter((item) => `${item.category} ${item.description}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date)), [categoryFilter, data.expenses, ownerFilter, search, selectedMonth]);
  const balances = walletBalances(data);
  const partnerLabels = getPartnerLabels(data.settings);
  const walletLabels = getWalletLabels(data.settings);
  const categoryStats = categorySummary(data, selectedMonth);
  const overBudgetCount = categoryStats.filter((item) => item.remaining < 0).length;

  const launchAdd = () => { setEditing(null); setDraft(emptyDraft(selectedMonth)); setOpen(true); };
  const launchEdit = (item: Expense) => { const known = categories.includes(item.category); setEditing(item); setDraft({ amount: centavosToPesos(item.amount), category: known ? item.category : 'Custom', customCategory: known ? '' : item.category, date: item.date, description: item.description, paidBy: item.paidBy, expenseType: item.expenseType, walletId: item.walletId }); setOpen(true); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const category = draft.category === 'Custom' ? draft.customCategory.trim() : draft.category;
    if (!category) { notify('Enter a category name.', 'error'); return; }
    const { customCategory: _, ...rest } = draft;
    const payload = { ...rest, category, amount: pesosToCentavos(draft.amount) };
    const result = editing ? updateExpense(editing.id, payload) : addExpense(payload);
    if (result.ok) setOpen(false);
  };

  return <div className="space-y-7">
    <PageHeader eyebrow="Money out" title="Expenses" description="Record actual spending once. The selected wallet and matching category update immediately." actions={<Button onClick={launchAdd}><Plus size={17} />Add expense</Button>} />
    <section className="grid gap-4 sm:grid-cols-3"><StatCard label="Monthly expenses" value={formatMoney(expenseTotal(data, selectedMonth))} icon={TrendingDown} tone="coral" /><StatCard label="Transactions" value={String(data.expenses.filter((item) => item.date.startsWith(selectedMonth)).length)} icon={ReceiptText} tone="blue" /><StatCard label="Over-budget categories" value={String(overBudgetCount)} icon={WalletCards} tone={overBudgetCount ? 'coral' : 'brand'} /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card"><div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_180px_150px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses" className="pl-9" aria-label="Search expenses" /></div><Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select><Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value as 'all' | Partner)} aria-label="Filter by payer"><option value="all">All payers</option><option value="me">{partnerLabels.me}</option><option value="andre">{partnerLabels.andre}</option></Select></div>
      {items.length ? <div className="table-scroll overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Description</th><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Paid by</th><th className="px-5 py-3 font-semibold">Wallet</th><th className="px-5 py-3 text-right font-semibold">Amount</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 text-muted">{formatDate(item.date)}</td><td className="px-5 py-4"><p className="max-w-[220px] truncate font-medium text-ink">{item.description || item.category}</p><p className="text-xs capitalize text-muted">{item.expenseType}</p></td><td className="px-5 py-4"><span className="rounded-full bg-coral-50 px-2.5 py-1 text-xs font-semibold text-coral-600">{item.category}</span></td><td className="px-5 py-4 text-muted">{partnerLabels[item.paidBy]}</td><td className="px-5 py-4 text-muted">{walletLabels[item.walletId]}</td><td className="px-5 py-4 text-right font-bold text-coral-600">−{formatMoney(item.amount)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => launchEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label={`Edit ${item.description}`}><Edit3 size={17} /></button><button onClick={() => setPendingDelete(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${item.description}`}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No expenses found" description="Record spending or adjust the current filters." action={<Button onClick={launchAdd}><Plus size={17} />Add expense</Button>} />}</section>
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit expense' : 'Add expense'} description="Only this recorded transaction changes wallet cash."><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Amount (₱)"><Input required min="0.01" step="0.01" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0.00" autoFocus /></Field><Field label="Date"><Input type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field><Field label="Category"><Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}<option>Custom</option></Select></Field>{draft.category === 'Custom' && <Field label="Custom category"><Input required value={draft.customCategory} onChange={(e) => setDraft({ ...draft, customCategory: e.target.value })} maxLength={40} /></Field>}<Field label="Paid by"><Select value={draft.paidBy} onChange={(e) => setDraft({ ...draft, paidBy: e.target.value as Partner })}><option value="me">{partnerLabels.me}</option><option value="andre">{partnerLabels.andre}</option></Select></Field><Field label="Expense type"><Select value={draft.expenseType} onChange={(e) => setDraft({ ...draft, expenseType: e.target.value as ExpenseType })}><option value="shared">Shared</option><option value="personal">Personal</option></Select></Field><Field label="Payment source" hint={`Available: ${formatMoney(balances[draft.walletId] + (editing?.walletId === draft.walletId ? editing.amount : 0))}`}><Select value={draft.walletId} onChange={(e) => setDraft({ ...draft, walletId: e.target.value as WalletId })}>{Object.entries(walletLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select></Field></div><Field label="Description"><Textarea required value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What was this purchase for?" maxLength={160} /></Field><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Record expense'}</Button></div></form></Modal>
    <ConfirmDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={() => pendingDelete && deleteExpense(pendingDelete.id)} title="Delete expense?" message="This reverses the expense, restores the money to its original wallet, and recalculates the category budget." confirmLabel="Delete expense" />
  </div>;
}
