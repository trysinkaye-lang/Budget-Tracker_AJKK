export type Partner = 'me' | 'andre';
export type WalletId = 'my-wallet' | 'andre-wallet' | 'shared-wallet';
export type BudgetOwner = Partner | 'shared';
export type ExpenseType = 'personal' | 'shared';

export interface Income {
  id: string;
  amount: number;
  owner: Partner;
  source: string;
  date: string;
  description: string;
  createdAt: string;
}

export interface BudgetAllocation {
  id: string;
  category: string;
  plannedAmount: number;
  month: string;
  owner: BudgetOwner;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  paidBy: Partner;
  expenseType: ExpenseType;
  walletId: WalletId;
  createdAt: string;
}

export interface WalletTransfer {
  id: string;
  amount: number;
  fromWallet: WalletId;
  toWallet: WalletId;
  date: string;
  description: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  createdAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  fromWallet: WalletId;
  date: string;
  description: string;
  createdAt: string;
}

export interface AppSettings {
  myName: string;
  partnerName: string;
  currency: 'PHP';
}

export interface BudgetData {
  version: 1;
  incomes: Income[];
  allocations: BudgetAllocation[];
  expenses: Expense[];
  walletTransfers: WalletTransfer[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  settings: AppSettings;
}

export type LedgerType = 'income' | 'expense' | 'transfer' | 'savings';

export interface LedgerEntry {
  id: string;
  sourceId: string;
  date: string;
  type: LedgerType;
  amount: number;
  category: string;
  owner: string;
  wallet: string;
  description: string;
}

export function getPartnerLabels(settings: AppSettings): Record<Partner, string> {
  return { me: settings.myName, andre: settings.partnerName };
}

export function getWalletLabels(settings: AppSettings): Record<WalletId, string> {
  return {
    'my-wallet': `${settings.myName}'s Wallet`,
    'andre-wallet': `${settings.partnerName}'s Wallet`,
    'shared-wallet': 'Our Shared Wallet',
  };
}
