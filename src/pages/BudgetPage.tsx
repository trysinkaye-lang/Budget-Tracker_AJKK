import { AlertTriangle, Edit3, PieChart, Plus, Scale, Trash2, WalletCards } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { defaultCategories } from '../data/categories';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { useBudget } from '../store/BudgetContext';
import type { BudgetAllocation, BudgetOwner } from '../types/finance';
import { getPartnerLabels } from '../types/finance';
import { allocationTotal, categorySummary, incomeTotal } from '../utils/calculations';
import { formatMonth } from '../utils/dates';
import { centavosToPesos, formatMoney, pesosToCentavos } from '../utils/money';

type Draft = { category: string; customCategory: string; plannedAmount: string; owner: BudgetOwner; notes: string };
const emptyDraft: Draft = { category: 'Food', customCategory: '', plannedAmount: '', owner: 'shared', notes: '' };

export function BudgetPage() {
  const { data, selectedMonth, addAllocation, updateAllocation, deleteAllocation, notify } = useBudget();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetAllocation | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<BudgetAllocation | null>(null);
  const allocations = useMemo(() => data.allocations.filter((item) => item.month === selectedMonth).sort((a, b) => b.plannedAmount - a.plannedAmount), [data.allocations, selectedMonth]);
  const summaries = categorySummary(data, selectedMonth);
  const funding = incomeTotal(data, selectedMonth);
  const allocated = allocationTotal(data, selectedMonth);
  const unallocated = funding - allocated;
  const partnerNames = getPartnerLabels(data.settings);
  const summaryByCategory = new Map(summaries.map((item) => [item.category, item]));

  const launchAdd = () => { setEditing(null); setDraft(emptyDraft); setOpen(true); };
  const launchEdit = (item: BudgetAllocation) => { const isDefault = defaultCategories.includes(item.category); setEditing(item); setDraft({ category: isDefault ? item.category : 'Custom', customCategory: isDefault ? '' : item.category, plannedAmount: centavosToPesos(item.plannedAmount), owner: item.owner, notes: item.notes }); setOpen(true); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const category = draft.category === 'Custom' ? draft.customCategory.trim() : draft.category;
    if (!category) { notify('Enter a custom category name.', 'error'); return; }
    const duplicate = allocations.some((item) => item.id !== editing?.id && item.category.toLowerCase() === category.toLowerCase());
    if (duplicate) { notify('That category already has an allocation this month. Edit the existing row instead.', 'error'); return; }
    const payload = { category, plannedAmount: pesosToCentavos(draft.plannedAmount), month: selectedMonth, owner: draft.owner, notes: draft.notes };
    const result = editing ? updateAllocation(editing.id, payload) : addAllocation(payload);
    if (result.ok) setOpen(false);
  };

  return <div className="space-y-7">
    <PageHeader eyebrow="Plan before spending" title="Budget planner" description={`Decide where ${formatMonth(selectedMonth)} income should go. Allocations guide spending but never move cash.`} actions={<Button onClick={launchAdd} disabled={unallocated <= 0}><Plus size={17} />Allocate budget</Button>} />
    <section className="grid gap-4 sm:grid-cols-3"><StatCard label="Budget funding" value={formatMoney(funding)} icon={WalletCards} /><StatCard label="Planned budget" value={formatMoney(allocated)} icon={PieChart} tone="violet" /><StatCard label="Unallocated" value={formatMoney(unallocated)} icon={Scale} tone={unallocated < 0 ? 'coral' : 'amber'} /></section>
    <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${unallocated < 0 ? 'border-red-200 bg-red-50 text-red-800' : unallocated === 0 && funding > 0 ? 'border-brand-200 bg-brand-50 text-brand-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><AlertTriangle size={19} className="mt-0.5 shrink-0" /><div><p className="font-semibold">{unallocated < 0 ? 'Plan needs attention' : unallocated === 0 && funding > 0 ? 'Every peso has a plan' : 'Money still available to allocate'}</p><p className="mt-0.5 opacity-80">{unallocated < 0 ? `Allocations exceed monthly income by ${formatMoney(Math.abs(unallocated))}.` : unallocated === 0 && funding > 0 ? 'Your planned categories exactly match this month’s income.' : `${formatMoney(unallocated)} remains unallocated.`}</p></div></div>
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">{allocations.length ? <div className="table-scroll overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Category</th><th className="px-5 py-3 font-semibold">Owner</th><th className="px-5 py-3 text-right font-semibold">Planned</th><th className="px-5 py-3 text-right font-semibold">Actual</th><th className="px-5 py-3 text-right font-semibold">Remaining</th><th className="px-5 py-3 font-semibold">Usage</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{allocations.map((item) => { const summary = summaryByCategory.get(item.category) ?? { actual: 0, remaining: item.plannedAmount, percentage: 0 }; const over = summary.remaining < 0; return <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-ink">{item.category}</p>{item.notes && <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted">{item.notes}</p>}</td><td className="px-5 py-4 text-muted">{item.owner === 'shared' ? 'Shared' : partnerNames[item.owner]}</td><td className="px-5 py-4 text-right font-medium">{formatMoney(item.plannedAmount)}</td><td className="px-5 py-4 text-right">{formatMoney(summary.actual)}</td><td className={`px-5 py-4 text-right font-semibold ${over ? 'text-red-600' : 'text-brand-700'}`}>{formatMoney(summary.remaining)}</td><td className="w-44 px-5 py-4"><div className="mb-1.5 flex justify-between text-xs"><span className={over ? 'font-semibold text-red-600' : 'text-muted'}>{summary.percentage}%</span><span className="text-muted">used</span></div><ProgressBar value={summary.percentage} tone={over ? 'danger' : summary.percentage >= 80 ? 'warning' : 'brand'} /></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => launchEdit(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink" aria-label={`Edit ${item.category}`}><Edit3 size={17} /></button><button onClick={() => setPendingDelete(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${item.category}`}><Trash2 size={17} /></button></div></td></tr>; })}</tbody></table></div> : <EmptyState title="No budget plan yet" description="Allocate monthly income across categories to give every peso a purpose." action={<Button onClick={launchAdd} disabled={funding <= 0}><Plus size={17} />Allocate budget</Button>} />}</section>
    <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit allocation' : 'Allocate budget'} description={`Available to allocate: ${formatMoney(editing ? unallocated + editing.plannedAmount : unallocated)}`}><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{defaultCategories.map((category) => <option key={category}>{category}</option>)}<option>Custom</option></Select></Field>{draft.category === 'Custom' && <Field label="Custom category"><Input required value={draft.customCategory} onChange={(e) => setDraft({ ...draft, customCategory: e.target.value })} placeholder="e.g. Pet care" maxLength={40} /></Field>}<Field label="Planned amount (₱)"><Input required min="0.01" step="0.01" inputMode="decimal" value={draft.plannedAmount} onChange={(e) => setDraft({ ...draft, plannedAmount: e.target.value })} placeholder="0.00" /></Field><Field label="Budget owner"><Select value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value as BudgetOwner })}><option value="shared">Shared budget</option><option value="me">{partnerNames.me}</option><option value="andre">{partnerNames.andre}</option></Select></Field></div><Field label="Notes" hint="Optional"><Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="What does this budget cover?" maxLength={160} /></Field><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Allocate money'}</Button></div></form></Modal>
    <ConfirmDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={() => pendingDelete && deleteAllocation(pendingDelete.id)} title="Delete allocation?" message="This removes only the plan. Existing expenses stay recorded and wallet cash is unchanged." confirmLabel="Delete allocation" />
  </div>;
}
