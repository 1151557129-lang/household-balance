import { useState } from 'react';
import { useBalance } from '../hooks';
import { formatMoney } from '../format';
import { assessConsumption } from '../assess';
import { CONSUMPTION_CATEGORIES } from '../types';

export default function Consumption() {
  const b = useBalance();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(CONSUMPTION_CATEGORIES[0]);

  const amt = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(amt) && amt > 0;
  const result = valid ? assessConsumption(amt, category, b) : null;

  return (
    <div>
      <div className="card">
        <h2>消费评估</h2>
        <div className="muted" style={{ marginBottom: 12 }}>
          输入拟消费的金额和类别，从现金流、流动性、杠杆、财富占比、净值趋势、消费性质六个维度综合打分。
        </div>
        <div className="form-row">
          <input
            aria-label="金额"
            inputMode="decimal"
            min="0"
            placeholder="金额"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select aria-label="类别" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CONSUMPTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <div className="card">
          <div className="row-between">
            <div>
              <div className="kpi-label">
                拟消费 {formatMoney(amt)} · {category}
              </div>
              <div className="assess-score-big">
                {result.score}
                <span className="assess-score-unit">分</span>
              </div>
            </div>
            <span className={`badge ${result.verdict}`}>{result.verdictLabel}</span>
          </div>

          <div className="muted" style={{ marginTop: 8 }}>
            {result.summary}
          </div>

          <h3 style={{ marginTop: 16 }}>评分明细</h3>
          <div>
            {result.items.map((it, i) => (
              <div className="assess-item" key={i}>
                <span className={`assess-icon ${it.level}`}>
                  {it.level === 'good' ? '✓' : it.level === 'warn' ? '⚠' : '✕'}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="assess-title">{it.title}</div>
                  <div className="assess-desc">{it.desc}</div>
                </div>
                <div className="assess-score">
                  <div className="assess-score-num">{it.score}</div>
                  <div className="assess-score-w">权重 {it.weight}%</div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 16 }}>行动建议</h3>
          <div>
            {result.advice.map((a, i) => (
              <div className="advice-item" key={i}>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
