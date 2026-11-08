import Dexie, { type Table } from 'dexie';
import type { Item, Snapshot } from './types';

class BalanceDB extends Dexie {
  assets!: Table<Item, number>;
  liabilities!: Table<Item, number>;
  expenses!: Table<Item, number>;
  incomes!: Table<Item, number>;
  snapshots!: Table<Snapshot, number>;

  constructor() {
    super('household-balance');
    this.version(1).stores({
      assets: '++id, category, updatedAt',
      liabilities: '++id, category, updatedAt',
      expenses: '++id, category, updatedAt',
      incomes: '++id, category, updatedAt',
      snapshots: '++id, date',
    });
  }
}

export const db = new BalanceDB();
