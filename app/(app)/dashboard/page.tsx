"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, Clock, Eye, FileText, TrendingUp, Zap } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { formatDuration } from "@/lib/utils"

interface Alerte { id: string; type_alerte: string; severite: string; titre: string; statut: string; date_alerte: string; media_nom: string | null }
interface ParoleStats { acteur: string; total_sec: number; parti: string | null }
interface ObsTheme { thematique: string; count: number }

const SEV_COLORS: Record<string, string> = { critique: "#dc2626", elevee: "#ea580c", moyenne: "#d97706", faible: "#16a34a" }

export default function DashboardPage() {
  const supabaseRef = useRef(createClient())
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [parole, setParole] = useState<ParoleStats[]>([])
  const [themes, setThemes] = useState<ObsTheme[]>([])
  const [nbSessions, setNbSessions] = useState(0)
  const [nbRapports, setNbRapports] = useState(0)

  useEffect(() => {
    const sb = supabaseRef.current
    Promise.all([
      sb.from("alertes_monitoring").select("id,type_alerte,severite,titre,statut,date_alerte,medias:media_id(nom)").order("date_alerte", { ascending: false }).limit(5),
      sb.from("temps_parole").select("acteur,duree_secondes,parti"),
      sb.from("observations_contenu").select("thematique"),
      sb.from("monitoring_sessions").select("id", { count: "exact", head: true }),
      sb.from("rapports_veille").select("id", { count: "exact", head: true }),
    ]).then(([a, p, o, s, r]) => {
      setAlertes((a.data ?? []).map((x: Record<string, unknown>) => ({
        ...x, media_nom: (x.medias as { nom: string } | null)?.nom ?? null
      })) as Alerte[])

      // Agréger temps de parole par acteur
      const acc: Record<string, { total: number; parti: string | null }> = {}
      ;(p.data ?? []).forEach((row: { acteur: string; duree_secondes: number; parti: string | null }) => {
        if (!acc[row.acteur]) acc[row.acteur] = { total: 0, parti: row.parti }
        acc[row.acteur].total += row.duree_secondes
      })
      setParole(Object.entries(acc).map(([acteur, v]) => ({ acteur, total_sec: v.total, parti: v.parti })).sort((a, b) => b.total_sec - a.total_sec).slice(0, 8))

      // Agréger observations par thème
      const tAcc: Record<string, number> = {}
      ;(o.data ?? []).forEach((row: { thematique: string }) => { tAcc[row.thematique] = (tAcc[row.thematique] ?? 0) + 1 })
      setThemes(Object.entries(tAcc).map(([thematique, count]) => ({ thematique, count })).sort((a, b) => b.count - a.count))

      setNbSessions(s.count ?? 0)
      setNbRapports(r.count ?? 0)
    })
  }, [])

  const alertesActives = alertes.filter(a => a.statut === "nouvelle" || a.statut === "en_cours")
  const alertesCritiques = alertes.filter(a => a.severite === "critique" || a.severite === "elevee")
  const PIE_COLORS = ["#1A3A6B", "#C9A84C", "#166534", "#7c3aed", "#0891b2"]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Veille et monitoring des contenus audiovisuels sénégalais</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold">Surveillance active — {new Date().toLocaleDateString("fr-FR")}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Alertes actives", value: alertesActives.length, icon: AlertTriangle, color: "bg-red-50 text-red-700", sub: `dont ${alertesCritiques.length} élevées/critiques` },
          { label: "Sessions monitoring", value: nbSessions, icon: Eye, color: "bg-blue-50 text-[#1A3A6B]", sub: "séances de surveillance" },
          { label: "Acteurs suivis", value: parole.length, icon: Clock, color: "bg-purple-50 text-purple-700", sub: "personnalités analysées" },
          { label: "Rapports produits", value: nbRapports, icon: FileText, color: "bg-green-50 text-green-700", sub: "hebdo, mensuel, spécial" },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 ${k.color.split(" ")[0]}`}>
            <k.icon className={`size-7 mb-3 ${k.color.split(" ")[1]}`} />
            <p className={`text-3xl font-black ${k.color.split(" ")[1]}`}>{k.value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{k.label}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Alertes récentes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            Alertes récentes
          </h3>
          <a href="/alertes" className="text-sm text-[#1A3A6B] hover:underline">Voir tout →</a>
        </div>
        <div className="divide-y divide-gray-50">
          {alertes.map(a => (
            <div key={a.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50">
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: SEV_COLORS[a.severite] ?? "#6b7280" }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{a.titre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.media_nom} — {new Date(a.date_alerte).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: (SEV_COLORS[a.severite] ?? "#6b7280") + "18", color: SEV_COLORS[a.severite] ?? "#6b7280" }}>
                  {a.severite}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.statut === "nouvelle" ? "bg-red-100 text-red-700" : a.statut === "resolue" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {a.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top temps de parole */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Clock className="size-5 text-[#1A3A6B]" />
            Top temps de parole — Sem. 44 2024
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={parole.map(p => ({ name: p.acteur.split(" ").slice(-1)[0], val: Math.round(p.total_sec / 60) }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit=" min" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
              <Tooltip formatter={(v: number) => [`${v} min`]} />
              <Bar dataKey="val" fill="#1A3A6B" radius={[0, 4, 4, 0]} name="Durée (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Thématiques */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-[#C9A84C]" />
            Thématiques observées
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={themes} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="thematique">
                {themes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-3">
            {themes.map((t, i) => (
              <div key={t.thematique} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-gray-600">{t.thematique}</span>
                <span className="font-bold text-gray-800">({t.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
