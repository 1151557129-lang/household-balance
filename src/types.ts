export type ExpensePeriod = 'monthly' | 'quarterly' | 'yearly';

export type IncomeType = 'recurring' | 'one-time';

export type ExpenseType = 'recurring' | 'one-time';

export interface Item {
  id?: number;
  name: string;
  category: string;
  amount: number;
  period?: ExpensePeriod;
  incomeType?: IncomeType;
  expenseType?: ExpenseType;
  updatedAt: number;
}

export interface Snapshot {
  id?: number;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
}

export type Kind = 'asset' | 'liability' | 'expense' | 'income' | 'oneTime' | 'oneTimeExpense';

export const ASSET_CATEGORIES = [
  '现金及活期',
  '定期/储蓄',
  '投资',
  '房产',
  '车辆',
  '其他资产',
] as const;

export const LIABILITY_CATEGORIES = [
  '房贷',
  '车贷',
  '消费贷/信用贷',
  '信用卡',
  '其他负债',
] as const;

export const EXPENSE_CATEGORIES = [
  '房贷月供',
  '车贷月供',
  '房租',
  '保险',
  '物业',
  '水电燃气',
  '交通',
  '通讯订阅',
  '教育',
  '餐饮',
  '医疗',
  '其他',
] as const;

export const INCOME_CATEGORIES = [
  '工资',
  '副业/兼职',
  '投资收益',
  '其他',
] as const;

export const ONE_TIME_INCOME_CATEGORIES = [
  '年终奖金',
  '项目奖金',
  '股票提现',
  '红包礼金',
  '其他',
] as const;

export const ONE_TIME_EXPENSE_CATEGORIES = [
  '旅游',
  '消费',
  '医疗',
  '培训',
  '其他',
] as const;

export const CONSUMPTION_CATEGORIES = [
  '旅游',
  '购车',
  '家电/数码',
  '教育/培训',
  '医疗',
  '装修',
  '其他',
] as const;

export const EXPENSE_PERIODS: { value: ExpensePeriod; label: string }[] = [
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '每季度' },
  { value: 'yearly', label: '每年' },
];

export const EXPENSE_PERIOD_LABELS: Record<ExpensePeriod, string> = {
  monthly: '每月',
  quarterly: '每季度',
  yearly: '每年',
};
