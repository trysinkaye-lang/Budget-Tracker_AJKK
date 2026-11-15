import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><div className="mb-4 rounded-2xl bg-slate-100 p-3 text-slate-500"><Inbox size={24} /></div><h3 className="font-semibold text-ink">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
