"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tv, Radio, Globe, Eye } from "lucide-react"

interface Media { id: string; nom: string; type: string; statut: string; ville: string | null; nb_alertes?: number }

export default function MediasPage() {
  const supabaseRef = useRef(createClient())
  const [medias, setMedias] = useState<Media[]>([])
  const [alerteCounts, setAlerteCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const sb = supabaseRef.current
    Promise.all([
      sb.from("medias").select("id,nom,type,statut,ville").in("sigle", ["RTS1","TFM","2STV","RFM","RS","SUDFM","SENTV"]).order("nom"),
      sb.from("alertes_monitoring").select("media_id"),
    ]).then(([m, a]) => {
      setMedias((m.data ?? []) as Media[])
      const counts: Record<string, number> = {}
      ;(a.data ?? []).forEach((row: { media_id: string }) => { counts[row.media_id] = (counts[row.media_id] ?? 0) + 1 })
      setAlerteCounts(counts)
    })
  }, [])

  const TypeIcon = (type: string) => type === "television" ? Tv : type === "radio" ? Radio : Globe

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Suivi des médias</h1>
        <p className="text-gray-500 text-sm mt-1">{medias.length} médias sous surveillance CNRA MediaWatch</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {medias.map(m => {
          const Icon = TypeIcon(m.type)
          const nbAlertes = alerteCounts[m.id] ?? 0
          return (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon className="size-5 text-[#1A3A6B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{m.nom}</h3>
                    <p className="text-xs text-gray-400 capitalize">{m.type} · {m.ville ?? "Dakar"}</p>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" title="Surveillance active" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.statut === "actif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {m.statut}
                </span>
                {nbAlertes > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                    <Eye className="size-3.5" />
                    {nbAlertes} alerte{nbAlertes > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
