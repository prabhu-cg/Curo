import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from '@/components/shared/ChartTooltip';
import { CHART_COLOR, CHART_GRID_COLOR, CHART_TEXT_COLOR } from '@/lib/chartTheme';

interface BarDistributionChartProps {
  data: { label: string; count: number }[];
  height?: number;
}

const AXIS_STYLE = { fontSize: 12, fill: CHART_TEXT_COLOR };

/** Vertical column chart for short, fixed category labels (e.g. age buckets). For
 *  labels that can be long or unbounded, use RankList instead — Recharts' category
 *  axis doesn't truncate or wrap, so long labels overlap or get cut off. */
export function BarDistributionChart({ data, height = 260 }: BarDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 8, right: 16 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
        <XAxis
          dataKey="label"
          tick={AXIS_STYLE}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={AXIS_STYLE}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: CHART_GRID_COLOR, opacity: 0.4 }}
          content={<ChartTooltip formatValue={(v) => `${v} bookmarks`} />}
        />
        <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
