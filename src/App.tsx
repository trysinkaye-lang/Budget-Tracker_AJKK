import { lazy, Suspense, useState } from 'react';
import { Sidebar, type PageKey } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastViewport } from './components/ui/Toast';
import { BudgetProvider } from './store/BudgetContext';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const IncomePage = lazy(() => import('./pages/IncomePage').then((module) => ({ default: module.IncomePage })));
const BudgetPage = lazy(() => import('./pages/BudgetPage').then((module) => ({ default: module.BudgetPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((module) => ({ default: module.ExpensesPage })));
const WalletsPage = lazy(() => import('./pages/WalletsPage').then((module) => ({ default: module.WalletsPage })));
const SavingsPage = lazy(() => import('./pages/SavingsPage').then((module) => ({ default: module.SavingsPage })));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then((module) => ({ default: module.TransactionsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

function PageLoading() {
  return <div className="space-y-5" role="status" aria-label="Loading page"><div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" /><div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-200" /><div className="grid gap-4 pt-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-white shadow-card" />)}</div></div>;
}

function BudgetApp() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const pages = {
    dashboard: <Dashboard navigate={setActivePage} />,
    income: <IncomePage />,
    budget: <BudgetPage />,
    expenses: <ExpensesPage />,
    wallets: <WalletsPage />,
    savings: <SavingsPage />,
    transactions: <TransactionsPage navigate={setActivePage} />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };
  return <div className="min-h-screen bg-canvas text-ink"><Sidebar activePage={activePage} onNavigate={setActivePage} open={menuOpen} onClose={() => setMenuOpen(false)} /><div className="lg:pl-[270px]"><Topbar onOpenMenu={() => setMenuOpen(true)} /><main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><Suspense fallback={<PageLoading />}>{pages[activePage]}</Suspense></main></div><ToastViewport /></div>;
}

export default function App() {
  return <BudgetProvider><BudgetApp /></BudgetProvider>;
}
