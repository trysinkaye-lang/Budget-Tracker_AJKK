import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useBudget } from '../../store/BudgetContext';

export function ToastViewport() {
  const { toasts, dismissToast } = useBudget();
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const colors = { success: 'text-emerald-600', error: 'text-red-600', info: 'text-blue-600' };
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone];
        return <div key={toast.id} className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-float" role="status"><Icon size={20} className={colors[toast.tone]} /><p className="flex-1 text-sm font-medium text-ink">{toast.message}</p><button onClick={() => dismissToast(toast.id)} className="text-slate-400 hover:text-ink" aria-label="Dismiss notification"><X size={16} /></button></div>;
      })}
    </div>
  );
}
