import type { LucideIcon } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint }: { label: string; value: string; icon: LucideIcon; tone?: 'brand' | 'blue' | 'coral' | 'amber' | 'violet'; hint?: string }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700', blue: 'bg-blue-50 text-blue-700', coral: 'bg-coral-50 text-coral-600', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700',
  };
  return <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div><div className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon size={20} /></div></div></article>;
}
