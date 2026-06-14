"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, Shield, Radio, Globe, Database, AlertOctagon, TrendingUp, FileText } from "lucide-react"

type SummaryStats = {
  totalContenus: number
  deepfakesConfirmes: number
  manipulations: number
  suspects: number
  authentiques: number
  campagnesActives: number
  campagnesNeutralisees: number
  sourcesActives: number
  alertesCritiques: number
  alertesEnCours: number
  totalPartages: number
  signaturesTotal: number
}

export default function RapportsPage() {
  const supabaseRef = useRef(createClient())
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  useEffect(() => {
    const supabase = supabaseRef.current
    async function load() {
      const [contenusRes, campagnesRes, sourcesRes, alertesRes, sigsRes, partagesRes] = await Promise.all([
        supabase.from("contenus_analyses").select("verdict"),
        supabase.from("campagnes_desinfo").select("statut"),
        supabase.from("sources_suspectes").select("actif"),
        supabase.from("alertes_antideep").select("severite, statut"),
        supabase.from("signatures_deepfake").select("id", { count: "exact", head: true }),
        supabase.from("campagnes_desinfo").select("nb_partages_est"),
      ])

      const contenus = contenusRes.data || []
      const campagnes = campagnesRes.data || []
      const alertes = alertesRes.data || []
      const totalPartages = (partagesRes.data || []).reduce((sum, c) => sum + (c.nb_partages_est || 0), 0)

      setStats({
        totalContenus: contenus.length,
        deepfakesConfirmes: contenus.filter(c => c.verdict === "deepfake_confirme").length,
        manipulations: contenus.filter(c => c.verdict === "manipulation_confirmed").length,
        suspects: contenus.filter(c => c.verdict === "suspect").length,
        authentiques: contenus.filter(c => c.verdict === "authentique").length,
        campagnesActives: campagnes.filter(c => c.statut === "active").length,
        campagnesNeutralisees: campagnes.filter(c => c.statut === "neutralisee").length,
        sourcesActives: (sourcesRes.data || []).filter(s => s.actif).length,
        alertesCritiques: alertes.filter(a => a.severite === "critique").length,
        alertesEnCours: alertes.filter(a => a.statut === "en_cours").length,
        totalPartages,
        signaturesTotal: sigsRes.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const sections = stats ? [
    {
      icon: Shield,
      title: "Analyse des contenus",
      color: "purple",
      rows: [
        { label: "Total contenus analysés", value: stats.totalContenus },
        { label: "Deepfakes confirmés", value: stats.deepfakesConfirmes, critical: stats.deepfakesConfirmes > 0 },
        { label: "Manipulations confirmées", value: stats.manipulations, critical: stats.manipulations > 0 },
        { label: "Contenus suspects", value: stats.suspects },
        { label: "Contenus authentiques", value: stats.authentiques, ok: true },
      ],
    },
    {
      icon: Radio,
      title: "Campagnes de désinformation",
      color: "orange",
      rows: [
        { label: "Campagnes actives", value: stats.campagnesActives, critical: stats.campagnesActives > 0 },
        { label: "Campagnes neutralisées", value: stats.campagnesNeutralisees, ok: true },
        { label: "Partages estimés (total)", value: stats.totalPartages.toLocaleString("fr-FR") },
      ],
    },
    {
      icon: Globe,
      title: "Sources et intelligence",
      color: "yellow",
      rows: [
        { label: "Sources suspectes actives", value: stats.sourcesActives, critical: stats.sourcesActives > 0 },
        { label: "Signatures IA enregistrées", value: stats.signaturesTotal },
      ],
    },
    {
      icon: AlertOctagon,
      title: "Alertes & Incidents",
      color: "red",
      rows: [
        { label: "Alertes de niveau critique", value: stats.alertesCritiques, critical: stats.alertesCritiques > 0 },
        { label: "Alertes en cours de traitement", value: stats.alertesEnCours, critical: stats.alertesEnCours > 0 },
      ],
    },
  ] : []

  const colorMap: Record<string, string> = {
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    orange: "text-orange-400 border-orange-500/20 bg-orange-500/5",
    yellow: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
    red: "text-red-400 border-red-500/20 bg-red-500/5",
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BookOpen className="size-6 text-purple-400" /> Rapport de synthèse
          </h1>
          <p className="text-sm text-gray-400 mt-1">État de la détection — généré le {today}</p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all">
          <FileText className="size-4" /> Exporter PDF
        </button>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="size-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Résumé exécutif</h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          La plateforme CNRA AntiDeep surveille activement les contenus audiovisuels numériques circulant au Sénégal.
          {stats && ` À ce jour, ${stats.totalContenus} contenus ont été analysés, dont ${stats.deepfakesConfirmes} deepfakes confirmés et ${stats.manipulations} manipulations avérées.
          ${stats.campagnesActives > 0 ? `${stats.campagnesActives} campagne(s) de désinformation sont actuellement actives.` : "Aucune campagne active actuellement."}`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map(section => (
            <div key={section.title} className={`border rounded-2xl overflow-hidden ${colorMap[section.color]}`}>
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
                <section.icon className={`size-4 ${colorMap[section.color].split(" ")[0]}`} />
                <h2 className="text-sm font-bold text-white">{section.title}</h2>
              </div>
              <div className="divide-y divide-white/5">
                {section.rows.map(row => (
                  <div key={row.label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-400">{row.label}</span>
                    <span className={`text-sm font-black ${
                      row.critical && Number(row.value) > 0 ? "text-red-400" :
                      row.ok ? "text-green-400" : "text-white"
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center py-4 text-xs text-gray-600 border-t border-white/5">
        CNRA AntiDeep — Conseil National de Régulation de l'Audiovisuel du Sénégal • Rapport confidentiel
      </div>
    </div>
  )
}
