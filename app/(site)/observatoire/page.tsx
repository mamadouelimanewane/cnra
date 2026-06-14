"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { formatDuree, formatDate } from "@/lib/utils"
import { Activity, Clock, Radio, Users, AlertTriangle } from "lucide-react"

interface StatParti { parti_nom: string; parti_sigle: string; parti_couleur: string; total_secondes: number; pourcentage: number; nb_interventions: number }
interface StatMedia { media_nom: string; media_type: string; total_secondes: number; nb_interventions: number }
interface Campagne { id: string; nom: string; date_debut: string; date_fin: string; statut: string; seuil_alerte_pct: number }

export default function ObservatoirePage() {
  const supabase = createClient()
  const [campagne, setCampagne] = useState<Campagne | null>(null)
  const [statsParti, setStatsParti] = useState<StatParti[]>([])
  const [statsMedia, setStatsMedia] = useState<StatMedia[]>([])
  const [alertes, setAlertes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from("campagnes").select("*").eq("statut", "en_cours").limit(1).single()
      if (!c) { setLoading(false); return }
      setCampagne(c as Campagne)
      const [sp, sm, al] = await Promise.all([
        supabase.from("v_stats_parti_campagne").select("*").eq("campagne_id", c.id).order("total_secondes", { ascending: false }),
        supabase.from("v_stats_media_campagne").select("*").eq("campagne_id", c.id).order("total_secondes", { ascending: false }),
        supabase.from("alertes").select("id").eq("campagne_id", c.id).in("statut", ["non_lue", "en_cours"]),
      ])
      setStatsParti((sp.data ?? []) as StatParti[])
      setStatsMedia((sm.data ?? []) as StatMedia[])
      setAlertes(al.data?.length ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  const totalSec = statsParti.reduce((s, p) => s + p.total_secondes, 0)
  const barData = statsParti.map(p => ({ name: p.parti_sigle, minutes: Math.round(p.total_secondes / 60), couleur: p.parti_couleur, pct: p.pourcentage }))
  const pieData = statsParti.map(p => ({ name: p.parti_sigle, value: p.total_secondes, color: p.parti_couleur }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#1A3A6B] mb-2">Observatoire du pluralisme</h1>
        <p className="text-gray-500">Données officielles de monitoring du temps de parole électoral</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement des données…</div>
      ) : !campagne ? (
        <div className="text-center py-20">
          <Activity className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune campagne électorale en cours actuellement.</p>
        </div>
      ) : (
        <>
          {/* Campagne active */}
          <div className="bg-[#1A3A6B] text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-xs font-bold uppercase tracking-wide">En cours</span>
              </div>
              <h2 className="text-xl font-black">{campagne.nom}</h2>
              <p className="text-blue-300 text-sm">{formatDate(campagne.date_debut)} → {formatDate(campagne.date_fin)}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div><p className="text-2xl font-black">{statsParti.length}</p><p className="text-blue-300 text-xs">Partis</p></div>
              <div><p className="text-2xl font-black">{statsMedia.length}</p><p className="text-blue-300 text-xs">Médias</p></div>
              <div><p className="text-2xl font-black text-red-300">{alertes}</p><p className="text-blue-300 text-xs">Alertes</p></div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: "Temps total surveillé", value: formatDuree(totalSec), color: "text-[#1A3A6B] bg-blue-50" },
              { icon: Users, label: "Partis monitorés", value: statsParti.length, color: "text-purple-700 bg-purple-50" },
              { icon: Radio, label: "Médias couverts", value: statsMedia.length, color: "text-cyan-700 bg-cyan-50" },
              { icon: AlertTriangle, label: "Alertes actives", value: alertes, color: "text-red-700 bg-red-50" },
            ].map(k => (
              <div key={k.label} className={`rounded-2xl p-5 ${k.color.split(" ")[1]}`}>
                <k.icon className={`size-6 mb-3 ${k.color.split(" ")[0]}`} />
                <p className={`text-3xl font-black ${k.color.split(" ")[0]}`}>{k.value}</p>
                <p className="text-sm text-gray-600 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-5">Temps de parole par parti (minutes)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip formatter={(v: number) => [`${v} min`, "Temps"]} />
                  <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.couleur} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-5">Répartition globale (%)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatDuree(v), "Durée"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Détail par parti politique</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left">Parti</th>
                  <th className="px-6 py-3 text-left">Sigle</th>
                  <th className="px-6 py-3 text-right">Temps total</th>
                  <th className="px-6 py-3 text-right">Interventions</th>
                  <th className="px-6 py-3 text-left">Part (%)</th>
                </tr></thead>
                <tbody>
                  {statsParti.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.parti_couleur }} />
                          <span className="font-medium text-gray-900 text-sm">{p.parti_nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.parti_sigle}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{formatDuree(p.total_secondes)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">{p.nb_interventions}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-24 bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ width: `${p.pourcentage}%`, background: p.parti_couleur }} />
                          </div>
                          <span className="text-sm font-bold text-gray-700 w-12 text-right">{Number(p.pourcentage).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">Données mises à jour en temps réel · Source : CNRA ElectroWatch</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
