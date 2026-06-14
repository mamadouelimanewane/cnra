"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Clock, Users } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts"

interface Parole {
  id: string; acteur: string; type_acteur: string; parti: string | null; duree_secondes: number; date_mesure: string; contexte: string | null; favorable: boolean | null; media_nom: string | null
}

const TYPE_COLORS: Record<string, string> = {
  politique: "#1A3A6B", gouvernement: "#C9A84C", opposition: "#dc2626", societe_civile: "#166534", expert: "#7c3aed", journaliste: "#0891b2"
}

export default function TempsPaolePage() {
  const supabaseRef = useRef(createClient())
  const [data, setData] = useState<Parole[]>([])
  const [filterType, setFilterType] = useState("tous")
  const [filterMedia, setFilterMedia] = useState("tous")

  useEffect(() => {
    const sb = supabaseRef.current
    sb.from("temps_parole")
      .select("id,acteur,type_acteur,parti,duree_secondes,date_mesure,contexte,favorable,medias:media_id(nom)")
      .order("date_mesure", { ascending: false })
      .then(r => {
        setData((r.data ?? []).map((x: Record<string, unknown>) => ({
          ...x, media_nom: (x.medias as { nom: string } | null)?.nom ?? null
        })) as Parole[])
      })
  }, [])

  const medias = ["tous", ...Array.from(new Set(data.map(d => d.media_nom).filter(Boolean)))] as string[]
  const types = ["tous", ...Array.from(new Set(data.map(d => d.type_acteur)))]

  const filtered = data.filter(d =>
    (filterType === "tous" || d.type_acteur === filterType) &&
    (filterMedia === "tous" || d.media_nom === filterMedia)
  )

  // Agrégation par acteur
  const byActeur = Object.entries(
    filtered.reduce((acc, d) => {
      if (!acc[d.acteur]) acc[d.acteur] = { total: 0, type: d.type_acteur, parti: d.parti }
      acc[d.acteur].total += d.duree_secondes
      return acc
    }, {} as Record<string, { total: number; type: string; parti: string | null }>)
  ).map(([acteur, v]) => ({ acteur, minutes: Math.round(v.total / 60), type: v.type, parti: v.parti }))
    .sort((a, b) => b.minutes - a.minutes)

  // Agrégation par média
  const byMedia = Object.entries(
    filtered.reduce((acc, d) => {
      const k = d.media_nom ?? "Inconnu"
      acc[k] = (acc[k] ?? 0) + d.duree_secondes
      return acc
    }, {} as Record<string, number>)
  ).map(([media, sec]) => ({ media, minutes: Math.round(sec / 60) })).sort((a, b) => b.minutes - a.minutes)

  // Par type acteur
  const byType = Object.entries(
    filtered.reduce((acc, d) => { acc[d.type_acteur] = (acc[d.type_acteur] ?? 0) + d.duree_secondes; return acc }, {} as Record<string, number>)
  ).map(([type, sec]) => ({ type, minutes: Math.round(sec / 60) }))

  const COLORS = ["#1A3A6B", "#C9A84C", "#166534", "#dc2626", "#7c3aed", "#0891b2"]
  const totalMinutes = byActeur.reduce((s, a) => s + a.minutes, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Temps de parole</h1>
        <p className="text-gray-500 text-sm mt-1">Analyse du temps d&apos;antenne accordé aux acteurs politiques et institutionnels</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total mesuré", value: `${totalMinutes} min`, sub: `${data.length} interventions` },
          { label: "Acteurs distincts", value: byActeur.length, sub: "personnalités suivies" },
          { label: "1er temps de parole", value: byActeur[0]?.acteur.split(" ").slice(-1)[0] ?? "—", sub: `${byActeur[0]?.minutes ?? 0} min cumulées` },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-black text-[#1A3A6B] mt-1">{k.value}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl" value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === "tous" ? "Tous types" : t.replace(/_/g, " ")}</option>)}
        </select>
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl" value={filterMedia} onChange={e => setFilterMedia(e.target.value)}>
          {medias.map(m => <option key={m} value={m}>{m === "tous" ? "Tous médias" : m}</option>)}
        </select>
        <div className="ml-auto text-sm text-gray-400 flex items-center">{filtered.length} interventions</div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top acteurs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Classement temps de parole (min)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byActeur.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit=" min" />
              <YAxis type="category" dataKey="acteur" tick={{ fontSize: 9 }} width={90} tickFormatter={v => v.split(" ").slice(-1)[0]} />
              <Tooltip formatter={(v: number) => [`${v} min`]} />
              <Bar dataKey="minutes" radius={[0, 4, 4, 0]} name="Durée (min)">
                {byActeur.slice(0, 8).map((a, i) => (
                  <Cell key={i} fill={TYPE_COLORS[a.type] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Légende types */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-gray-500 capitalize">{type.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Par type acteur */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Répartition par catégorie</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={byType} cx="50%" cy="50%" outerRadius={75} dataKey="minutes" nameKey="type">
                {byType.map((t, i) => <Cell key={i} fill={TYPE_COLORS[t.type] ?? COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} min`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {byType.sort((a, b) => b.minutes - a.minutes).map(t => (
              <div key={t.type} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: TYPE_COLORS[t.type] ?? "#6b7280" }} />
                <span className="text-sm text-gray-600 flex-1 capitalize">{t.type.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full" style={{ width: `${(t.minutes / totalMinutes) * 100}%`, background: TYPE_COLORS[t.type] ?? "#6b7280" }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-12 text-right">{t.minutes} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Par média */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-5">Temps de parole politique par média (minutes cumulées)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byMedia}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="media" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => [`${v} min`]} />
            <Bar dataKey="minutes" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Durée (min)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table détail */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Détail des interventions</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Acteur", "Parti", "Catégorie", "Média", "Durée", "Date", "Contexte", "Ton"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-semibold text-gray-900">{d.acteur}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{d.parti ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize" style={{ background: (TYPE_COLORS[d.type_acteur] ?? "#6b7280") + "18", color: TYPE_COLORS[d.type_acteur] ?? "#6b7280" }}>
                    {d.type_acteur.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{d.media_nom ?? "—"}</td>
                <td className="px-4 py-3 font-bold text-[#1A3A6B]">{Math.round(d.duree_secondes / 60)} min</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(d.date_mesure).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-40 truncate">{d.contexte ?? "—"}</td>
                <td className="px-4 py-3">
                  {d.favorable === true ? <span className="text-green-600 font-bold text-xs">Favorable</span>
                    : d.favorable === false ? <span className="text-red-600 font-bold text-xs">Défavorable</span>
                    : <span className="text-gray-400 text-xs">Neutre</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
