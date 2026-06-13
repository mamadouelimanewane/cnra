"use client"

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts"
import type { StatMedia } from "@/types"

interface EquilibreChartProps {
  data: StatMedia[]
}

export function EquilibreChart({ data }: EquilibreChartProps) {
  const chartData = data.map((m) => ({
    media: m.media.sigle ?? m.media.nom,
    ecart: m.ecart_max_pct,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="media" tick={{ fontSize: 11, fill: "#6b7280" }} />
        <Radar
          name="Écart max (%)"
          dataKey="ecart"
          stroke="#1A3A6B"
          fill="#1A3A6B"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(1)}%`, "Écart max"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
