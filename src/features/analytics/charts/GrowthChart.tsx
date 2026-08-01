import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from '@/components/shared/ChartTooltip';
import { CHART_COLOR, CHART_GRID_COLOR, CHART_TEXT_COLOR } from '@/lib/chartTheme';
import type { GrowthPoint } from '@/types';

const AXIS_STYLE = { fontSize: 12, fill: CHART_TEXT_COLOR };

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  if (!year || !monthNum) return month;
  const date = new Date(Number(year), Number(monthNum) - 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export function GrowthChart({
  data,
  height = 260,
}: {
  data: GrowthPoint[];
  height?: number;
}) {
  const formatted = data.map((point) => ({ ...point, label: formatMonth(point.month) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ left: 8, right: 16 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.1} />
            <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          content={(props) => (
            <ChartTooltip {...props} formatValue={(v) => `${v} total bookmarks`} />
          )}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={CHART_COLOR}
          strokeWidth={2}
          fill="url(#growthFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
