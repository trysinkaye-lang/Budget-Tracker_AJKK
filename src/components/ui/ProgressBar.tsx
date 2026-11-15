export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'warning' | 'danger' | 'blue' }) {
  const width = Math.max(0, Math.min(value, 100));
  const colors = { brand: 'bg-brand-500', warning: 'bg-amber-500', danger: 'bg-red-500', blue: 'bg-blue-500' };
  return <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><div className={`h-full rounded-full transition-all ${colors[tone]}`} style={{ width: `${width}%` }} /></div>;
}
