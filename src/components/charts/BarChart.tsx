import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_SERIES, CHART_GRID, CHART_AXIS_TEXT, tooltipStyle, tooltipLabelStyle } from "./chartTheme";

interface Series {
  key: string;
  label: string;
}

interface BarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  height?: number;
}

export function BarChart({ data, xKey, series, height = 280 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }} barGap={4}>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey={xKey} stroke={CHART_AXIS_TEXT} tick={{ fontSize: 11, fill: CHART_AXIS_TEXT }} axisLine={false} tickLine={false} />
        <YAxis stroke={CHART_AXIS_TEXT} tick={{ fontSize: 11, fill: CHART_AXIS_TEXT }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: CHART_AXIS_TEXT }} iconType="circle" iconSize={8} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={CHART_SERIES[i % CHART_SERIES.length]} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </RBarChart>
    </ResponsiveContainer>
  );
}
