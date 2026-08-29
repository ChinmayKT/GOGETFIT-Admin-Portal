import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_SERIES, CHART_GRID, CHART_AXIS_TEXT, tooltipStyle, tooltipLabelStyle } from "./chartTheme";
import { formatCompactNumber } from "../../utils/format";

interface Series {
  key: string;
  label: string;
}

interface LineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: Series[];
  height?: number;
  /** Use "tight" for small-variance metrics (e.g. weight) where a zero baseline would flatten the trend. */
  yDomain?: "zero" | "tight";
}

export function LineChart({ data, xKey, series, height = 280, yDomain = "zero" }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey={xKey} stroke={CHART_AXIS_TEXT} tick={{ fontSize: 11, fill: CHART_AXIS_TEXT }} axisLine={false} tickLine={false} />
        <YAxis
          domain={yDomain === "tight" ? [(min: number) => Math.floor(min - (min * 0.04)), (max: number) => Math.ceil(max + (max * 0.04))] : [0, "auto"]}
          stroke={CHART_AXIS_TEXT}
          tick={{ fontSize: 11, fill: CHART_AXIS_TEXT }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v: number) => formatCompactNumber(v)}
        />
        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} cursor={{ stroke: CHART_GRID }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: CHART_AXIS_TEXT }} iconType="circle" iconSize={8} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={CHART_SERIES[i % CHART_SERIES.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </RLineChart>
    </ResponsiveContainer>
  );
}
