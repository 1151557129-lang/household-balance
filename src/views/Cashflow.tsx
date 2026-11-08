import { useState } from 'react';
import { db } from '../db';
import { useBalance } from '../hooks';
import { todayStr, formatMoney } from '../format';
import KpiCard from '../components/KpiCard';
import ItemSection from '../components/ItemSection';

export default function Cashflow() {
  const b = useBalance();
  const [saved, setSaved] = useState(false);

  async function recordSnapshot() {
    const date = todayStr();
    const rec = {
      date,
      totalAssets: b.totalAssets,
      totalLiabilities: b.totalLiabilities,
      netWorth: b.netWorth,
      monthlyIncome: b.monthlyIncome,
      monthlyExpense: b.monthlyExpense,
      monthlyBalance: b.monthlyBalance,
    };
    const existing = await db.snapshots.where('date').equals(date).first();
    if (existing?.id != null) await db.snapshots.update(existing.id, rec);
    else await db.snapshots.add(rec);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  const last = b.snapshots.length ? b.snapshots[b.snapshots.length - 1] : null;
  const runway = b.runwayMonths == null ? '—' : `${b.runwayMonths.toFixed(1)} 个月`;

  return (
    <div>
      <div className="kpi-row">
        <KpiCard label="月固定收入" value={formatMoney(b.monthlyIncome)} />
        <KpiCard label="月固定支出" value={formatMoney(b.monthlyExpense)} />
        <KpiCard
          label="月结余"
          value={formatMoney(b.monthlyBalance)}
          sub={b.monthlyBalance < 0 ? '入不敷出' : '每月可存下的钱'}
        />
        <KpiCard label="应急保障" value={runway} sub="现金类资产 ÷ 月固定支出" />
      </div>

      <div className="card">
        <div className="row-between">
          <div>
            <h2 style={{ margin: 0 }}>记录快照</h2>
            <div className="muted" style={{ marginTop: 4 }}>
              {last
                ? `最近一次：${last.date} · 净资产 ${formatMoney(last.netWorth)}`
                : '还没有快照，记录第一份吧'}
            </div>
          </div>
          <button className="btn" onClick={recordSnapshot}>
            {saved ? '已记录 ✓' : '记录当前快照'}
          </button>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          同一天重复记录会覆盖当天快照，不会产生重复数据。
        </div>
      </div>

      <ItemSection kind="income" />
      <ItemSection kind="oneTime" />
    </div>
  );
}
