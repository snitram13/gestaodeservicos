"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"

import { formatEuro } from "@/lib/formatters/currency"

export function FaturacaoChart({
  data,
}: {
  data: { mes: string; total: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <XAxis
          dataKey="mes"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickMargin={8}
        />
        <Tooltip
          cursor={{ fill: "rgba(15,23,42,0.04)" }}
          formatter={(v) => [formatEuro(Number(v)), "Receita"]}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            padding: "6px 10px",
          }}
        />
        <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}
