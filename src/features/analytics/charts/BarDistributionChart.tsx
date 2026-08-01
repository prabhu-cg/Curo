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
  /** 'columns' for short category labels, 'bars' for long ones (e.g. domains). */
  orientation: 'columns' | 'bars';
  height?: number;
}

const AXIS_STYLE = { fontSize: 12, fill: CHART_TEXT_COLOR };

export function BarDistributionChart({
  data,
  orientation,
  height = 260,
}: BarDistributionChartProps) {
  if (orientation === 'bars') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke={CHART_GRID_COLOR} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={AXIS_STYLE}
            axisLine={{ stroke: CHART_GRID_COLOR }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={AXIS_STYLE}
            axisLine={{ stroke: CHART_GRID_COLOR }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: CHART_GRID_COLOR, opacity: 0.4 }}
            content={(props) => (
              <ChartTooltip {...props} formatValue={(v) => `${v} bookmarks`} />
            )}
          />
          <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

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
