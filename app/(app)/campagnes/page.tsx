"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatNumber } from "@/lib/utils"
import { Radio, AlertTriangle, Users, Share2, Calendar } from "lucide-react"

type Campagne = {
  id: string
  nom: string
  description: string | null
  date_detection: string
  date_debut_est: string | null
  statut: string
  niveau_menace: string
  origine_suspectee: string | null
  cibles: string[] | null
  nb_contenus: number
  nb_partages_est: number
  plateformes: string[] | null
}

const MENACE_STYLE: Record<string, { card: string; badge: string }> = {
  critique: { card: "border-red-500/30 bg-red-500/5", badge: "text-red-400 bg-red-500/10 border-red-500/30" },
  eleve: { card: "border-orange-500/30 bg-orange-500/5", badge: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  moyen: { card: "border-yellow-500/20 bg-yellow-500/5", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  faible: { card: "border-green-500/20 bg-green-500/5", badge: "text-green-400 bg-green-500/10 border-green-500/20" },
}

const STATUT_STYLE: Record<string, string> = {
  active: "text-red-400 bg-red-500/10",
  contenue: "text-orange-400 bg-orange-500/10",
  neutralisee: "text-green-400 bg-green-500/10",
  surveillee: "text-yellow-400 bg-yellow-500/10",
}

export default function CampagnesPage() {
  const supabaseRef = useRef(createClient())
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("tous")

  useEffect(() => {
    const supabase = supabaseRef.current
    async function load() {
      const { data } = await supabase.from("campagnes_desinfo").select("*").order("date_detection", { ascending: false })
      setCampagnes(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === "tous" ? campagnes : campagnes.filter(c => c.statut === filter || c.niveau_menace === filter)

  const totalPartages = campagnes.reduce((sum, c) => sum + (c.nb_partages_est || 0), 0)
  const totalContenus = campagnes.reduce((sum, c) => sum + (c.nb_contenus || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Radio className="size-6 text-purple-400" /> Campagnes de désinformation
        </h1>
        <p className="text-sm text-gray-400 mt-1">{campagnes.length} campagnes identifiées et suivies</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Campagnes totales", value: campagnes.length, icon: Radio, color: "purple" },
          { label: "Actives / en cours", value: campagnes.filter(c => c.statut === "active").length, icon: AlertTriangle, color: "red" },
          { label: "Contenus associés", value: totalContenus, icon: Users, color: "orange" },
          { label: "Partages estimés", value: totalPartages, icon: Share2, color: "yellow" },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xl font-black text-white">{formatNumber(s.value)}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "tous", label: "Toutes" },
          { key: "active", label: "Actives" },
          { key: "critique", label: "Menace critique" },
          { key: "eleve", label: "Menace élevée" },
          { key: "neutralisee", label: "Neutralisées" },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filter === t.key ? "bg-purple-500/20 text-purple-400 border-purple-500/40" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)
        ) : filtered.map(c => {
          const menaceStyle = MENACE_STYLE[c.niveau_menace] || MENACE_STYLE.moyen
          return (
            <div key={c.id} className={`border rounded-2xl p-5 ${menaceStyle.card}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-black text-white">{c.nom}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase ${menaceStyle.badge}`}>
                      {c.niveau_menace}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${STATUT_STYLE[c.statut]}`}>
                      {c.statut}
                    </span>
                  </div>
                  {c.description && <p className="text-sm text-gray-400 leading-relaxed">{c.description}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Contenus</p>
                  <p className="text-sm font-bold text-white">{formatNumber(c.nb_contenus)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Partages estimés</p>
                  <p className="text-sm font-bold text-white">{formatNumber(c.nb_partages_est)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Détectée le</p>
                  <p className="text-sm font-bold text-white">{new Date(c.date_detection).toLocaleDateString("fr-FR")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Origine suspectée</p>
                  <p className="text-sm font-bold text-white">{c.origine_suspectee || "—"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {c.cibles && c.cibles.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">Cibles:</span>
                    {c.cibles.map(cible => (
                      <span key={cible} className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-300 border border-white/10 rounded-lg">{cible}</span>
                    ))}
                  </div>
                )}
                {c.plateformes && c.plateformes.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">Plateformes:</span>
                    {c.plateformes.map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <Radio className="size-10 mx-auto mb-3 opacity-30" />
            <p>Aucune campagne dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  )
}
