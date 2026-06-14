"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatNumber } from "@/lib/utils"
import { Tv, Radio, Globe, Users, Building2, TrendingUp, Award, AlertTriangle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts"

interface Media { id: string; nom: string; type: string; statut: string; audience_estimee: number | null; couverture: string | null }
interface StatsAudience { media_nom: string; audience_hebdo: number; parts_marche: number }

const TYPE_COLORS = { television: "#1A3A6B", radio: "#C9A84C", en_ligne: "#166534" }

export default function DashboardPage() {
  const supabase = createClient()
  const [medias, setMedias] = useState<Media[]>([])
  const [audiences, setAudiences] = useState<StatsAudience[]>([])
  const [nbJournalistes, setNbJournalistes] = useState(0)
  const [nbGroupes, setNbGroupes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [m, a, j, g] = await Promise.all([
        supabase.from("medias").select("id,nom,type,statut,audience_estimee,couverture"),
        supabase.from("stats_audience").select("media_nom:medias(nom),audience_hebdo,parts_marche").eq("annee", 2024).eq("trimestre", 3),
        supabase.from("journalistes").select("id", { count: "exact", head: true }),
        supabase.from("groupes_media").select("id", { count: "exact", head: true }),
      ])
      setMedias((m.data ?? []) as Media[])
      setAudiences((a.data ?? []).map((d: Record<string, unknown>) => ({
        media_nom: (d.media_nom as { nom: string })?.nom ?? "?",
        audience_hebdo: d.audience_hebdo as number,
        parts_marche: Number(d.parts_marche),
      })))
      setNbJournalistes(j.count ?? 0)
      setNbGroupes(g.count ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const tv = medias.filter(m => m.type === "television")
  const radio = medias.filter(m => m.type === "radio")
  const online = medias.filter(m => m.type === "en_ligne")
  const actifs = medias.filter(m => m.statut === "actif")
  const totalAudience = medias.reduce((s, m) => s + (m.audience_estimee ?? 0), 0)

  const repartitionData = [
    { name: "Télévision", value: tv.length, color: "#1A3A6B" },
    { name: "Radio", value: radio.length, color: "#C9A84C" },
    { name: "En ligne", value: online.length, color: "#166534" },
  ]

  const audienceData = audiences
    .sort((a, b) => b.audience_hebdo - a.audience_hebdo)
    .slice(0, 6)
    .map(a => ({ name: a.media_nom.split(" ")[0], audience: Math.round(a.audience_hebdo / 1000), part: a.parts_marche }))

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Paysage médiatique sénégalais — Vue d&apos;ensemble</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-semibold">Base à jour — {new Date().toLocaleDateString("fr-FR")}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Médias actifs", value: actifs.length, icon: Tv, color: "bg-blue-50 text-[#1A3A6B]", sub: `sur ${medias.length} enregistrés` },
          { label: "Audience cumulée", value: formatNumber(totalAudience), icon: TrendingUp, color: "bg-green-50 text-green-700", sub: "téléspectateurs/auditeurs" },
          { label: "Journalistes", value: nbJournalistes, icon: Users, color: "bg-purple-50 text-purple-700", sub: "accrédités CNRA" },
          { label: "Groupes médias", value: nbGroupes, icon: Building2, color: "bg-amber-50 text-amber-700", sub: "conglomérats recensés" },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 ${k.color.split(" ")[0]}`}>
            <k.icon className={`size-7 mb-3 ${k.color.split(" ")[1]}`} />
            <p className={`text-3xl font-black ${k.color.split(" ")[1]}`}>{k.value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{k.label}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Sous-KPIs par type */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Télévisions", value: tv.length, icon: Tv, color: "#1A3A6B" },
          { label: "Radios", value: radio.length, icon: Radio, color: "#C9A84C" },
          { label: "Médias en ligne", value: online.length, icon: Globe, color: "#166534" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.color + "15" }}>
              <k.icon className="size-6" style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{k.value}</p>
              <p className="text-sm text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Audience top médias */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Top audiences (milliers, T3 2024)</h3>
          {loading ? <div className="h-48 flex items-center justify-center text-gray-400">Chargement…</div> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={audienceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}k auditeurs/téléspectateurs`]} />
                <Bar dataKey="audience" fill="#1A3A6B" radius={[4, 4, 0, 0]} name="Audience (k)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Répartition par type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Répartition par type</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={repartitionData} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                {repartitionData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {repartitionData.map(r => (
              <div key={r.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                  <span className="text-gray-600">{r.name}</span>
                </div>
                <span className="font-bold text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parts de marché */}
      {audienceData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Parts de marché — T3 2024 (%)</h3>
          <div className="space-y-3">
            {audiences.sort((a, b) => b.parts_marche - a.parts_marche).map(a => (
              <div key={a.media_nom} className="flex items-center gap-4">
                <span className="w-28 text-sm font-medium text-gray-700 truncate">{a.media_nom}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className="h-3 rounded-full bg-gradient-to-r from-[#1A3A6B] to-[#C9A84C]"
                    style={{ width: `${Math.min(a.parts_marche, 100)}%` }} />
                </div>
                <span className="w-14 text-right text-sm font-bold text-[#1A3A6B]">{a.parts_marche}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
