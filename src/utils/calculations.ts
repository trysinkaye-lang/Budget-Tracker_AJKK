import type { BudgetData, LedgerEntry, Partner, WalletId } from '../types/finance';
import { getPartnerLabels, getWalletLabels } from '../types/finance';
import { monthFromDate } from './dates';

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function incomesForMonth(data: BudgetData, month: string) {
  return data.incomes.filter((item) => monthFromDate(item.date) === month);
}

export function expensesForMonth(data: BudgetData, month: string) {
  return data.expenses.filter((item) => monthFromDate(item.date) === month);
}

export function savingsForMonth(data: BudgetData, month: string) {
  return data.savingsContributions.filter((item) => monthFromDate(item.date) === month);
}

export function incomeTotal(data: BudgetData, month?: string, owner?: Partner): number {
  return sum(data.incomes
    .filter((item) => (!month || monthFromDate(item.date) === month) && (!owner || item.owner === owner))
    .map((item) => item.amount));
}

export function expenseTotal(data: BudgetData, month?: string): number {
  return sum(data.expenses.filter((item) => !month || monthFromDate(item.date) === month).map((item) => item.amount));
}

export function allocationTotal(data: BudgetData, month: string): number {
  return sum(data.allocations.filter((item) => item.month === month).map((item) => item.plannedAmount));
}

export function savingsTotal(data: BudgetData, month?: string): number {
  return sum(data.savingsContributions.filter((item) => !month || monthFromDate(item.date) === month).map((item) => item.amount));
}

export function savingsGoalBalance(data: BudgetData, goalId: string): number {
  return sum(data.savingsContributions.filter((item) => item.goalId === goalId).map((item) => item.amount));
}

export function walletBalances(data: BudgetData): Record<WalletId, number> {
  const balances: Record<WalletId, number> = { 'my-wallet': 0, 'andre-wallet': 0, 'shared-wallet': 0 };

  data.incomes.forEach((income) => {
    balances[income.owner === 'me' ? 'my-wallet' : 'andre-wallet'] += income.amount;
  });
  data.walletTransfers.forEach((transfer) => {
    balances[transfer.fromWallet] -= transfer.amount;
    balances[transfer.toWallet] += transfer.amount;
  });
  data.expenses.forEach((expense) => {
    balances[expense.walletId] -= expense.amount;
  });
  data.savingsContributions.forEach((contribution) => {
    balances[contribution.fromWallet] -= contribution.amount;
  });

  return balances;
}

export function categorySummary(data: BudgetData, month: string) {
  const categoryNames = new Set([
    ...data.allocations.filter((item) => item.month === month).map((item) => item.category),
    ...expensesForMonth(data, month).map((item) => item.category),
  ]);

  return Array.from(categoryNames).map((category) => {
    const planned = sum(data.allocations.filter((item) => item.month === month && item.category === category).map((item) => item.plannedAmount));
    const actual = sum(expensesForMonth(data, month).filter((item) => item.category === category).map((item) => item.amount));
    return {
      category,
      planned,
      actual,
      remaining: planned - actual,
      percentage: planned > 0 ? Math.round((actual / planned) * 100) : actual > 0 ? 100 : 0,
    };
  }).sort((a, b) => b.planned - a.planned || b.actual - a.actual);
}

export function dashboardSummary(data: BudgetData, month: string) {
  const myIncome = incomeTotal(data, month, 'me');
  const andreIncome = incomeTotal(data, month, 'andre');
  const combinedIncome = myIncome + andreIncome;
  const allocated = allocationTotal(data, month);
  const expenses = expenseTotal(data, month);
  const balances = walletBalances(data);
  const allSavings = savingsTotal(data);
  const spendableCash = sum(Object.values(balances));

  return {
    myIncome,
    andreIncome,
    combinedIncome,
    allocated,
    unallocated: combinedIncome - allocated,
    expenses,
    spendableCash,
    savings: allSavings,
    combinedMoney: spendableCash + allSavings,
    balances,
  };
}

export function validateBalances(data: BudgetData): string | null {
  const balances = walletBalances(data);
  const walletLabels = getWalletLabels(data.settings);
  const negativeWallet = (Object.entries(balances) as [WalletId, number][]).find(([, balance]) => balance < 0);
  if (negativeWallet) return `${walletLabels[negativeWallet[0]]} would be overdrawn.`;
  return null;
}

export function ledgerEntries(data: BudgetData): LedgerEntry[] {
  const goalNames = new Map(data.savingsGoals.map((goal) => [goal.id, goal.name]));
  const partnerLabels = getPartnerLabels(data.settings);
  const walletLabels = getWalletLabels(data.settings);
  return [
    ...data.incomes.map((item): LedgerEntry => ({
      id: `income-${item.id}`, sourceId: item.id, date: item.date, type: 'income', amount: item.amount,
      category: item.source, owner: partnerLabels[item.owner], wallet: walletLabels[item.owner === 'me' ? 'my-wallet' : 'andre-wallet'], description: item.description || item.source,
    })),
    ...data.expenses.map((item): LedgerEntry => ({
      id: `expense-${item.id}`, sourceId: item.id, date: item.date, type: 'expense', amount: item.amount,
      category: item.category, owner: partnerLabels[item.paidBy], wallet: walletLabels[item.walletId], description: item.description,
    })),
    ...data.walletTransfers.map((item): LedgerEntry => ({
      id: `transfer-${item.id}`, sourceId: item.id, date: item.date, type: 'transfer', amount: item.amount,
      category: 'Wallet transfer', owner: 'Shared', wallet: `${walletLabels[item.fromWallet]} → ${walletLabels[item.toWallet]}`, description: item.description,
    })),
    ...data.savingsContributions.map((item): LedgerEntry => ({
      id: `savings-${item.id}`, sourceId: item.id, date: item.date, type: 'savings', amount: item.amount,
      category: goalNames.get(item.goalId) ?? 'Savings', owner: 'Shared', wallet: `${walletLabels[item.fromWallet]} → Savings`, description: item.description,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function availableMonths(data: BudgetData): string[] {
  return Array.from(new Set([
    ...data.incomes.map((item) => monthFromDate(item.date)),
    ...data.expenses.map((item) => monthFromDate(item.date)),
    ...data.allocations.map((item) => item.month),
    ...data.walletTransfers.map((item) => monthFromDate(item.date)),
    ...data.savingsContributions.map((item) => monthFromDate(item.date)),
  ])).sort().reverse();
}
