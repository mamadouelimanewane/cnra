"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts"
import { formatNumber } from "@/lib/utils"

interface Stat {
  id: string; trimestre: number; annee: number; audience_hebdo: number; parts_marche: number;
  reach_mensuel: number | null; taux_fidelite: number | null
  media_nom: string | null; media_type: string | null
}

export default function AudiencesPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stat[]>([])
  const [filterAnnee, setFilterAnnee] = useState("2024")
  const [filterTrimestre, setFilterTrimestre] = useState("3")

  useEffect(() => {
    supabase.from("stats_audience")
      .select("id,trimestre,annee,audience_hebdo,parts_marche,reach_mensuel,taux_fidelite,medias:media_id(nom,type)")
      .order("annee").order("trimestre")
      .then(r => {
        const data = (r.data ?? []).map((s: Record<string, unknown>) => ({
          ...s,
          media_nom: (s.medias as { nom: string } | null)?.nom ?? null,
          media_type: (s.medias as { type: string } | null)?.type ?? null,
        }))
        setStats(data as Stat[])
      })
  }, [])

  const annees = [...new Set(stats.map(s => String(s.annee)))].sort()
  const trimestres = [...new Set(stats.filter(s => String(s.annee) === filterAnnee).map(s => String(s.trimestre)))].sort()

  const filtered = stats.filter(s => String(s.annee) === filterAnnee && String(s.trimestre) === filterTrimestre)

  const topMedias = [...filtered].sort((a, b) => b.audience_hebdo - a.audience_hebdo).slice(0, 8)

  const partsData = filtered
    .sort((a, b) => b.parts_marche - a.parts_marche)
    .map(s => ({ name: s.media_nom?.split(" ")[0] ?? "?", part: s.parts_marche }))

  const COLORS = ["#1A3A6B", "#C9A84C", "#166534", "#7c3aed", "#0891b2", "#db2777", "#d97706", "#6b7280"]

  const evolution = stats.reduce((acc, s) => {
    const key = `T${s.trimestre} ${s.annee}`
    if (!acc[key]) acc[key] = { label: key, total: 0, count: 0 }
    acc[key].total += s.audience_hebdo
    acc[key].count++
    return acc
  }, {} as Record<string, { label: string; total: number; count: number }>)

  const evoData = Object.values(evolution).map(e => ({ label: e.label, total: Math.round(e.total / 1000) }))

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Statistiques d&apos;audience</h1>
        <p className="text-gray-500 text-sm mt-1">Mesures d&apos;audience et parts de marché des médias sénégalais</p>
      </div>

      {/* Sélecteurs période */}
      <div className="flex items-center gap-4">
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white" value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)}>
          {annees.map(a => <option key={a} value={a}>Année {a}</option>)}
        </select>
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white" value={filterTrimestre} onChange={e => setFilterTrimestre(e.target.value)}>
          {["1", "2", "3", "4"].map(t => <option key={t} value={t}>T{t}</option>)}
        </select>
        <span className="text-sm text-gray-400">{filtered.length} médias mesurés pour T{filterTrimestre} {filterAnnee}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Audience cumulée", value: formatNumber(filtered.reduce((s, a) => s + a.audience_hebdo, 0)), sub: "télésp./auditeurs/semaine" },
          { label: "Leader audience", value: topMedias[0]?.media_nom ?? "—", sub: `${formatNumber(topMedias[0]?.audience_hebdo ?? 0)} hebdomadaires` },
          { label: "Leader parts marché", value: filtered.sort((a, b) => b.parts_marche - a.parts_marche)[0]?.media_nom ?? "—", sub: `${filtered.sort((a, b) => b.parts_marche - a.parts_marche)[0]?.parts_marche ?? 0}% de part` },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{k.label}</p>
            <p className="text-xl font-black text-[#1A3A6B]">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top audiences */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Top audiences hebdo (milliers)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topMedias.map(m => ({ name: m.media_nom?.split(" ")[0] ?? "?", val: Math.round(m.audience_hebdo / 1000) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v}k`]} />
              <Bar dataKey="val" radius={[4, 4, 0, 0]} name="Audience (k)">
                {topMedias.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Parts de marché */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Parts de marché (%)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={partsData} cx="50%" cy="50%" outerRadius={75} dataKey="part" nameKey="name">
                {partsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {partsData.slice(0, 5).map((p, i) => (
              <div key={p.name} className="flex items-center gap-1 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-gray-600">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Évolution temporelle */}
      {evoData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Évolution de l&apos;audience cumulée (milliers)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={evoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v}k`]} />
              <Line type="monotone" dataKey="total" stroke="#1A3A6B" strokeWidth={2.5} dot={{ r: 4 }} name="Audience cumulée (k)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table détail */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Détail — T{filterTrimestre} {filterAnnee}</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Rang", "Média", "Type", "Audience hebdo", "Part marché", "Reach mensuel", "Fidélité"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...filtered].sort((a, b) => b.audience_hebdo - a.audience_hebdo).map((s, i) => (
              <tr key={s.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <span className={`font-black text-lg ${i === 0 ? "text-[#C9A84C]" : i === 1 ? "text-gray-500" : i === 2 ? "text-amber-700" : "text-gray-300"}`}>
                    #{i + 1}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-[#1A3A6B]">{s.media_nom}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.media_type === "television" ? "bg-blue-100 text-blue-700" : s.media_type === "radio" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                    {s.media_type === "television" ? "TV" : s.media_type === "radio" ? "Radio" : "En ligne"}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">{formatNumber(s.audience_hebdo)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full">
                      <div className="h-2 bg-[#1A3A6B] rounded-full" style={{ width: `${Math.min(s.parts_marche, 100)}%` }} />
                    </div>
                    <span className="font-bold text-gray-700">{s.parts_marche}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.reach_mensuel ? formatNumber(s.reach_mensuel) : "—"}</td>
                <td className="px-4 py-3 text-gray-600">{s.taux_fidelite ? `${s.taux_fidelite}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
