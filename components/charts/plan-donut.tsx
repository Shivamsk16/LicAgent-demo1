"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#F5C842", "#4A90D9", "#3B6D11", "#3D3D3A"];

export function PlanDonutChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
