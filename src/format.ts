export function formatMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100000000) return `${sign}¥${(abs / 100000000).toFixed(2)}亿`;
  if (abs >= 10000) return `${sign}¥${(abs / 10000).toFixed(1)}万`;
  return `${sign}¥${Math.round(abs).toLocaleString('zh-CN')}`;
}

export function formatPercent(r: number, digits = 1): string {
  return `${(r * 100).toFixed(digits)}%`;
}

export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

export function addMonthsStr(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1 + months, d || 1);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}
