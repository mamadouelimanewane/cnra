"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts"
import { formatDuree } from "@/lib/utils"
import type { StatParti } from "@/types"

// ─── Barchart temps de parole ──────────────────────────────────

interface BarTempsDeparoleProps {
  data: StatParti[]
  mode?: "secondes" | "pourcentage"
}

export function BarTempsDeparole({ data, mode = "secondes" }: BarTempsDeparoleProps) {
  const chartData = data.map((s) => ({
    nom: s.parti.sigle,
    valeur: mode === "pourcentage" ? s.pourcentage : Math.round(s.total_secondes / 60),
    couleur: s.parti.couleur,
    label: s.parti.nom,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
        <XAxis
          dataKey="nom"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => mode === "pourcentage" ? `${v}%` : `${v}min`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                <p className="font-semibold text-gray-800 text-sm mb-1">{d.label}</p>
                <p className="text-sm text-gray-600">
                  {mode === "pourcentage"
                    ? `${d.valeur.toFixed(1)}% du temps total`
                    : `${d.valeur} minutes`}
                </p>
              </div>
            )
          }}
        />
        <Bar dataKey="valeur" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.couleur} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Pie chart répartition ─────────────────────────────────────

interface PieTempsDeparoleProps {
  data: StatParti[]
}

export function PieTempsDeparole({ data }: PieTempsDeparoleProps) {
  const chartData = data.map((s) => ({
    name: s.parti.sigle,
    value: s.pourcentage,
    couleur: s.parti.couleur,
    label: s.parti.nom,
    duree: formatDuree(s.total_secondes),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={3}
        >
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.couleur} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                <p className="font-semibold text-gray-800 text-sm">{d.label}</p>
                <p className="text-sm text-gray-600">{d.value.toFixed(1)}% — {d.duree}</p>
              </div>
            )
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value, entry: { payload?: { label?: string } }) =>
            <span className="text-xs text-gray-600">{entry?.payload?.label ?? value}</span>
          }
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
