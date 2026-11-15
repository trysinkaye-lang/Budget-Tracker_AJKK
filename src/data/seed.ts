import type { BudgetAllocation, BudgetData } from '../types/finance';
import { currentMonth } from '../utils/dates';

const isoNow = () => new Date().toISOString();
const dateInMonth = (month: string, day: number) => `${month}-${String(day).padStart(2, '0')}`;

export function createBlankData(): BudgetData {
  return {
    version: 1,
    incomes: [],
    allocations: [],
    expenses: [],
    walletTransfers: [],
    savingsGoals: [],
    savingsContributions: [],
    settings: { myName: 'Kristy', partnerName: 'Andre', currency: 'PHP' },
  };
}

export function createSampleData(month = currentMonth()): BudgetData {
  const createdAt = isoNow();
  const allocationRows: Array<[string, number, BudgetAllocation['owner']]> = [
    ['Food', 50000, 'shared'],
    ['Groceries', 40000, 'shared'],
    ['Transportation', 30000, 'shared'],
    ['Bills', 30000, 'shared'],
    ['Savings', 30000, 'shared'],
    ['Personal Allowance', 20000, 'shared'],
  ];

  return {
    version: 1,
    settings: { myName: 'Kristy', partnerName: 'Andre', currency: 'PHP' },
    incomes: [
      { id: 'income-me-sample', amount: 100000, owner: 'me', source: 'Salary', date: dateInMonth(month, 1), description: 'Monthly income', createdAt },
      { id: 'income-andre-sample', amount: 100000, owner: 'andre', source: 'Salary', date: dateInMonth(month, 1), description: 'Monthly income', createdAt },
    ],
    allocations: allocationRows.map(([category, plannedAmount, owner], index) => ({
      id: `allocation-sample-${index}`,
      category,
      plannedAmount,
      month,
      owner,
      notes: index === 0 ? 'Flexible meal budget' : '',
      createdAt,
    })),
    walletTransfers: [
      { id: 'transfer-me-sample', amount: 70000, fromWallet: 'my-wallet', toWallet: 'shared-wallet', date: dateInMonth(month, 2), description: "Kristy's household contribution", createdAt },
      { id: 'transfer-andre-sample', amount: 70000, fromWallet: 'andre-wallet', toWallet: 'shared-wallet', date: dateInMonth(month, 2), description: "Andre's household contribution", createdAt },
    ],
    expenses: [
      { id: 'expense-food-sample', amount: 35000, category: 'Food', date: dateInMonth(month, 5), description: 'Weekly meals', paidBy: 'andre', expenseType: 'shared', walletId: 'shared-wallet', createdAt },
    ],
    savingsGoals: [
      { id: 'goal-emergency-sample', name: 'Emergency Fund', targetAmount: 1000000, targetDate: `${Number(month.slice(0, 4)) + 1}-12-31`, createdAt },
    ],
    savingsContributions: [
      { id: 'saving-emergency-sample', goalId: 'goal-emergency-sample', amount: 30000, fromWallet: 'shared-wallet', date: dateInMonth(month, 6), description: 'Monthly emergency fund', createdAt },
    ],
  };
}
