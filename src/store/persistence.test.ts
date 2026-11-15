import { describe, expect, it } from 'vitest';
import { createBlankData } from '../data/seed';
import { loadBudgetData, saveBudgetData, STORAGE_KEY } from './persistence';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    value: (key: string) => values.get(key),
  };
}

describe('local persistence', () => {
  it('reloads the saved data without losing records', () => {
    const storage = memoryStorage();
    const data = createBlankData();
    data.incomes.push({ id: 'persisted', amount: 123_45, owner: 'me', source: 'Bonus', date: '2026-11-15', description: 'Saved entry', createdAt: '' });
    saveBudgetData(storage, data);
    expect(storage.value(STORAGE_KEY)).toContain('persisted');
    expect(loadBudgetData(storage).incomes[0]).toMatchObject({ id: 'persisted', amount: 123_45 });
  });

  it('recovers with sample data when storage is corrupt', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');
    const data = loadBudgetData(storage);
    expect(data.incomes).toHaveLength(2);
    expect(data.version).toBe(1);
  });

  it('migrates the original Me label to Kristy', () => {
    const storage = memoryStorage();
    const data = createBlankData();
    data.settings.myName = 'Me';
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(loadBudgetData(storage).settings.myName).toBe('Kristy');
  });
});
