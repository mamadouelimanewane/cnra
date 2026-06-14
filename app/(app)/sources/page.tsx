"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Globe, AlertCircle, ExternalLink } from "lucide-react"

type Source = {
  id: string
  nom: string
  type_source: string
  url: string | null
  plateforme: string | null
  pays_origine: string | null
  niveau_confiance: number | null
  nb_contenus_signales: number
  actif: boolean
  description: string | null
  date_detection: string | null
}

const TYPE_LABEL: Record<string, string> = {
  site_web: "Site web",
  compte_social: "Compte social",
  chaine_telegram: "Chaîne Telegram",
  groupe_whatsapp: "Groupe WhatsApp",
  autre: "Autre",
}

export default function SourcesPage() {
  const supabaseRef = useRef(createClient())
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = supabaseRef.current
    async function load() {
      const { data } = await supabase.from("sources_suspectes").select("*").order("nb_contenus_signales", { ascending: false })
      setSources(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function ConfidenceBar({ value }: { value: number }) {
    const color = value < 20 ? "#ef4444" : value < 40 ? "#f97316" : value < 60 ? "#eab308" : "#22c55e"
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
        </div>
        <span className="text-xs font-bold text-white w-8 text-right">{value}%</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Globe className="size-6 text-purple-400" /> Sources suspectes
        </h1>
        <p className="text-sm text-gray-400 mt-1">{sources.length} sources identifiées dans la base de surveillance</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map(s => (
            <div key={s.id} className={`bg-white/5 border rounded-2xl p-5 ${s.actif ? "border-red-500/20" : "border-white/10 opacity-60"}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-bold text-white">{s.nom}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">
                      {TYPE_LABEL[s.type_source] || s.type_source}
                    </span>
                    {!s.actif && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-500/10 text-gray-500 border border-gray-500/20 rounded-lg">INACTIF</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {s.plateforme && <span>{s.plateforme}</span>}
                    {s.pays_origine && <span>• {s.pays_origine}</span>}
                    {s.date_detection && <span>• Détecté le {new Date(s.date_detection).toLocaleDateString("fr-FR")}</span>}
                  </div>
                  {s.description && <p className="text-sm text-gray-400 leading-relaxed mb-3">{s.description}</p>}
                  {s.niveau_confiance !== null && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1 font-bold">Indice de fiabilité (faible = dangereux)</p>
                      <ConfidenceBar value={s.niveau_confiance} />
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1 mb-2">
                    <AlertCircle className="size-4 text-red-400" />
                    <span className="text-lg font-black text-white">{s.nb_contenus_signales}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">contenus<br />signalés</p>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                      <ExternalLink className="size-3" /> Voir
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
