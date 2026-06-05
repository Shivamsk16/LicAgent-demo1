"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SignupsChart({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888780" }} />
        <YAxis tick={{ fontSize: 11, fill: "#888780" }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#4A90D9" radius={[4, 4, 0, 0]} name="New branches" />
      </BarChart>
    </ResponsiveContainer>
  );
}
