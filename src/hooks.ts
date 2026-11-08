import { useLiveQuery } from 'dexie-react-hooks';
import type { Table } from 'dexie';
import { db } from './db';
import type { ExpensePeriod, ExpenseType, IncomeType, Item, Kind } from './types';
import { sumAmount, monthlyEquivalent } from './calc';

export function useItems(table: Table<Item, number>) {
  const items = useLiveQuery(() => table.toArray(), [table]) ?? [];

  const add = async (data: { name: string; category: string; amount: number; period?: ExpensePeriod; incomeType?: IncomeType; expenseType?: ExpenseType }) => {
    const rec: Item = { name: data.name, category: data.category, amount: data.amount, updatedAt: Date.now() };
    if (data.period) rec.period = data.period;
    if (data.incomeType) rec.incomeType = data.incomeType;
    if (data.expenseType) rec.expenseType = data.expenseType;
    await table.add(rec);
  };
  const update = async (id: number, data: { name: string; category: string; amount: number; period?: ExpensePeriod; incomeType?: IncomeType; expenseType?: ExpenseType }) => {
    const rec: Partial<Item> = { name: data.name, category: data.category, amount: data.amount, updatedAt: Date.now() };
    if (data.period) rec.period = data.period;
    if (data.incomeType) rec.incomeType = data.incomeType;
    if (data.expenseType) rec.expenseType = data.expenseType;
    await table.update(id, rec);
  };
  const remove = async (id: number) => {
    await table.delete(id);
  };

  return { items, add, update, remove };
}

export const TABLES: Record<Kind, Table<Item, number>> = {
  asset: db.assets,
  liability: db.liabilities,
  expense: db.expenses,
  oneTimeExpense: db.expenses,
  income: db.incomes,
  oneTime: db.incomes,
};

export function useBalance() {
  const assets = useLiveQuery(() => db.assets.toArray(), []) ?? [];
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), []) ?? [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) ?? [];
  const incomes = useLiveQuery(() => db.incomes.toArray(), []) ?? [];
  const snapshots = useLiveQuery(() => db.snapshots.orderBy('date').toArray(), []) ?? [];

  const totalAssets = sumAmount(assets);
  const totalLiabilities = sumAmount(liabilities);
  const netWorth = totalAssets - totalLiabilities;
  const monthlyIncome = sumAmount(incomes.filter((i) => i.incomeType !== 'one-time'));
  const monthlyExpense = expenses
    .filter((e) => e.expenseType !== 'one-time')
    .reduce((acc, e) => acc + monthlyEquivalent(e), 0);
  const monthlyBalance = monthlyIncome - monthlyExpense;
  const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
  const cashAssets = sumAmount(assets.filter((a) => a.category === '现金及活期'));
  const runwayMonths = monthlyExpense > 0 ? cashAssets / monthlyExpense : null;

  return {
    assets,
    liabilities,
    expenses,
    incomes,
    snapshots,
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance,
    debtRatio,
    cashAssets,
    runwayMonths,
  };
}
