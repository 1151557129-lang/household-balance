import type { Item, Snapshot } from './types';
import { sumAmount, monthlyEquivalent } from './calc';
import { formatMoney, formatPercent } from './format';

export type Level = 'good' | 'warn' | 'bad';

export interface AssessItem {
  level: Level;
  title: string;
  desc: string;
  score: number; // 0–100
  weight: number; // 该维度权重（%）
}

export interface AssessResult {
  score: number; // 0–100 综合得分
  verdict: Level;
  verdictLabel: string;
  summary: string;
  items: AssessItem[];
  advice: string[];
}

export interface BalanceData {
  assets: Item[];
  liabilities: Item[];
  expenses: Item[];
  snapshots: Snapshot[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  debtRatio: number;
}

const LIQUID = ['现金及活期', '定期/储蓄'];
const DEBT_SERVICE = ['房贷月供', '车贷月供'];
const BAD_DEBT = ['消费贷/信用贷', '信用卡'];
const NECESSITY = ['医疗', '教育/培训'];
const DURABLE = ['购车', '装修', '家电/数码'];

type Nature = 'necessity' | 'durable' | 'discretionary';

function natureOf(category: string): Nature {
  if (NECESSITY.includes(category)) return 'necessity';
  if (DURABLE.includes(category)) return 'durable';
  return 'discretionary';
}

function liquidAssets(b: BalanceData): number {
  return sumAmount(b.assets.filter((a) => LIQUID.includes(a.category)));
}

function monthlyDebtService(b: BalanceData): number {
  return b.expenses
    .filter((e) => e.expenseType !== 'one-time' && DEBT_SERVICE.includes(e.category))
    .reduce((acc, e) => acc + monthlyEquivalent(e), 0);
}

function badDebt(b: BalanceData): number {
  return sumAmount(b.liabilities.filter((l) => BAD_DEBT.includes(l.category)));
}

function trendOf(b: BalanceData): { dir: 'up' | 'down' | 'flat' | 'none'; pct: number } {
  if (b.snapshots.length < 2) return { dir: 'none', pct: 0 };
  const first = b.snapshots[0].netWorth;
  const last = b.snapshots[b.snapshots.length - 1].netWorth;
  if (first === last) return { dir: 'flat', pct: 0 };
  const pct = (last - first) / Math.abs(first);
  return { dir: pct > 0 ? 'up' : 'down', pct };
}

function assessCashflow(amount: number, b: BalanceData): AssessItem {
  const w = 20;
  if (b.monthlyIncome <= 0 && b.monthlyExpense <= 0) {
    return { level: 'warn', title: '现金流', score: 50, weight: w, desc: '尚未录入固定收入与固定支出，无法评估储蓄能力。' };
  }
  if (b.monthlyBalance < 0) {
    return {
      level: 'bad',
      title: '现金流 · 入不敷出',
      score: 0,
      weight: w,
      desc: `月固定收入 ${formatMoney(b.monthlyIncome)} 低于固定支出 ${formatMoney(b.monthlyExpense)}，月结余 ${formatMoney(b.monthlyBalance)}。`,
    };
  }
  if (b.monthlyBalance === 0) {
    return { level: 'warn', title: '现金流 · 收支相抵', score: 30, weight: w, desc: '月结余为 0，几乎没有新增储蓄。' };
  }
  const months = amount / b.monthlyBalance;
  const sr = b.monthlyIncome > 0 ? formatPercent(b.monthlyBalance / b.monthlyIncome) : '—';
  const desc = `月结余 ${formatMoney(b.monthlyBalance)}（储蓄率 ${sr}），约 ${Math.round(months)} 个月攒出。`;
  if (months <= 3) return { level: 'good', title: '现金流 · 覆盖快', score: 100, weight: w, desc };
  if (months <= 6) return { level: 'warn', title: '现金流 · 数月可覆盖', score: 60, weight: w, desc };
  if (months <= 12) return { level: 'warn', title: '现金流 · 约一年积累', score: 42, weight: w, desc };
  if (months <= 24) return { level: 'warn', title: '现金流 · 积累周期较长', score: 28, weight: w, desc };
  if (months <= 36) return { level: 'bad', title: '现金流 · 积累周期很长', score: 16, weight: w, desc };
  return { level: 'bad', title: '现金流 · 积累周期过长', score: 6, weight: w, desc };
}

function assessLiquidity(amount: number, b: BalanceData): AssessItem {
  const w = 25;
  if (b.monthlyExpense <= 0) {
    return { level: 'warn', title: '流动性与应急', score: 50, weight: w, desc: '尚未录入固定支出，无法计算应急月数。' };
  }
  const liq = liquidAssets(b);
  if (liq <= 0) {
    return { level: 'bad', title: '流动性与应急 · 无流动资产', score: 0, weight: w, desc: '现金及活期、定期/储蓄等流动资产均为零。' };
  }
  const after = liq - amount;
  const m3 = 3 * b.monthlyExpense;
  const m6 = 6 * b.monthlyExpense;
  const m12 = 12 * b.monthlyExpense;
  const base = `流动资产 ${formatMoney(liq)}，支付后剩 ${formatMoney(after)}（月固定支出 ${formatMoney(b.monthlyExpense)}）`;
  if (after < 0) return { level: 'bad', title: '流动性与应急 · 现金不足支付', score: 0, weight: w, desc: `${base}，不足以支付。` };
  if (after < m3) return { level: 'bad', title: '流动性与应急 · 应急金不足 3 个月', score: 30, weight: w, desc: `${base}，低于 3 个月应急线 ${formatMoney(m3)}。` };
  if (after < m6) return { level: 'warn', title: '流动性与应急 · 应急金 3–6 个月', score: 62, weight: w, desc: `${base}。` };
  if (after < m12) return { level: 'good', title: '流动性与应急 · 应急金 6–12 个月', score: 85, weight: w, desc: `${base}。` };
  return { level: 'good', title: '流动性与应急 · 储备充足', score: 100, weight: w, desc: `${base}，可覆盖 12 个月以上。` };
}

function assessLeverage(b: BalanceData): AssessItem {
  const w = 20;
  if (b.totalAssets <= 0) {
    return { level: 'warn', title: '杠杆与债务', score: 50, weight: w, desc: '尚未录入资产，无法计算负债率与月供占比。' };
  }
  let score = 100;
  const problems: string[] = [];
  if (b.debtRatio > 0.7) {
    score -= 40;
    problems.push(`资产负债率 ${formatPercent(b.debtRatio)} 过高`);
  } else if (b.debtRatio > 0.5) {
    score -= 20;
    problems.push(`资产负债率 ${formatPercent(b.debtRatio)} 偏高`);
  }
  if (b.monthlyIncome > 0) {
    const dsr = monthlyDebtService(b) / b.monthlyIncome;
    if (dsr > 0.5) {
      score -= 30;
      problems.push(`月供占收入 ${formatPercent(dsr)} 过重`);
    } else if (dsr > 0.3) {
      score -= 15;
      problems.push(`月供占收入 ${formatPercent(dsr)} 偏高`);
    }
  }
  const bd = badDebt(b);
  if (bd > 0) {
    score -= 20;
    problems.push(`有 ${formatMoney(bd)} 消费贷/信用卡待还`);
  }
  score = Math.max(0, score);
  const level: Level = score >= 70 ? 'good' : score >= 45 ? 'warn' : 'bad';
  const label = score >= 70 ? '健康' : score >= 45 ? '偏高' : '较重';
  return {
    level,
    title: `杠杆与债务 · ${label}`,
    score,
    weight: w,
    desc: problems.length ? problems.join('；') + '。' : `资产负债率 ${formatPercent(b.debtRatio)}，无高息消费债。`,
  };
}

function assessProportion(amount: number, b: BalanceData): AssessItem {
  const w = 15;
  if (b.totalAssets <= 0 && b.totalLiabilities <= 0) {
    return { level: 'warn', title: '财富占比', score: 50, weight: w, desc: '尚未录入资产与负债。' };
  }
  if (b.netWorth < 0) {
    return { level: 'bad', title: '财富占比 · 净资产为负', score: 0, weight: w, desc: '负债高于资产，不宜大额消费。' };
  }
  if (b.netWorth === 0) {
    return { level: 'warn', title: '财富占比 · 净资产接近零', score: 30, weight: w, desc: '资产与负债大致相抵。' };
  }
  const ratio = amount / b.netWorth;
  const d = `约占净资产 ${formatPercent(ratio)}。`;
  if (ratio <= 0.05) return { level: 'good', title: '财富占比 · 很小', score: 100, weight: w, desc: d };
  if (ratio <= 0.1) return { level: 'good', title: '财富占比 · 较小', score: 85, weight: w, desc: d };
  if (ratio <= 0.2) return { level: 'warn', title: '财富占比 · 中等', score: 65, weight: w, desc: d };
  if (ratio <= 0.3) return { level: 'warn', title: '财富占比 · 偏高', score: 45, weight: w, desc: d };
  if (ratio <= 0.5) return { level: 'bad', title: '财富占比 · 过高', score: 25, weight: w, desc: d };
  return { level: 'bad', title: '财富占比 · 极高', score: 10, weight: w, desc: d };
}

function assessTrend(b: BalanceData): AssessItem {
  const w = 10;
  const t = trendOf(b);
  if (t.dir === 'none') return { level: 'warn', title: '净资产趋势', score: 50, weight: w, desc: '快照不足 2 个，无法判断；建议在「现金流」定期记录快照。' };
  if (t.dir === 'up') return { level: 'good', title: '净资产趋势 · 上升', score: 90, weight: w, desc: `自首次记录以来净资产增长 ${formatPercent(t.pct)}，财富在积累。` };
  if (t.dir === 'flat') return { level: 'warn', title: '净资产趋势 · 持平', score: 70, weight: w, desc: '净资产没有明显增长。' };
  return { level: 'bad', title: '净资产趋势 · 下降', score: 30, weight: w, desc: `自首次记录以来净资产下降 ${formatPercent(Math.abs(t.pct))}，建议优先稳定财务。` };
}

function assessNature(category: string): AssessItem {
  const w = 10;
  const n = natureOf(category);
  if (n === 'necessity') return { level: 'good', title: '消费性质 · 必要支出', score: 100, weight: w, desc: '医疗/教育类刚需，建议优先保障。' };
  if (n === 'durable') return { level: 'warn', title: '消费性质 · 耐用/资产型', score: 70, weight: w, desc: '购车/装修等会沉淀为资产或长期使用价值，但也会折旧。' };
  return { level: 'warn', title: '消费性质 · 纯消费', score: 40, weight: w, desc: '旅游/其他属纯支出，资金一次性消耗。' };
}

function buildAdvice(amount: number, nature: Nature, b: BalanceData): string[] {
  const advice: string[] = [];
  const bd = badDebt(b);
  if (bd > 0) advice.push(`优先还清消费贷/信用卡（${formatMoney(bd)}），再考虑这笔消费。`);
  if (b.monthlyBalance < 0) advice.push('当前月结余为负，建议先调整收支、恢复正向储蓄。');
  else if (b.monthlyBalance > 0) {
    const months = amount / b.monthlyBalance;
    if (months > 12) advice.push(`可考虑分期，或先用约 ${Math.round(months)} 个月结余逐步攒出这笔钱。`);
  }
  if (b.monthlyExpense > 0) {
    const liq = liquidAssets(b);
    const m3 = 3 * b.monthlyExpense;
    if (liq >= amount && liq - amount < m3) advice.push(`建议保留至少 3 个月固定支出（${formatMoney(m3)}）作为应急金。`);
  }
  if (b.debtRatio > 0.5) advice.push('资产负债率偏高，建议先降低负债再考虑大额消费。');
  if (nature === 'discretionary') advice.push('纯消费类建议先设一个储蓄目标，攒够再买，避免冲动消费。');
  if (advice.length === 0) advice.push('当前财务状况健康，按计划执行即可；建议定期记录快照跟踪净值。');
  return advice.slice(0, 4);
}

export function assessConsumption(amount: number, category: string, b: BalanceData): AssessResult {
  const items: AssessItem[] = [
    assessCashflow(amount, b),
    assessLiquidity(amount, b),
    assessLeverage(b),
    assessProportion(amount, b),
    assessTrend(b),
    assessNature(category),
  ];
  const score = Math.round(items.reduce((acc, it) => acc + it.score * it.weight, 0) / 100);
  const nature = natureOf(category);
  const noData = b.totalAssets <= 0 && b.totalLiabilities <= 0 && b.monthlyIncome <= 0 && b.monthlyExpense <= 0;

  let verdict: Level;
  let verdictLabel: string;
  let summary: string;

  if (noData) {
    verdict = 'warn';
    verdictLabel = '数据不足';
    summary = '目前财务数据不足，评估结果仅供参考，建议先完善资产负债与现金流数据。';
  } else if (nature === 'necessity') {
    if (score >= 40) {
      verdict = 'good';
      verdictLabel = '建议保障';
      summary = '属于必要支出，建议优先保障；同时留意下方流动性提示，规划好支付节奏。';
    } else {
      verdict = 'warn';
      verdictLabel = '谨慎规划';
      summary = '虽是必要支出，但当前财务状况偏紧，建议先解决标红问题或选择更稳妥的支付方式。';
    }
  } else if (score >= 70) {
    verdict = 'good';
    verdictLabel = '可以购买';
    summary = `综合得分 ${score}，当前财务状况足以支撑这笔消费。`;
  } else if (score >= 40) {
    verdict = 'warn';
    verdictLabel = '谨慎考虑';
    summary = `综合得分 ${score}，这笔消费可行但有短板，建议结合下方行动建议改善后再决定。`;
  } else {
    verdict = 'bad';
    verdictLabel = '不建议';
    summary = `综合得分 ${score}，当前财务状况不建议进行这笔消费。`;
  }

  const advice = buildAdvice(amount, nature, b);
  return { score, verdict, verdictLabel, summary, items, advice };
}
