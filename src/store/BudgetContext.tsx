import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createBlankData, createSampleData } from '../data/seed';
import type { AppSettings, BudgetAllocation, BudgetData, Expense, Income, LedgerType, SavingsContribution, SavingsGoal, WalletTransfer } from '../types/finance';
import { currentMonth } from '../utils/dates';
import { allocationTotal, incomeTotal, validateBalances } from '../utils/calculations';
import { isValidAmount } from '../utils/money';
import { loadBudgetData, saveBudgetData } from './persistence';

export type ActionResult = { ok: boolean; message: string };
export type ToastMessage = { id: number; tone: 'success' | 'error' | 'info'; message: string };

interface BudgetContextValue {
  data: BudgetData;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  toasts: ToastMessage[];
  dismissToast: (id: number) => void;
  notify: (message: string, tone?: ToastMessage['tone']) => void;
  addIncome: (item: Omit<Income, 'id' | 'createdAt'>) => ActionResult;
  updateIncome: (id: string, item: Omit<Income, 'id' | 'createdAt'>) => ActionResult;
  deleteIncome: (id: string) => ActionResult;
  addAllocation: (item: Omit<BudgetAllocation, 'id' | 'createdAt'>) => ActionResult;
  updateAllocation: (id: string, item: Omit<BudgetAllocation, 'id' | 'createdAt'>) => ActionResult;
  deleteAllocation: (id: string) => ActionResult;
  addExpense: (item: Omit<Expense, 'id' | 'createdAt'>) => ActionResult;
  updateExpense: (id: string, item: Omit<Expense, 'id' | 'createdAt'>) => ActionResult;
  deleteExpense: (id: string) => ActionResult;
  addTransfer: (item: Omit<WalletTransfer, 'id' | 'createdAt'>) => ActionResult;
  deleteTransfer: (id: string) => ActionResult;
  addSavingsGoal: (item: Omit<SavingsGoal, 'id' | 'createdAt'>) => ActionResult;
  updateSavingsGoal: (id: string, item: Omit<SavingsGoal, 'id' | 'createdAt'>) => ActionResult;
  deleteSavingsGoal: (id: string) => ActionResult;
  addSavingsContribution: (item: Omit<SavingsContribution, 'id' | 'createdAt'>) => ActionResult;
  deleteSavingsContribution: (id: string) => ActionResult;
  reverseLedgerEntry: (type: LedgerType, sourceId: string) => ActionResult;
  updateSettings: (settings: AppSettings) => ActionResult;
  resetData: (mode: 'blank' | 'sample') => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

const makeId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BudgetData>(() => loadBudgetData(localStorage));
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastId = useRef(0);

