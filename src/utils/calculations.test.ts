import { describe, expect, it } from 'vitest';
import { createBlankData, createSampleData } from '../data/seed';
import type { BudgetData } from '../types/finance';
import { allocationTotal, categorySummary, dashboardSummary, expenseTotal, incomeTotal, ledgerEntries, savingsTotal, validateBalances, walletBalances } from './calculations';

const month = '2026-11';

describe('financial calculations', () => {
  it('combines both ₱1,000 incomes and fully allocates ₱2,000', () => {
    const data = createSampleData(month);
    const summary = dashboardSummary(data, month);
    expect(summary.myIncome).toBe(100_000);
    expect(summary.andreIncome).toBe(100_000);
    expect(summary.combinedIncome).toBe(200_000);
    expect(allocationTotal(data, month)).toBe(200_000);
    expect(summary.unallocated).toBe(0);
  });

  it('keeps planned allocations separate from actual cash and shows underspending', () => {
    const data = createSampleData(month);
    const food = categorySummary(data, month).find((item) => item.category === 'Food');
    expect(food).toMatchObject({ planned: 50_000, actual: 35_000, remaining: 15_000, percentage: 70 });
    expect(expenseTotal(data, month)).toBe(35_000);
    expect(walletBalances(data)).toEqual({ 'my-wallet': 30_000, 'andre-wallet': 30_000, 'shared-wallet': 75_000 });
    expect(savingsTotal(data)).toBe(30_000);
    expect(dashboardSummary(data, month).combinedMoney).toBe(165_000);
  });

  it('reports overspending without changing the original plan', () => {
    const data = createSampleData(month);
    const changed: BudgetData = { ...data, expenses: data.expenses.map((expense) => ({ ...expense, amount: 60_000 })) };
    const food = categorySummary(changed, month).find((item) => item.category === 'Food');
    expect(food?.planned).toBe(50_000);
    expect(food?.actual).toBe(60_000);
    expect(food?.remaining).toBe(-10_000);
    expect(food?.percentage).toBe(120);
  });

  it('moves money between wallets without creating income or expenses', () => {
    const data = createSampleData(month);
    expect(incomeTotal(data, month)).toBe(200_000);
    expect(expenseTotal(data, month)).toBe(35_000);
    expect(data.walletTransfers.reduce((sum, item) => sum + item.amount, 0)).toBe(140_000);
    expect(dashboardSummary(data, month).combinedMoney).toBe(165_000);
  });

  it('moves wallet cash into savings without counting it as an expense', () => {
    const data = createSampleData(month);
    expect(savingsTotal(data)).toBe(30_000);
    expect(expenseTotal(data, month)).toBe(35_000);
    expect(dashboardSummary(data, month).spendableCash).toBe(135_000);
  });

  it('recalculates after editing or deleting an expense', () => {
    const data = createSampleData(month);
    const edited: BudgetData = { ...data, expenses: data.expenses.map((expense) => ({ ...expense, amount: 20_000 })) };
    expect(expenseTotal(edited, month)).toBe(20_000);
    expect(walletBalances(edited)['shared-wallet']).toBe(90_000);
    const deleted: BudgetData = { ...edited, expenses: [] };
    expect(expenseTotal(deleted, month)).toBe(0);
    expect(walletBalances(deleted)['shared-wallet']).toBe(110_000);
  });

  it('separates reporting months', () => {
    const data = createSampleData(month);
    const next: BudgetData = { ...data, incomes: [...data.incomes, { ...data.incomes[0], id: 'december-income', amount: 50_000, date: '2026-12-01' }] };
    expect(incomeTotal(next, month)).toBe(200_000);
    expect(incomeTotal(next, '2026-12')).toBe(50_000);
    expect(expenseTotal(next, '2026-12')).toBe(0);
  });

  it('detects transfers that exceed the available wallet balance', () => {
    const data = createBlankData();
    data.walletTransfers.push({ id: 'bad-transfer', amount: 1, fromWallet: 'my-wallet', toWallet: 'shared-wallet', date: '2026-11-01', description: '', createdAt: '' });
    expect(validateBalances(data)).toBe("Kristy's Wallet would be overdrawn.");
  });

  it('uses editable names throughout ledger and wallet labels', () => {
    const data = createSampleData(month);
    data.settings = { ...data.settings, myName: 'Kris', partnerName: 'Dre' };
    const entries = ledgerEntries(data);
    expect(entries.some((entry) => entry.owner === 'Kris' && entry.wallet === "Kris's Wallet")).toBe(true);
    expect(entries.some((entry) => entry.owner === 'Dre' && entry.wallet === "Dre's Wallet")).toBe(true);
  });
});
