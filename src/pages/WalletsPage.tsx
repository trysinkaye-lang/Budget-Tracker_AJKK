import { ArrowRight, ArrowRightLeft, Landmark, Plus, ShieldCheck, Trash2, UserRound, WalletCards } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { useBudget } from '../store/BudgetContext';
import type { WalletId, WalletTransfer } from '../types/finance';
import { getWalletLabels } from '../types/finance';
import { savingsTotal, walletBalances } from '../utils/calculations';
import { formatDate } from '../utils/dates';
import { formatMoney, pesosToCentavos } from '../utils/money';

type TransferDraft = { amount: string; fromWallet: WalletId; toWallet: WalletId; date: string; description: string };
const emptyDraft = (month: string): TransferDraft => ({ amount: '', fromWallet: 'my-wallet', toWallet: 'shared-wallet', date: `${month}-01`, description: '' });

const walletMeta: Record<WalletId, { description: string; icon: typeof UserRound; accent: string }> = {
  'my-wallet': { description: 'Personal spendable money', icon: UserRound, accent: 'bg-brand-50 text-brand-700' },
  'andre-wallet': { description: 'Personal spendable money', icon: UserRound, accent: 'bg-blue-50 text-blue-700' },
  'shared-wallet': { description: 'Cash available for shared expenses', icon: Landmark, accent: 'bg-violet-50 text-violet-700' },
};

export function WalletsPage() {
  const { data, selectedMonth, addTransfer, deleteTransfer } = useBudget();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TransferDraft>(() => emptyDraft(selectedMonth));
  const [pendingDelete, setPendingDelete] = useState<WalletTransfer | null>(null);
  const balances = walletBalances(data);
  const walletLabels = getWalletLabels(data.settings);
  const totalWalletCash = Object.values(balances).reduce((sum, value) => sum + value, 0);
  const transfers = useMemo(() => data.walletTransfers.filter((item) => item.date.startsWith(selectedMonth)).sort((a, b) => b.date.localeCompare(a.date)), [data.walletTransfers, selectedMonth]);
  const launch = () => { setDraft(emptyDraft(selectedMonth)); setOpen(true); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = addTransfer({ ...draft, amount: pesosToCentavos(draft.amount), description: draft.description || 'Wallet transfer' });
    if (result.ok) setOpen(false);
  };

  return <div className="space-y-7">
    <PageHeader eyebrow="Where cash lives" title="Wallets" description="Move contributions between personal and shared wallets without creating income or expenses." actions={<Button onClick={launch}><ArrowRightLeft size={17} />Transfer money</Button>} />
    <section className="grid gap-4 lg:grid-cols-3">{(Object.keys(walletLabels) as WalletId[]).map((walletId) => { const meta = walletMeta[walletId]; const Icon = meta.icon; return <article key={walletId} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex items-start justify-between"><div className={`rounded-xl p-2.5 ${meta.accent}`}><Icon size={20} /></div><span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck size={14} />Live balance</span></div><p className="mt-6 text-sm font-medium text-muted">{walletLabels[walletId]}</p><p className="mt-1 text-3xl font-bold tracking-tight text-ink">{formatMoney(balances[walletId])}</p><p className="mt-2 text-xs text-muted">{meta.description}</p></article>; })}</section>
    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-brand-900 p-5 text-white"><p className="text-sm text-brand-100">Spendable wallet cash</p><p className="mt-2 text-2xl font-bold">{formatMoney(totalWalletCash)}</p></div><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><p className="text-sm text-muted">Protected savings</p><p className="mt-2 text-2xl font-bold text-ink">{formatMoney(savingsTotal(data))}</p></div><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><p className="text-sm text-muted">Combined available money</p><p className="mt-2 text-2xl font-bold text-ink">{formatMoney(totalWalletCash + savingsTotal(data))}</p></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-ink">Wallet transfer history</h2><p className="text-sm text-muted">Every movement remains traceable</p></div><WalletCards className="text-brand-600" size={20} /></div>{transfers.length ? <div className="table-scroll overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Movement</th><th className="px-5 py-3 font-semibold">Description</th><th className="px-5 py-3 text-right font-semibold">Amount</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{transfers.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 text-muted">{formatDate(item.date)}</td><td className="px-5 py-4"><div className="flex items-center gap-2 font-medium text-ink"><span>{walletLabels[item.fromWallet]}</span><ArrowRight size={15} className="text-slate-400" /><span>{walletLabels[item.toWallet]}</span></div></td><td className="max-w-xs truncate px-5 py-4 text-muted">{item.description}</td><td className="px-5 py-4 text-right font-bold text-blue-700">{formatMoney(item.amount)}</td><td className="px-5 py-4 text-right"><button onClick={() => setPendingDelete(item)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Reverse transfer"><Trash2 size={17} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="No transfers this month" description="Contribute to the shared wallet or move cash back to a personal wallet." action={<Button onClick={launch}><Plus size={17} />Transfer money</Button>} />}</section>
    <Modal open={open} onClose={() => setOpen(false)} title="Transfer money" description="Transfers change wallet balances but never count as income or expense."><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Amount (₱)"><Input required min="0.01" step="0.01" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0.00" autoFocus /></Field><Field label="Date"><Input type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field><Field label="From wallet" hint={`Available: ${formatMoney(balances[draft.fromWallet])}`}><Select value={draft.fromWallet} onChange={(e) => setDraft({ ...draft, fromWallet: e.target.value as WalletId })}>{Object.entries(walletLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</Select></Field><Field label="To wallet"><Select value={draft.toWallet} onChange={(e) => setDraft({ ...draft, toWallet: e.target.value as WalletId })}>{Object.entries(walletLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</Select></Field></div><Field label="Description" hint="Optional"><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="e.g. Monthly shared contribution" maxLength={160} /></Field><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Transfer money</Button></div></form></Modal>
    <ConfirmDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={() => pendingDelete && deleteTransfer(pendingDelete.id)} title="Reverse transfer?" message="The original movement will be removed. This is blocked if it would overdraw the wallet that originally received the money." confirmLabel="Reverse transfer" />
  </div>;
}
