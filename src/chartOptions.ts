import type { ECOption } from './echarts';
import type { Theme } from './theme';
import type { Snapshot } from './types';
import { formatMoney, todayStr } from './format';

function tooltip(theme: Theme) {
  return {
    valueFormatter: (v: unknown) => formatMoney(Number(v)),
    backgroundColor: theme.surface,
    borderColor: theme.baseline,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: theme.primary, fontSize: 12 },
    extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.12); border-radius: 8px;',
  };
}

export function rankedBarOption(
  data: { name: string; value: number }[],
  color: string,
  theme: Theme,
): ECOption {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return {
    animationDuration: 300,
    grid: { left: 8, right: 64, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', ...tooltip(theme) },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.muted, fontSize: 11, formatter: (v: unknown) => formatMoney(Number(v)) },
      splitLine: { lineStyle: { color: theme.gridline, width: 1 } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.name),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.secondary, fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => d.value),
        barWidth: 18,
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: theme.secondary,
          fontSize: 12,
          formatter: (p: unknown) => formatMoney(Number((p as { value: number }).value)),
        },
      },
    ],
  };
}

export interface TrendPoint {
  date: string;
  value: number;
}

export function trendOption(
  history: Snapshot[],
  forecast: TrendPoint[],
  currentNet: number,
  theme: Theme,
): ECOption {
  const H = history.length;
  const F = forecast.length;

  let dates: string[];
  let historyData: (number | null)[];
  let forecastData: (number | null)[];

  if (H > 0) {
    dates = [...history.map((s) => s.date), ...forecast.map((p) => p.date)];
    historyData = [...history.map((s) => s.netWorth), ...Array<number | null>(F).fill(null)];
    forecastData = [...Array<number | null>(H - 1).fill(null), history[H - 1].netWorth, ...forecast.map((p) => p.value)];
  } else {
    dates = [todayStr(), ...forecast.map((p) => p.date)];
    historyData = [currentNet, ...Array<number | null>(F).fill(null)];
    forecastData = [currentNet, ...forecast.map((p) => p.value)];
  }

  const historySeriesData = historyData.map((v, i) => (v === null ? null : [dates[i], v]));
  const forecastSeriesData = forecastData.map((v, i) => (v === null ? null : [dates[i], v]));

  return {
    animationDuration: 300,
    grid: { left: 8, right: 20, top: 36, bottom: 8, containLabel: true },
    legend: {
      data: ['历史净值', '预测净值'],
      top: 0,
      left: 0,
      textStyle: { color: theme.secondary, fontSize: 12 },
      itemWidth: 16,
      itemHeight: 2,
    },
    tooltip: { trigger: 'axis', ...tooltip(theme) },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: theme.baseline } },
      axisTick: { show: false },
      axisLabel: {
        color: theme.muted,
        fontSize: 11,
        formatter: (v: unknown) => {
          const d = new Date(Number(v));
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.muted, fontSize: 11, formatter: (v: unknown) => formatMoney(Number(v)) },
      splitLine: { lineStyle: { color: theme.gridline, width: 1 } },
    },
    series: [
      {
        name: '历史净值',
        type: 'line',
        data: historySeriesData as never[],
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: theme.asset },
        itemStyle: { color: theme.asset, borderColor: theme.surface, borderWidth: 2 },
        areaStyle: { color: theme.areaFill },
      },
      {
        name: '预测净值',
        type: 'line',
        data: forecastSeriesData as never[],
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, type: 'dashed', color: theme.forecast },
        itemStyle: { color: theme.forecast, borderColor: theme.surface, borderWidth: 2 },
      },
    ],
  };
}
