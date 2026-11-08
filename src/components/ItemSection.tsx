import { useState, type FormEvent } from 'react';
import type { ExpensePeriod, ExpenseType, IncomeType, Item, Kind } from '../types';
import {
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
  EXPENSE_CATEGORIES,
  ONE_TIME_EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ONE_TIME_INCOME_CATEGORIES,
  EXPENSE_PERIODS,
  EXPENSE_PERIOD_LABELS,
} from '../types';
import { TABLES, useItems } from '../hooks';
import { useTheme } from '../theme';
import { rankedBarOption } from '../chartOptions';
import { groupByCategory, sumAmount, scaleAmount, monthlyEquivalent, type TimeUnit } from '../calc';
import { formatMoney } from '../format';
import EChart from './EChart';

interface KindConfig {
  title: string;
  categories: readonly string[];
  showChart: boolean;
  showPeriod?: boolean;
  incomeType?: IncomeType;
  expenseType?: ExpenseType;
  colorKey: 'asset' | 'liability' | 'expense' | 'income';
}

const KIND_CONFIG: Record<Kind, KindConfig> = {
  asset: { title: '资产', categories: ASSET_CATEGORIES, showChart: true, colorKey: 'asset' },
  liability: { title: '负债', categories: LIABILITY_CATEGORIES, showChart: true, colorKey: 'liability' },
  expense: { title: '固定支出', categories: EXPENSE_CATEGORIES, showChart: true, showPeriod: true, colorKey: 'expense', expenseType: 'recurring' },
  oneTimeExpense: { title: '一次性支出', categories: ONE_TIME_EXPENSE_CATEGORIES, showChart: false, colorKey: 'expense', expenseType: 'one-time' },
  income: { title: '每月固定收入', categories: INCOME_CATEGORIES, showChart: false, colorKey: 'income', incomeType: 'recurring' },
  oneTime: { title: '一次性收入', categories: ONE_TIME_INCOME_CATEGORIES, showChart: false, colorKey: 'income', incomeType: 'one-time' },
};

const UNIT_OPTIONS: { value: TimeUnit; label: string }[] = [
  { value: 'month', label: '每月' },
  { value: 'quarter', label: '每季度' },
  { value: 'year', label: '每年' },
];

function matchesType(want: 'recurring' | 'one-time', have?: 'recurring' | 'one-time') {
  return want === 'one-time' ? have === 'one-time' : have !== 'one-time';
}

export default function ItemSection({ kind }: { kind: Kind }) {
  const { theme } = useTheme();
  const cfg = KIND_CONFIG[kind];
  const { items, add, update, remove } = useItems(TABLES[kind]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(cfg.categories[0]);
  const [period, setPeriod] = useState<ExpensePeriod>('monthly');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<TimeUnit>('month');
  const [editingId, setEditingId] = useState<number | null>(null);

  const color = theme[cfg.colorKey];

  const { incomeType, expenseType } = cfg;
  const visibleItems = incomeType
    ? items.filter((it) => matchesType(incomeType, it.incomeType))
    : expenseType
      ? items.filter((it) => matchesType(expenseType, it.expenseType))
      : items;

  const scaled = visibleItems.map((it) => ({
    ...it,
    amount: cfg.showPeriod ? scaleAmount(it.amount, it.period ?? 'monthly', unit) : it.amount,
  }));
  const total = sumAmount(scaled);
  const grouped = groupByCategory(scaled);

  function reset() {
    setName('');
    setPeriod('monthly');
    setAmount('');
    setEditingId(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!name.trim() || !Number.isFinite(amt) || amt < 0) return;
    const data = {
      name: name.trim(),
      category,
      amount: Math.round(amt * 100) / 100,
      period: cfg.showPeriod ? period : undefined,
      incomeType: cfg.incomeType,
      expenseType: cfg.expenseType,
    };
    if (editingId != null) await update(editingId, data);
    else await add(data);
    reset();
  }

  function startEdit(it: Item) {
    setEditingId(it.id ?? null);
    setName(it.name);
    setCategory(it.category);
    setPeriod(it.period ?? 'monthly');
    setAmount(String(it.amount));
  }

  return (
    <div className="card">
      <div className="row-between">
        <h2 style={{ margin: 0 }}>{cfg.title}</h2>
        <div className="kpi-value" style={{ fontSize: 20 }}>
          {formatMoney(total)}
        </div>
      </div>

      {cfg.showPeriod && (
        <div className="toolbar" style={{ marginTop: 8, marginBottom: 4 }}>
          <span className="muted">按时间查看</span>
          {UNIT_OPTIONS.map((u) => (
            <button
              key={u.value}
              className={unit === u.value ? 'btn small' : 'btn ghost small'}
              onClick={() => setUnit(u.value)}
            >
              {u.label}
            </button>
          ))}
        </div>
      )}

      {cfg.showChart && grouped.length > 0 && (
        <EChart option={rankedBarOption(grouped, color, theme)} />
      )}

      <form className="form-row" onSubmit={onSubmit} style={{ marginTop: 12 }}>
        <input aria-label="名称" placeholder="名称" value={name} onChange={(e) => setName(e.target.value)} />
        <select aria-label="类别" value={category} onChange={(e) => setCategory(e.target.value)}>
          {cfg.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {cfg.showPeriod && (
          <select aria-label="周期" value={period} onChange={(e) => setPeriod(e.target.value as ExpensePeriod)}>
            {EXPENSE_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        <input
          aria-label="金额"
          inputMode="decimal"
          min="0"
          placeholder="金额"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="form-actions">
          <button type="submit" className="btn small">
            {editingId != null ? '保存' : '添加'}
          </button>
          {editingId != null && (
            <button type="button" className="btn ghost small" onClick={reset}>
              取消
            </button>
          )}
        </div>
      </form>

      {visibleItems.length === 0 ? (
        <div className="empty">还没有记录，从上面添加第一项</div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>类别</th>
                {cfg.showPeriod && <th>周期</th>}
                <th className="num">金额</th>
                {cfg.showPeriod && <th className="num">月均</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((it) => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td className="muted">{it.category}</td>
                  {cfg.showPeriod && (
                    <td className="muted">{EXPENSE_PERIOD_LABELS[it.period ?? 'monthly']}</td>
                  )}
                  <td className="num">{formatMoney(it.amount)}</td>
                  {cfg.showPeriod && <td className="num">{formatMoney(monthlyEquivalent(it))}</td>}
                  <td className="actions">
                    <button className="btn ghost small" onClick={() => startEdit(it)}>
                      编辑
                    </button>
                    <button
                      className="btn danger small"
                      onClick={() => {
                        if (window.confirm(`删除「${it.name}」？`)) remove(it.id!);
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
