"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Zap, Eye, AlertTriangle, Clock, Activity } from "lucide-react"

interface LiveAlerte { id: string; severite: string; titre: string; media_nom: string | null; date_alerte: string }
interface LiveObs { id: string; thematique: string; ton: string | null; media_nom: string | null; date_obs: string; heure_obs: string | null }

const SEV_COLORS: Record<string, string> = { critique: "#dc2626", elevee: "#ea580c", moyenne: "#d97706", faible: "#16a34a" }

export default function RealtimePage() {
  const supabaseRef = useRef(createClient())
  const [alertes, setAlertes] = useState<LiveAlerte[]>([])
  const [observations, setObservations] = useState<LiveObs[]>([])
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const sb = supabaseRef.current

    async function loadData() {
      const [a, o] = await Promise.all([
        sb.from("alertes_monitoring")
          .select("id,severite,titre,date_alerte,medias:media_id(nom)")
          .order("date_alerte", { ascending: false }).limit(10),
        sb.from("observations_contenu")
          .select("id,thematique,ton,date_obs,heure_obs,medias:media_id(nom)")
          .order("date_obs", { ascending: false }).order("heure_obs", { ascending: false }).limit(8),
      ])
      setAlertes((a.data ?? []).map((x: Record<string, unknown>) => ({ ...x, media_nom: (x.medias as { nom: string } | null)?.nom ?? null })) as LiveAlerte[])
      setObservations((o.data ?? []).map((x: Record<string, unknown>) => ({ ...x, media_nom: (x.medias as { nom: string } | null)?.nom ?? null })) as LiveObs[])
      setLastUpdate(new Date())
      setPulse(true)
      setTimeout(() => setPulse(false), 500)
    }

    loadData()

    // Realtime subscriptions
    const alerteSub = sb.channel("alertes_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "alertes_monitoring" }, () => loadData())
      .subscribe()

    const obsSub = sb.channel("obs_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "observations_contenu" }, () => loadData())
      .subscribe()

    return () => { alerteSub.unsubscribe(); obsSub.unsubscribe() }
  }, [])

  const alertesCritiques = alertes.filter(a => a.severite === "critique" || a.severite === "elevee")

  return (
    <div className="p-8 space-y-6">
      {/* Header live */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Zap className="size-7 text-red-500" />
            Surveillance temps réel
          </h1>
          <p className="text-gray-500 text-sm mt-1">Flux live des alertes et observations — mise à jour automatique</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${pulse ? "bg-red-100 border-red-300" : "bg-red-50 border-red-100"}`}>
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-red-700">EN DIRECT</span>
          <span className="text-xs text-red-400 ml-2">{lastUpdate.toLocaleTimeString("fr-FR")}</span>
        </div>
      </div>

      {/* Compteurs live */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Alertes totales", value: alertes.length, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
          { label: "Critiques/Élevées", value: alertesCritiques.length, icon: Zap, color: "text-orange-600 bg-orange-50" },
          { label: "Observations", value: observations.length, icon: Eye, color: "text-blue-600 bg-blue-50" },
          { label: "Mis à jour", value: lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), icon: Activity, color: "text-green-600 bg-green-50" },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 ${k.color.split(" ")[1]}`}>
            <k.icon className={`size-6 mb-2 ${k.color.split(" ")[0]}`} />
            <p className={`text-2xl font-black ${k.color.split(" ")[0]}`}>{k.value}</p>
            <p className="text-sm text-gray-600">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Flux alertes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-bold text-gray-900">Flux alertes</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {alertes.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/50">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: SEV_COLORS[a.severite] ?? "#6b7280" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{a.titre}</p>
                  <p className="text-xs text-gray-400">{a.media_nom} · {new Date(a.date_alerte).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded capitalize shrink-0" style={{ background: (SEV_COLORS[a.severite] ?? "#6b7280") + "20", color: SEV_COLORS[a.severite] }}>
                  {a.severite}
                </span>
              </div>
            ))}
            {alertes.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">Aucune alerte</div>}
          </div>
        </div>

        {/* Flux observations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="font-bold text-gray-900">Dernières observations</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {observations.map(o => (
              <div key={o.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/50">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-[#1A3A6B]">
                  {o.heure_obs?.slice(0, 5) ?? "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{o.thematique}</p>
                  <p className="text-xs text-gray-400">{o.media_nom} · {new Date(o.date_obs).toLocaleDateString("fr-FR")}</p>
                </div>
                {o.ton && (
                  <span className="text-xs text-gray-500 capitalize">{o.ton}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Médias sous surveillance */}
      <div className="bg-gradient-to-br from-[#0f1f3d] to-[#1A3A6B] rounded-2xl p-6 text-white">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Eye className="size-5 text-[#C9A84C]" />
          Médias sous surveillance active
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {["RTS 1", "TFM", "2STV", "RFM Radio", "Sud FM", "Sen TV"].map(m => (
            <div key={m} className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold text-blue-100">{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
