import { db } from '../db';
import { useBalance } from '../hooks';
import { formatMoney, formatPercent } from '../format';
import KpiCard from '../components/KpiCard';

export default function Overview() {
  const b = useBalance();

  const runway = b.runwayMonths == null ? '—' : `${b.runwayMonths.toFixed(1)} 个月`;

  async function exportData() {
    const data = {
      assets: await db.assets.toArray(),
      liabilities: await db.liabilities.toArray(),
      expenses: await db.expenses.toArray(),
      incomes: await db.incomes.toArray(),
      snapshots: await db.snapshots.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家庭资产负债-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    if (!window.confirm('导入会覆盖当前所有数据，确定继续？')) return;
    const data = JSON.parse(await file.text());
    await db.transaction('rw', db.assets, db.liabilities, db.expenses, db.incomes, db.snapshots, async () => {
      await db.assets.clear();
      await db.liabilities.clear();
      await db.expenses.clear();
      await db.incomes.clear();
      await db.snapshots.clear();
      await db.assets.bulkAdd(data.assets ?? []);
      await db.liabilities.bulkAdd(data.liabilities ?? []);
      await db.expenses.bulkAdd(data.expenses ?? []);
      await db.incomes.bulkAdd(data.incomes ?? []);
      await db.snapshots.bulkAdd(data.snapshots ?? []);
    });
    window.alert('导入完成');
  }

  return (
    <div>
      <div className="card">
        <div className="hero-label">净资产</div>
        <div className="hero">{formatMoney(b.netWorth)}</div>
        <div className="muted" style={{ marginTop: 6 }}>
          总资产 {formatMoney(b.totalAssets)} · 总负债 {formatMoney(b.totalLiabilities)}
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard
          label="资产负债率"
          value={formatPercent(b.debtRatio)}
          sub={b.debtRatio <= 0.5 ? '健康（≤50%）' : b.debtRatio <= 0.7 ? '偏高' : '过高，注意风险'}
        />
        <KpiCard label="应急保障" value={runway} sub="现金类资产 ÷ 月固定支出" />
        <KpiCard
          label="月结余"
          value={formatMoney(b.monthlyBalance)}
          sub={`固定收入 ${formatMoney(b.monthlyIncome)} − 支出 ${formatMoney(b.monthlyExpense)}`}
        />
        <KpiCard label="历史快照" value={String(b.snapshots.length)} sub="已记录的净值节点" />
      </div>

      <div className="card">
        <h2>数据备份</h2>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <button className="btn ghost" onClick={exportData}>
            导出 JSON
          </button>
          <label className="btn ghost import-label">
            导入 JSON
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          数据只保存在本机浏览器，不会上传。请定期导出备份；换设备或清缓存前务必先导出。
        </div>
      </div>
    </div>
  );
}