  useEffect(() => saveBudgetData(localStorage, data), [data]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, tone: ToastMessage['tone'] = 'success') => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => dismissToast(id), 4200);
  }, [dismissToast]);

  const commit = useCallback((candidate: BudgetData, successMessage: string, checkBalances = true): ActionResult => {
    if (checkBalances) {
      const balanceError = validateBalances(candidate);
      if (balanceError) {
        notify(balanceError, 'error');
        return { ok: false, message: balanceError };
      }
    }
    setData(candidate);
    notify(successMessage);
    return { ok: true, message: successMessage };
  }, [notify]);

  const invalidAmount = (amount: number): ActionResult | null => {
    if (isValidAmount(amount)) return null;
    const message = 'Enter an amount greater than zero.';
    notify(message, 'error');
    return { ok: false, message };
  };

  const value = useMemo<BudgetContextValue>(() => ({
    data,
    selectedMonth,
    setSelectedMonth,
    toasts,
    dismissToast,
    notify,
    addIncome: (item) => {
      const error = invalidAmount(item.amount); if (error) return error;
      return commit({ ...data, incomes: [...data.incomes, { ...item, id: makeId(), createdAt: now() }] }, 'Income added.');
    },
    updateIncome: (id, item) => {
      const error = invalidAmount(item.amount); if (error) return error;
      const candidate = { ...data, incomes: data.incomes.map((current) => current.id === id ? { ...current, ...item } : current) };
      return commit(candidate, 'Income updated.');
    },
    deleteIncome: (id) => commit({ ...data, incomes: data.incomes.filter((item) => item.id !== id) }, 'Income removed.'),
    addAllocation: (item) => {
      const error = invalidAmount(item.plannedAmount); if (error) return error;
      const funding = incomeTotal(data, item.month);
      if (allocationTotal(data, item.month) + item.plannedAmount > funding) {
        const message = 'This allocation exceeds the income available for the selected month.';
        notify(message, 'error'); return { ok: false, message };
      }
      return commit({ ...data, allocations: [...data.allocations, { ...item, id: makeId(), createdAt: now() }] }, 'Budget allocated.', false);
    },
    updateAllocation: (id, item) => {
      const error = invalidAmount(item.plannedAmount); if (error) return error;
      const otherTotal = data.allocations.filter((current) => current.id !== id && current.month === item.month).reduce((sum, current) => sum + current.plannedAmount, 0);
      if (otherTotal + item.plannedAmount > incomeTotal(data, item.month)) {
        const message = 'This change would over-allocate the selected month.';
        notify(message, 'error'); return { ok: false, message };
      }
      return commit({ ...data, allocations: data.allocations.map((current) => current.id === id ? { ...current, ...item } : current) }, 'Budget updated.', false);
    },
    deleteAllocation: (id) => commit({ ...data, allocations: data.allocations.filter((item) => item.id !== id) }, 'Allocation removed.', false),
    addExpense: (item) => {
      const error = invalidAmount(item.amount); if (error) return error;
      return commit({ ...data, expenses: [...data.expenses, { ...item, id: makeId(), createdAt: now() }] }, 'Expense recorded.');
    },
    updateExpense: (id, item) => {
      const error = invalidAmount(item.amount); if (error) return error;
      return commit({ ...data, expenses: data.expenses.map((current) => current.id === id ? { ...current, ...item } : current) }, 'Expense updated.');
    },
    deleteExpense: (id) => commit({ ...data, expenses: data.expenses.filter((item) => item.id !== id) }, 'Expense removed.'),
    addTransfer: (item) => {
      const error = invalidAmount(item.amount); if (error) return error;
      if (item.fromWallet === item.toWallet) {
        const message = 'Choose two different wallets.'; notify(message, 'error'); return { ok: false, message };
      }
      return commit({ ...data, walletTransfers: [...data.walletTransfers, { ...item, id: makeId(), createdAt: now() }] }, 'Money transferred.');
    },
    deleteTransfer: (id) => commit({ ...data, walletTransfers: data.walletTransfers.filter((item) => item.id !== id) }, 'Transfer reversed.'),
    addSavingsGoal: (item) => {
      const error = invalidAmount(item.targetAmount); if (error) return error;
      return commit({ ...data, savingsGoals: [...data.savingsGoals, { ...item, id: makeId(), createdAt: now() }] }, 'Savings goal created.', false);
    },
    updateSavingsGoal: (id, item) => {
      const error = invalidAmount(item.targetAmount); if (error) return error;
      return commit({ ...data, savingsGoals: data.savingsGoals.map((current) => current.id === id ? { ...current, ...item } : current) }, 'Savings goal updated.', false);
    },
    deleteSavingsGoal: (id) => {
      if (data.savingsContributions.some((item) => item.goalId === id)) {
        const message = 'Reverse this goal’s savings contributions before deleting it.'; notify(message, 'error'); return { ok: false, message };
      }
      return commit({ ...data, savingsGoals: data.savingsGoals.filter((item) => item.id !== id) }, 'Savings goal removed.', false);
    },
    addSavingsContribution: (item) => {
      const error = invalidAmount(item.amount); if (error) return error;
      return commit({ ...data, savingsContributions: [...data.savingsContributions, { ...item, id: makeId(), createdAt: now() }] }, 'Savings transferred.');
    },
    deleteSavingsContribution: (id) => commit({ ...data, savingsContributions: data.savingsContributions.filter((item) => item.id !== id) }, 'Savings transfer reversed.'),
    reverseLedgerEntry: (type, sourceId) => {
      if (type === 'income') return commit({ ...data, incomes: data.incomes.filter((item) => item.id !== sourceId) }, 'Income reversed.');
      if (type === 'expense') return commit({ ...data, expenses: data.expenses.filter((item) => item.id !== sourceId) }, 'Expense reversed.');
      if (type === 'transfer') return commit({ ...data, walletTransfers: data.walletTransfers.filter((item) => item.id !== sourceId) }, 'Transfer reversed.');
      return commit({ ...data, savingsContributions: data.savingsContributions.filter((item) => item.id !== sourceId) }, 'Savings transfer reversed.');
    },
    updateSettings: (settings) => commit({ ...data, settings }, 'Settings saved.', false),
    resetData: (mode) => {
      setData(mode === 'sample' ? createSampleData() : createBlankData());
      setSelectedMonth(currentMonth());
      notify(mode === 'sample' ? 'Sample data restored.' : 'All financial data cleared.', 'info');
    },
  }), [commit, data, dismissToast, notify, selectedMonth, toasts]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const value = useContext(BudgetContext);
  if (!value) throw new Error('useBudget must be used inside BudgetProvider');
  return value;
}
