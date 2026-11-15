import type { BudgetData } from '../types/finance';
import { createSampleData } from '../data/seed';

export const STORAGE_KEY = 'our-budget:data:v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function loadBudgetData(storage: StorageLike): BudgetData {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return createSampleData();
    const parsed = JSON.parse(stored) as BudgetData;
    if (parsed.version !== 1 || !Array.isArray(parsed.incomes) || !Array.isArray(parsed.expenses)) {
      return createSampleData();
    }
    return {
      ...parsed,
      settings: {
        myName: !parsed.settings?.myName || parsed.settings.myName === 'Me' ? 'Kristy' : parsed.settings.myName,
        partnerName: parsed.settings?.partnerName || 'Andre',
        currency: 'PHP',
      },
    };
  } catch {
    return createSampleData();
  }
}

export function saveBudgetData(storage: StorageLike, data: BudgetData): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}
