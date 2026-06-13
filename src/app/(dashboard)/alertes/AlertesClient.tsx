"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getNiveauAlerteColor } from "@/lib/utils"
import { AlertCircle, AlertTriangle, Info, CheckCircle, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Alerte } from "@/types"

const ICONES = { critique: AlertCircle, avertissement: AlertTriangle, info: Info }
const LABELS_STATUT = { non_lue: "Non traitée", en_cours: "En cours", resolue: "Résolue" }

export function AlertesClient() {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState<string>("non_lue")
  const [filtreNiveau, setFiltreNiveau] = useState<string>("")

  const charger = useCallback(async () => {
    const supabase = createClient()
    let q = supabase
      .from("alertes")
      .select("*, media:medias(id,nom,type), parti:partis(id,nom,sigle,couleur), campagne:campagnes(id,nom)")
      .order("created_at", { ascending: false })

    if (filtreStatut) q = q.eq("statut", filtreStatut)
    if (filtreNiveau) q = q.eq("niveau", filtreNiveau)

    const { data } = await q
    setAlertes((data as Alerte[]) ?? [])
    setLoading(false)
  }, [filtreStatut, filtreNiveau])

  useEffect(() => { charger() }, [charger])

  async function changerStatut(id: string, statut: string) {
    const supabase = createClient()
    await supabase.from("alertes").update({
      statut,
      resolue_at: statut === "resolue" ? new Date().toISOString() : null,
    }).eq("id", id)
    charger()
  }

  const counts = { non_lue: 0, en_cours: 0, resolue: 0 }
  alertes.forEach((a) => { counts[a.statut as keyof typeof counts]++ })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Alertes de déséquilibre</h2>
        <p className="text-sm text-gray-500 mt-0.5">Déséquilibres détectés automatiquement après chaque saisie</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
          {(["", "non_lue", "en_cours", "resolue"] as const).map((s) => (
            <button key={s} onClick={() => setFiltreStatut(s)}
              className={cn(
                "px-3 py-2 text-xs font-medium transition-colors",
                filtreStatut === s ? "bg-[#1A3A6B] text-white" : "text-gray-600 hover:bg-gray-50"
              )}>
              {s === "" ? "Toutes" : LABELS_STATUT[s]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filtreNiveau} onChange={(e) => setFiltreNiveau(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
            <option value="">Tous niveaux</option>
            <option value="critique">Critique</option>
            <option value="avertissement">Avertissement</option>
            <option value="info">Information</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#1A3A6B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alertes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-500" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">Aucune alerte</h3>
          <p className="text-sm text-gray-400">Tous les médias respectent les seuils d'équilibre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte) => {
            const Icon = ICONES[alerte.niveau] ?? Info
            const colorClass = getNiveauAlerteColor(alerte.niveau)
            return (
              <div key={alerte.id} className={cn(
                "bg-white rounded-xl border p-5 shadow-sm",
                alerte.statut === "resolue" ? "opacity-60" : ""
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn("p-2.5 rounded-xl border", colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{alerte.message}</p>
                        {alerte.details && (
                          <p className="text-sm text-gray-500 mt-1">{alerte.details}</p>
                        )}
                      </div>
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full shrink-0 border", colorClass)}>
                        {alerte.niveau.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                      {alerte.campagne && <span>🗳️ {alerte.campagne.nom}</span>}
                      {alerte.media && <span>📡 {alerte.media.nom}</span>}
                      {alerte.parti && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alerte.parti.couleur }} />
                          {alerte.parti.nom}
                        </span>
                      )}
                      <span>🕒 {new Date(alerte.created_at).toLocaleString("fr-SN")}</span>
                    </div>
                  </div>
                </div>
                {alerte.statut !== "resolue" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    {alerte.statut === "non_lue" && (
                      <button onClick={() => changerStatut(alerte.id, "en_cours")}
                        className="px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors">
                        Marquer en cours
                      </button>
                    )}
                    <button onClick={() => changerStatut(alerte.id, "resolue")}
                      className="px-3 py-1.5 text-xs font-medium border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Marquer résolue
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
