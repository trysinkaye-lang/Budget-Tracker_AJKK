import { BarChart3, CalendarRange, CircleDollarSign, Goal, HandCoins, LayoutDashboard, Menu, PiggyBank, ReceiptText, Settings, WalletCards, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PageKey = 'dashboard' | 'income' | 'budget' | 'expenses' | 'wallets' | 'savings' | 'transactions' | 'reports' | 'settings';

const items: Array<{ key: PageKey; label: string; icon: LucideIcon }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'income', label: 'Income', icon: CircleDollarSign },
  { key: 'budget', label: 'Budget Planner', icon: CalendarRange },
  { key: 'expenses', label: 'Expenses', icon: ReceiptText },
  { key: 'wallets', label: 'Wallets', icon: WalletCards },
  { key: 'savings', label: 'Savings', icon: Goal },
  { key: 'transactions', label: 'Transactions', icon: HandCoins },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return <button className="rounded-xl border border-slate-200 bg-white p-2.5 text-ink shadow-sm lg:hidden" onClick={onClick} aria-label="Open navigation"><Menu size={20} /></button>;
}

export function Sidebar({ activePage, onNavigate, open, onClose }: { activePage: PageKey; onNavigate: (page: PageKey) => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={onClose} aria-label="Close navigation overlay" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between px-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm"><PiggyBank size={22} /></div><div><p className="font-bold leading-tight text-ink">Our Budget</p><p className="text-xs text-muted">Couples finance tracker</p></div></div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-slate-100 lg:hidden" aria-label="Close navigation"><X size={19} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {items.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => { onNavigate(key); onClose(); }} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${activePage === key ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'}`}><Icon size={19} /><span>{label}</span></button>)}
        </nav>
        <div className="m-4 rounded-2xl bg-brand-900 p-4 text-white"><p className="text-sm font-semibold">Plan together</p><p className="mt-1 text-xs leading-5 text-brand-100">Planned budgets guide decisions. Only actual transactions move your cash.</p></div>
      </aside>
    </>
  );
}
