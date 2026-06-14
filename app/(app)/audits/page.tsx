"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface Audit {
  id: string; date_audit: string; type_audit: string; resultat: string; score: number | null;
  observations: string | null; recommandations: string | null; auditeur: string | null;
  media_nom: string | null; media_type: string | null
}

const RESULTAT_COLORS: Record<string, string> = {
  conforme: "#166534", non_conforme: "#dc2626", partiellement_conforme: "#d97706"
}

export default function AuditsPage() {
  const supabase = createClient()
  const [audits, setAudits] = useState<Audit[]>([])
  const [filterResultat, setFilterResultat] = useState("tous")
  const [filterType, setFilterType] = useState("tous")

  useEffect(() => {
    supabase.from("audits_media")
      .select("id,date_audit,type_audit,resultat,score,observations,recommandations,auditeur,medias:media_id(nom,type)")
      .order("date_audit", { ascending: false })
      .then(r => {
        const data = (r.data ?? []).map((a: Record<string, unknown>) => ({
          ...a,
          media_nom: (a.medias as { nom: string } | null)?.nom ?? null,
          media_type: (a.medias as { type: string } | null)?.type ?? null,
        }))
        setAudits(data as Audit[])
      })
  }, [])

  const types = ["tous", ...Array.from(new Set(audits.map(a => a.type_audit)))]

  const filtered = audits.filter(a =>
    (filterResultat === "tous" || a.resultat === filterResultat) &&
    (filterType === "tous" || a.type_audit === filterType)
  )

  const byResultat = [
    { name: "Conforme", value: audits.filter(a => a.resultat === "conforme").length, color: "#166534" },
    { name: "Non conforme", value: audits.filter(a => a.resultat === "non_conforme").length, color: "#dc2626" },
    { name: "Partiellement", value: audits.filter(a => a.resultat === "partiellement_conforme").length, color: "#d97706" },
  ]

  const avgScore = audits.filter(a => a.score != null).reduce((s, a, _, arr) => s + (a.score ?? 0) / arr.length, 0)

  const byType = types.slice(1).map(t => ({
    type: t,
    count: audits.filter(a => a.type_audit === t).length,
    avgScore: Math.round(audits.filter(a => a.type_audit === t && a.score != null).reduce((s, a, _, arr) => s + (a.score ?? 0) / arr.length, 0))
  }))

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Audits & Contrôles</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi des missions de contrôle et d&apos;audit des médias par le CNRA</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total audits", value: audits.length, icon: ClipboardCheck, color: "bg-blue-50 text-[#1A3A6B]" },
          { label: "Conformes", value: audits.filter(a => a.resultat === "conforme").length, icon: CheckCircle, color: "bg-green-50 text-green-700" },
          { label: "Non conformes", value: audits.filter(a => a.resultat === "non_conforme").length, icon: XCircle, color: "bg-red-50 text-red-700" },
          { label: "Score moyen", value: `${Math.round(avgScore)}/100`, icon: TrendingUp, color: "bg-amber-50 text-amber-700" },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 ${k.color.split(" ")[0]}`}>
            <k.icon className={`size-7 mb-3 ${k.color.split(" ")[1]}`} />
            <p className={`text-3xl font-black ${k.color.split(" ")[1]}`}>{k.value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Résultats</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={byResultat} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                {byResultat.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {byResultat.map(r => (
              <div key={r.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                  <span className="text-gray-600">{r.name}</span>
                </div>
                <span className="font-bold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Score moyen par type d&apos;audit</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="type" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#1A3A6B" radius={[4, 4, 0, 0]} name="Score moyen" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtres + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none" value={filterResultat} onChange={e => setFilterResultat(e.target.value)}>
          <option value="tous">Tous résultats</option>
          <option value="conforme">Conforme</option>
          <option value="non_conforme">Non conforme</option>
          <option value="partiellement_conforme">Partiellement conforme</option>
        </select>
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === "tous" ? "Tous types" : t}</option>)}
        </select>
        <div className="ml-auto text-sm text-gray-400 flex items-center">{filtered.length} audits</div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Média", "Type d'audit", "Date", "Résultat", "Score", "Auditeur", "Observations"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(a => {
              const color = RESULTAT_COLORS[a.resultat] ?? "#6b7280"
              return (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-[#1A3A6B]">{a.media_nom ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.type_audit}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(a.date_audit).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: color + "18", color }}>
                      {a.resultat.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.score != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full">
                          <div className="h-2 rounded-full" style={{ width: `${a.score}%`, background: color }} />
                        </div>
                        <span className="font-bold text-gray-700">{a.score}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.auditeur ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-48 truncate">{a.observations ?? "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
