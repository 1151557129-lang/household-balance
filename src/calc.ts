import type { ExpensePeriod, Item } from './types';

export function sumAmount(items: Pick<Item, 'amount'>[]): number {
  return items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
}

export function groupByCategory(
  items: Pick<Item, 'category' | 'amount'>[],
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const v = Number(it.amount) || 0;
    map.set(it.category, (map.get(it.category) ?? 0) + v);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export const PERIOD_MONTHS: Record<ExpensePeriod, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export type TimeUnit = 'month' | 'quarter' | 'year';

export const UNIT_MONTHS: Record<TimeUnit, number> = { month: 1, quarter: 3, year: 12 };

// 把一个按 period 计费的金额，折算到目标时间单位（月/季/年）下。
export function scaleAmount(amount: number, period: ExpensePeriod, unit: TimeUnit): number {
  return (Number(amount) || 0) * (UNIT_MONTHS[unit] / PERIOD_MONTHS[period]);
}

// 折算成月均金额（现金流口径统一用月）。
export function monthlyEquivalent(item: Pick<Item, 'amount' | 'period'>): number {
  return scaleAmount(item.amount, item.period ?? 'monthly', 'month');
}
