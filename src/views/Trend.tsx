import { useMemo } from 'react';
import { db } from '../db';
import { useBalance } from '../hooks';
import { useTheme } from '../theme';
import { trendOption, type TrendPoint } from '../chartOptions';
import { formatMoney, todayStr, addMonthsStr } from '../format';
import EChart from '../components/EChart';

export default function Trend() {
  const { theme } = useTheme();
  const b = useBalance();

  const forecast = useMemo<TrendPoint[]>(() => {
    const base = b.snapshots.length ? b.snapshots[b.snapshots.length - 1].netWorth : b.netWorth;
    const fromDate = b.snapshots.length ? b.snapshots[b.snapshots.length - 1].date : todayStr();
    const pts: TrendPoint[] = [];
    for (let i = 1; i <= 12; i++) {
      pts.push({ date: addMonthsStr(fromDate, i), value: base + b.monthlyBalance * i });
    }
    return pts;
  }, [b.snapshots, b.netWorth, b.monthlyBalance]);

  async function deleteSnapshot(id: number) {
    if (!window.confirm('删除这条快照？')) return;
    await db.snapshots.delete(id);
  }

  if (b.snapshots.length === 0 && b.netWorth === 0) {
    return (
      <div className="card">
        <h2>净值趋势</h2>
        <div className="empty">
          还没有数据。先在「现金流」页点「记录快照」，或先录入资产、负债。
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>净值趋势</h2>
      <EChart height={320} option={trendOption(b.snapshots, forecast, b.netWorth, theme)} />
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>日期</th>
              <th className="num">总资产</th>
              <th className="num">总负债</th>
              <th className="num">净资产</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[...b.snapshots].reverse().map((s) => (
              <tr key={s.id}>
                <td>{s.date}</td>
                <td className="num">{formatMoney(s.totalAssets)}</td>
                <td className="num">{formatMoney(s.totalLiabilities)}</td>
                <td className="num">{formatMoney(s.netWorth)}</td>
                <td className="actions">
                  <button
                    className="btn danger small"
                    onClick={() => s.id != null && deleteSnapshot(s.id)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
