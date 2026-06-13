"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useCampagneActive, useStatsCampagne, useAlertesNonLues } from "@/hooks/useStats"
import { StatCard } from "@/components/dashboard/StatCard"
import { BarTempsDeparole, PieTempsDeparole } from "@/components/charts/TempsDeparoleChart"
import { EquilibreChart } from "@/components/charts/EquilibreChart"
import { AlerteItem } from "@/components/dashboard/AlerteItem"
import { formatDuree, getStatutCampagneBadge } from "@/lib/utils"
import {
  Mic2, Clock, Users, Bell, TrendingUp,
  Calendar, AlertTriangle, ChevronRight,
} from "lucide-react"
import Link from "next/link"
import type { Campagne } from "@/types"

export function DashboardClient() {
  const { campagne, loading: loadingCampagne } = useCampagneActive()
  const { statsPartis, statsMedias, loading: loadingStats } = useStatsCampagne(campagne?.id ?? null)
  const alertes = useAlertesNonLues()
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [totalInterventions, setTotalInterventions] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    if (campagne?.id) {
      supabase
        .from("interventions")
        .select("id", { count: "exact", head: true })
        .eq("campagne_id", campagne.id)
        .then(({ count }) => setTotalInterventions(count ?? 0))
    }
    supabase.from("campagnes").select("*").order("date_debut", { ascending: false }).limit(5)
      .then(({ data }) => setCampagnes(data ?? []))
  }, [campagne?.id])

  const totalSecondes = statsPartis.reduce((a, s) => a + s.total_secondes, 0)
  const mediaAlerte = statsMedias.filter((m) => m.ecart_max_pct > (campagne?.seuil_alerte_pct ?? 20))

  if (loadingCampagne) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#1A3A6B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Bannière campagne active */}
      {campagne ? (
        <div className="bg-gradient-to-r from-[#1A3A6B] to-[#2563EB] rounded-xl p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg">{campagne.nom}</p>
                <span className="px-2 py-0.5 rounded-full bg-green-400/20 text-green-200 text-xs font-semibold border border-green-400/30">
                  En cours
                </span>
              </div>
              <p className="text-blue-200 text-sm">
                {new Date(campagne.date_debut).toLocaleDateString("fr-SN")} →{" "}
                {new Date(campagne.date_fin).toLocaleDateString("fr-SN")}
                {" · "}Seuil alerte : {campagne.seuil_alerte_pct}%
              </p>
            </div>
          </div>
          <Link href={`/campagnes/${campagne.id}`}
            className="flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors">
            Voir détails <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            Aucune campagne électorale en cours.{" "}
            <Link href="/campagnes" className="font-semibold underline">Créer une campagne</Link>
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titre="Interventions saisies"
          valeur={totalInterventions.toLocaleString("fr-SN")}
          sousTitre="Cette campagne"
          icon={Mic2}
          couleurIcon="text-blue-600"
          bgIcon="bg-blue-50"
        />
        <StatCard
          titre="Temps total"
          valeur={formatDuree(totalSecondes)}
          sousTitre={`${statsPartis.length} partis couverts`}
          icon={Clock}
          couleurIcon="text-purple-600"
          bgIcon="bg-purple-50"
        />
        <StatCard
          titre="Médias suivis"
          valeur={statsMedias.length}
          sousTitre={`${mediaAlerte.length} en déséquilibre`}
          icon={TrendingUp}
          couleurIcon="text-green-600"
          bgIcon="bg-green-50"
        />
        <StatCard
          titre="Alertes actives"
          valeur={alertes.length}
          sousTitre="Non traitées"
          icon={Bell}
          couleurIcon={alertes.length > 0 ? "text-red-600" : "text-gray-400"}
          bgIcon={alertes.length > 0 ? "bg-red-50" : "bg-gray-50"}
        />
      </div>

      {/* Graphiques */}
      {!loadingStats && statsPartis.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800">Temps de parole par parti</h2>
                <p className="text-xs text-gray-500">En minutes — campagne en cours</p>
              </div>
              <div className="flex gap-1 text-xs">
                <span className="px-2 py-1 bg-[#1A3A6B] text-white rounded font-medium">min</span>
              </div>
            </div>
            <BarTempsDeparole data={statsPartis} mode="secondes" />
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-1">Répartition globale</h2>
            <p className="text-xs text-gray-500 mb-4">Part en % du temps total</p>
            <PieTempsDeparole data={statsPartis} />
          </div>

          {/* Radar équilibre médias */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold text-gray-800">Équilibre par média</h2>
              <p className="text-xs text-gray-500">Écart max entre partis sur chaque média (plus c'est bas, plus c'est équilibré)</p>
            </div>
            <EquilibreChart data={statsMedias} />
          </div>

          {/* Alertes récentes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Alertes récentes</h2>
              <Link href="/alertes" className="text-xs text-[#1A3A6B] font-medium hover:underline">
                Voir tout →
              </Link>
            </div>
            {alertes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                  <Bell className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-500">Aucune alerte active</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alertes.slice(0, 5).map((a) => (
                  <AlerteItem key={a.id} alerte={a} compact />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : campagne && !loadingStats ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Mic2 className="w-6 h-6 text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">Aucune donnée</h3>
          <p className="text-sm text-gray-400 mb-4">Commencez à saisir des interventions pour voir les statistiques.</p>
          <Link href="/interventions/nouvelle"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A3A6B] text-white text-sm font-medium rounded-lg hover:bg-[#1e4080] transition-colors">
            <Mic2 className="w-4 h-4" /> Saisir une intervention
          </Link>
        </div>
      ) : null}

      {/* Liste des campagnes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Campagnes récentes</h2>
          <Link href="/campagnes" className="text-xs text-[#1A3A6B] font-medium hover:underline">
            Gérer →
          </Link>
        </div>
        {campagnes.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Aucune campagne créée</p>
        ) : (
          <div className="space-y-2">
            {campagnes.map((c) => {
              const badge = getStatutCampagneBadge(c.statut)
              return (
                <Link key={c.id} href={`/campagnes/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1A3A6B]" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.nom}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(c.date_debut).toLocaleDateString("fr-SN")} →{" "}
                        {new Date(c.date_fin).toLocaleDateString("fr-SN")}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.class}`}>
                    {badge.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
