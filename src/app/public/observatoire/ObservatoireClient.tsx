"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarTempsDeparole, PieTempsDeparole } from "@/components/charts/TempsDeparoleChart"
import { formatDuree, getStatutCampagneBadge } from "@/lib/utils"
import { Shield, Vote, ExternalLink, Calendar, Info } from "lucide-react"
import type { Campagne, StatParti } from "@/types"
import Link from "next/link"

export function ObservatoireClient() {
  const [campagne, setCampagne] = useState<Campagne | null>(null)
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [statsPartis, setStatsPartis] = useState<StatParti[]>([])
  const [rapports, setRapports] = useState<{ id: string; titre: string; periode_debut: string; periode_fin: string; genere_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [now] = useState(new Date())

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [{ data: camps }, { data: rpts }] = await Promise.all([
        supabase.from("campagnes").select("*").order("date_debut", { ascending: false }),
        supabase.from("rapports").select("id,titre,periode_debut,periode_fin,genere_at").eq("publie", true).order("genere_at", { ascending: false }).limit(5),
      ])
      setCampagnes(camps ?? [])
      setRapports(rpts ?? [])

      const active = camps?.find((c: Campagne) => c.statut === "en_cours")
      if (active) {
        setCampagne(active)
        const { data: stats } = await supabase
          .from("v_stats_parti_campagne")
          .select("*")
          .eq("campagne_id", active.id)
          .order("total_secondes", { ascending: false })
        const sp: StatParti[] = (stats ?? []).map((s) => ({
          parti: { id: s.parti_id, nom: s.parti_nom, sigle: s.parti_sigle, couleur: s.parti_couleur, logo_url: null, actif: true, created_at: "" },
          total_secondes: s.total_secondes,
          nombre_interventions: s.nb_interventions,
          pourcentage: s.pourcentage,
          par_media: [],
        }))
        setStatsPartis(sp)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalSecondes = statsPartis.reduce((a, s) => a + s.total_secondes, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1A3A6B] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold leading-tight">CNRA ElectroWatch</p>
              <p className="text-blue-300 text-xs">Observatoire Public du Pluralisme Médiatique</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs text-blue-200">
              Mis à jour : {now.toLocaleString("fr-SN")}
            </span>
            <Link href="/login"
              className="text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              Espace agents <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Bannière CNRA */}
      <div className="bg-[#C9A84C] text-white">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-2 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          Plateforme officielle du Conseil National de Régulation de l'Audiovisuel — République du Sénégal
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Info légale */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Ces données sont publiées par le CNRA conformément à ses obligations légales de garantir
            l'équité du temps de parole entre partis politiques dans les médias audiovisuels sénégalais,
            en application de la loi 2006-04 du 4 janvier 2006.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1A3A6B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !campagne ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600 mb-1">Aucune campagne électorale en cours</h3>
            <p className="text-sm text-gray-400">Les données seront affichées lors de la prochaine campagne officielle.</p>
          </div>
        ) : (
          <>
            {/* Campagne active */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Campagne en cours</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{campagne.nom}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Du {new Date(campagne.date_debut).toLocaleDateString("fr-SN", { day: "numeric", month: "long", year: "numeric" })} au{" "}
                    {new Date(campagne.date_fin).toLocaleDateString("fr-SN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-2xl font-bold text-[#1A3A6B]">{statsPartis.length}</p>
                    <p className="text-xs text-gray-500">Partis suivis</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-2xl font-bold text-[#1A3A6B]">{formatDuree(totalSecondes)}</p>
                    <p className="text-xs text-gray-500">Temps total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphiques */}
            {statsPartis.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="font-semibold text-gray-800 mb-1">Temps de parole par parti</h2>
                  <p className="text-xs text-gray-400 mb-5">En minutes — données consolidées à ce jour</p>
                  <BarTempsDeparole data={statsPartis} mode="secondes" />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="font-semibold text-gray-800 mb-1">Répartition en %</h2>
                  <p className="text-xs text-gray-400 mb-5">Part du temps d'antenne total</p>
                  <PieTempsDeparole data={statsPartis} />
                </div>

                {/* Table détaillée */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Tableau détaillé</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parti</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Temps total</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Interventions</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Part (%)</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Répartition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {statsPartis.map((s) => (
                          <tr key={s.parti.id} className="hover:bg-gray-50">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.parti.couleur }} />
                                <div>
                                  <p className="font-semibold text-gray-800">{s.parti.nom}</p>
                                  <p className="text-xs text-gray-400">{s.parti.sigle}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-[#1A3A6B]">
                              {formatDuree(s.total_secondes)}
                            </td>
                            <td className="px-5 py-4 text-right text-gray-600">
                              {s.nombre_interventions}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-bold text-gray-800">{s.pourcentage.toFixed(1)}%</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{ width: `${s.pourcentage}%`, backgroundColor: s.parti.couleur }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <p className="text-gray-400 text-sm">Les données de monitoring seront affichées ici dès les premières saisies.</p>
              </div>
            )}
          </>
        )}

        {/* Rapports publiés */}
        {rapports.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Rapports officiels publiés</h2>
              <p className="text-xs text-gray-400 mt-0.5">Avis et bilans périodiques du CNRA</p>
            </div>
            <div className="divide-y divide-gray-50">
              {rapports.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{r.titre}</p>
                    <p className="text-xs text-gray-400">{r.periode_debut} → {r.periode_fin}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.genere_at).toLocaleDateString("fr-SN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campagnes terminées */}
        {campagnes.filter((c) => c.statut === "terminee").length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Campagnes précédentes</h2>
            <div className="space-y-2">
              {campagnes.filter((c) => c.statut === "terminee").map((c) => {
                const badge = getStatutCampagneBadge(c.statut)
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{c.nom}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(c.date_debut).toLocaleDateString("fr-SN")} → {new Date(c.date_fin).toLocaleDateString("fr-SN")}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.class}`}>{badge.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {now.getFullYear()} CNRA — Conseil National de Régulation de l'Audiovisuel du Sénégal</p>
          <div className="flex gap-4">
            <span>Immeuble Tamaro, 10ème étage, Rue Jules Ferry, Dakar</span>
            <span>contact@cnra.sn</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
