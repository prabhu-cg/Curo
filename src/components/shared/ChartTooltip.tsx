interface ChartTooltipPayloadEntry {
  value?: number | string | readonly (number | string)[];
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: readonly ChartTooltipPayloadEntry[];
  label?: string | number;
  formatLabel?: (label: string) => string;
  formatValue?: (value: number) => string;
}

/** Generic-agnostic tooltip content renderer for Recharts, styled to match the app. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
  formatValue,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  if (!entry) return null;

  const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);

  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{formatLabel ? formatLabel(String(label)) : label}</p>
      <p className="text-[#555555]">{formatValue ? formatValue(value) : value}</p>
    </div>
  );
}
