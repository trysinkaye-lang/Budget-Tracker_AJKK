import { Database, Info, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Field, Input } from '../components/ui/FormControls';
import { PageHeader } from '../components/ui/PageHeader';
import { useBudget } from '../store/BudgetContext';

export function SettingsPage() {
  const { data, updateSettings, resetData } = useBudget();
  const [myName, setMyName] = useState(data.settings.myName);
  const [partnerName, setPartnerName] = useState(data.settings.partnerName);
  const [resetMode, setResetMode] = useState<'blank' | 'sample' | null>(null);
  useEffect(() => {
    setMyName(data.settings.myName);
    setPartnerName(data.settings.partnerName);
  }, [data.settings.myName, data.settings.partnerName]);
  const submit = (event: FormEvent) => { event.preventDefault(); updateSettings({ myName: myName.trim() || 'Kristy', partnerName: partnerName.trim() || 'Andre', currency: 'PHP' }); };

  return <div className="space-y-7">
    <PageHeader eyebrow="Preferences and data" title="Settings" description="Manage display names and safely reset the browser-local finance data." />
    <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]"><article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-brand-50 p-2.5 text-brand-700"><Save size={20} /></div><div><h2 className="font-bold text-ink">Household profile</h2><p className="text-sm text-muted">Names used throughout the finance tracker</p></div></div><form onSubmit={submit} className="space-y-4"><Field label="Your display name"><Input required value={myName} onChange={(e) => setMyName(e.target.value)} maxLength={40} /></Field><Field label="Partner display name"><Input required value={partnerName} onChange={(e) => setPartnerName(e.target.value)} maxLength={40} /></Field><Field label="Currency"><Input value="Philippine Peso (PHP / ₱)" disabled /></Field><Button type="submit"><Save size={17} />Save settings</Button></form></article><article className="rounded-2xl bg-brand-900 p-6 text-white shadow-card"><ShieldCheck size={25} /><h2 className="mt-5 text-lg font-bold">Private and offline</h2><p className="mt-2 text-sm leading-6 text-brand-100">The installed app works without internet and keeps financial data in this device’s browser storage. There is no account, server, bank connection, or external sync.</p><div className="mt-5 flex items-start gap-2 rounded-xl bg-white/10 p-3 text-xs leading-5 text-brand-100"><Info className="mt-0.5 shrink-0" size={15} /><p>Clearing browser app data or using another device will not preserve these records. Export monthly CSV reports for portable copies.</p></div></article></section>
    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-card sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Database size={19} className="text-red-600" /><h2 className="font-bold text-ink">Reset local data</h2></div><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">Start with a blank workspace or restore the ₱1,000 + ₱1,000 example. Both actions replace all current records in this browser.</p></div><div className="flex shrink-0 flex-wrap gap-2"><Button variant="secondary" onClick={() => setResetMode('sample')}><RotateCcw size={17} />Restore sample</Button><Button variant="danger" onClick={() => setResetMode('blank')}><Trash2 size={17} />Clear all data</Button></div></div></section>
    <ConfirmDialog open={!!resetMode} onClose={() => setResetMode(null)} onConfirm={() => resetMode && resetData(resetMode)} title={resetMode === 'blank' ? 'Clear all financial data?' : 'Restore sample data?'} message="This replaces all current income, allocations, expenses, transfers, savings goals, and history stored in this browser. This action cannot be undone." confirmLabel={resetMode === 'blank' ? 'Clear everything' : 'Restore sample'} danger={resetMode === 'blank'} />
  </div>;
}
