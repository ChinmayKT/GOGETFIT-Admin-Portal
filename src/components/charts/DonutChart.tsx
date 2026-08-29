import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHART_SERIES, tooltipStyle } from "./chartTheme";

interface DonutSlice {
  label: string;
  value: number;
}

export function DonutChart({ data, height = 240 }: { data: DonutSlice[]; height?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="62%"
          outerRadius="88%"
          paddingAngle={2}
          cornerRadius={4}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => [`${value} (${((Number(value) / total) * 100).toFixed(0)}%)`, name]}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
