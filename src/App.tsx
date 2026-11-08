import { useState } from 'react';
import { ThemeProvider, useTheme } from './theme';
import Overview from './views/Overview';
import Trend from './views/Trend';
import Cashflow from './views/Cashflow';
import Consumption from './views/Consumption';
import ItemSection from './components/ItemSection';

type View = 'overview' | 'assets' | 'liabilities' | 'trend' | 'cashflow' | 'expenses' | 'consumption';

const NAV: { key: View; label: string }[] = [
  { key: 'overview', label: '总览' },
  { key: 'assets', label: '资产' },
  { key: 'liabilities', label: '负债' },
  { key: 'trend', label: '净值趋势' },
  { key: 'cashflow', label: '现金流' },
  { key: 'expenses', label: '支出明细' },
  { key: 'consumption', label: '消费评估' },
];

function Shell() {
  const { mode, toggle } = useTheme();
  const [view, setView] = useState<View>('overview');

  return (
    <div className="app">
      <div className="topbar">
        <span className="brand">家庭资产负债</span>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={view === n.key ? 'active' : ''}
              onClick={() => setView(n.key)}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <button className="icon-btn" onClick={toggle} title="切换深浅色" aria-label="切换深浅色">
          {mode === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {view === 'overview' && <Overview />}
      {view === 'assets' && <ItemSection kind="asset" />}
      {view === 'liabilities' && <ItemSection kind="liability" />}
      {view === 'trend' && <Trend />}
      {view === 'cashflow' && <Cashflow />}
      {view === 'expenses' && (
        <>
          <ItemSection kind="expense" />
          <ItemSection kind="oneTimeExpense" />
        </>
      )}
      {view === 'consumption' && <Consumption />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
