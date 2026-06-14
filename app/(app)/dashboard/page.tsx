"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatNumber, getRiskColor, getRiskLabel } from "@/lib/utils"
import { Shield, AlertOctagon, FileSearch, Radio, Globe, Database, TrendingUp, Zap } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type Stats = {
  totalContenus: number
  deepfakesConfirmes: number
  campagnesActives: number
  sourcesActives: number
  alertesCritiques: number
  signaturesEnregistrees: number
  verdicts: { name: string; value: number; color: string }[]
  typeContenus: { name: string; value: number }[]
}

const VERDICT_COLORS: Record<string, string> = {
  deepfake_confirme: "#ef4444",
  manipulation_confirmed: "#f97316",
  suspect: "#eab308",
  indetermmine: "#6b7280",
  authentique: "#22c55e",
}

const VERDICT_LABELS: Record<string, string> = {
  deepfake_confirme: "Deepfake confirmé",
  manipulation_confirmed: "Manipulation confirmée",
  suspect: "Suspect",
  indetermmine: "Indéterminé",
  authentique: "Authentique",
}

export default function DashboardPage() {
  const supabaseRef = useRef(createClient())
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentAlertes, setRecentAlertes] = useState<{ titre: string; severite: string; statut: string }[]>([])

  useEffect(() => {
    const supabase = supabaseRef.current
    async function load() {
      const [contenusRes, campagnesRes, sourcesRes, alertesRes, signaturesRes] = await Promise.all([
        supabase.from("contenus_analyses").select("verdict, type_contenu"),
        supabase.from("campagnes_desinfo").select("statut"),
        supabase.from("sources_suspectes").select("actif"),
        supabase.from("alertes_antideep").select("severite, statut, titre").order("date_alerte", { ascending: false }).limit(5),
        supabase.from("signatures_deepfake").select("id", { count: "exact", head: true }),
      ])

      const contenus = contenusRes.data || []
      const campagnes = campagnesRes.data || []
      const alertes = alertesRes.data || []

      const verdictCounts: Record<string, number> = {}
      const typeCounts: Record<string, number> = {}
      contenus.forEach(c => {
        if (c.verdict) verdictCounts[c.verdict] = (verdictCounts[c.verdict] || 0) + 1
        typeCounts[c.type_contenu] = (typeCounts[c.type_contenu] || 0) + 1
      })

      setStats({
        totalContenus: contenus.length,
        deepfakesConfirmes: contenus.filter(c => c.verdict === "deepfake_confirme").length,
        campagnesActives: campagnes.filter(c => c.statut === "active").length,
        sourcesActives: (sourcesRes.data || []).filter(s => s.actif).length,
        alertesCritiques: alertes.filter(a => a.severite === "critique").length,
        signaturesEnregistrees: signaturesRes.count || 0,
        verdicts: Object.entries(verdictCounts).map(([k, v]) => ({
          name: VERDICT_LABELS[k] || k,
          value: v,
          color: VERDICT_COLORS[k] || "#6b7280",
        })),
        typeContenus: Object.entries(typeCounts).map(([k, v]) => ({ name: k, value: v })),
      })
      setRecentAlertes(alertes)
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: "Contenus analysés", value: stats?.totalContenus ?? 0, icon: FileSearch, color: "purple" },
    { label: "Deepfakes confirmés", value: stats?.deepfakesConfirmes ?? 0, icon: Shield, color: "red" },
    { label: "Campagnes actives", value: stats?.campagnesActives ?? 0, icon: Radio, color: "orange" },
    { label: "Alertes critiques", value: stats?.alertesCritiques ?? 0, icon: AlertOctagon, color: "red" },
    { label: "Sources suspectes", value: stats?.sourcesActives ?? 0, icon: Globe, color: "yellow" },
    { label: "Signatures IA", value: stats?.signaturesEnregistrees ?? 0, icon: Database, color: "purple" },
  ]

  const colorMap: Record<string, string> = {
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  }

  const severiteColors: Record<string, string> = {
    critique: "text-red-400 bg-red-500/10 border border-red-500/20",
    elevee: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
    moyenne: "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20",
    faible: "text-green-400 bg-green-500/10 border border-green-500/20",
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Tableau de bord</h1>
          <p className="text-sm text-gray-400 mt-1">Vue globale de la détection de contenus falsifiés et campagnes de désinformation</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-bold text-purple-400">IA ACTIVE</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map(card => (
              <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
                  <card.icon className="size-5" />
                </div>
                <p className="text-2xl font-black text-white">{formatNumber(card.value)}</p>
                <p className="text-xs text-gray-400 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="size-4 text-purple-400" /> Répartition des verdicts
              </h2>
              {stats!.verdicts.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats!.verdicts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                      {stats!.verdicts.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-500 text-sm">Aucune donnée</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {stats!.verdicts.map(v => (
                  <span key={v.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                    {v.name} ({v.value})
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="size-4 text-purple-400" /> Contenus par type
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats!.typeContenus} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} name="Contenus" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="size-4 text-purple-400" /> Alertes récentes
            </h2>
            <div className="space-y-2">
              {recentAlertes.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase shrink-0 ${severiteColors[a.severite]}`}>
                    {a.severite}
                  </span>
                  <p className="text-sm text-gray-300 leading-tight">{a.titre}</p>
                  <span className="ml-auto text-xs text-gray-500 shrink-0">{a.statut}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
