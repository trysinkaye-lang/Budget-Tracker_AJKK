import { ChevronDown } from 'lucide-react';
import { useBudget } from '../../store/BudgetContext';
import { availableMonths } from '../../utils/calculations';
import { currentMonth, formatMonth, recentMonths } from '../../utils/dates';
import { MobileMenuButton } from './Sidebar';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { data, selectedMonth, setSelectedMonth } = useBudget();
  const months = Array.from(new Set([...recentMonths(18), ...availableMonths(data), currentMonth()])).sort().reverse();
  return <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-canvas/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8"><div className="flex items-center gap-3"><MobileMenuButton onClick={onOpenMenu} /><div className="hidden sm:block"><p className="text-xs font-medium text-muted">Financial period</p><p className="text-sm font-semibold text-ink">{formatMonth(selectedMonth)}</p></div></div><label className="relative"><span className="sr-only">Select month</span><select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-semibold text-ink shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">{months.map((month) => <option value={month} key={month}>{formatMonth(month)}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={16} /></label></header>;
}
