"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatNumber } from "@/lib/utils"
import { Zap, AlertOctagon, Clock, CheckCircle, XCircle, Activity } from "lucide-react"

type Contenu = {
  id: string
  titre: string
  type_contenu: string
  plateforme: string | null
  date_soumission: string
  statut_analyse: string
  score_deepfake: number | null
  score_manipulation: number | null
  verdict: string | null
}

const VERDICT_STYLE: Record<string, string> = {
  deepfake_confirme: "text-red-400 bg-red-500/10 border-red-500/30",
  manipulation_confirmed: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  suspect: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  authentique: "text-green-400 bg-green-500/10 border-green-500/30",
  indetermmine: "text-gray-400 bg-gray-500/10 border-gray-500/30",
}
const VERDICT_LABEL: Record<string, string> = {
  deepfake_confirme: "Deepfake",
  manipulation_confirmed: "Manipulation",
  suspect: "Suspect",
  authentique: "Authentique",
  indetermmine: "Indéterminé",
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{score}%</span>
    </div>
  )
}

export default function DetectionPage() {
  const supabaseRef = useRef(createClient())
  const [contenus, setContenus] = useState<Contenu[]>([])
  const [filter, setFilter] = useState<string>("tous")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = supabaseRef.current
    async function load() {
      const { data } = await supabase
        .from("contenus_analyses")
        .select("id,titre,type_contenu,plateforme,date_soumission,statut_analyse,score_deepfake,score_manipulation,verdict")
        .order("date_soumission", { ascending: false })
      setContenus(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === "tous" ? contenus : contenus.filter(c => c.verdict === filter || c.statut_analyse === filter)

  const tabs = [
    { key: "tous", label: "Tous", count: contenus.length },
    { key: "deepfake_confirme", label: "Deepfakes", count: contenus.filter(c => c.verdict === "deepfake_confirme").length },
    { key: "manipulation_confirmed", label: "Manipulations", count: contenus.filter(c => c.verdict === "manipulation_confirmed").length },
    { key: "suspect", label: "Suspects", count: contenus.filter(c => c.verdict === "suspect").length },
    { key: "en_attente", label: "En attente", count: contenus.filter(c => c.statut_analyse === "en_attente").length },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Zap className="size-6 text-purple-400" /> Détection live
          </h1>
          <p className="text-sm text-gray-400 mt-1">Suivi en temps réel de l'analyse des contenus suspects</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <Activity className="size-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-bold text-purple-400">{formatNumber(contenus.length)} contenus traités</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filter === t.key ? "bg-purple-500/20 text-purple-400 border-purple-500/40" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${filter === t.key ? "bg-purple-500/30" : "bg-white/10"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{c.titre}</h3>
                    {c.verdict && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase ${VERDICT_STYLE[c.verdict] || "text-gray-400 bg-gray-500/10 border-gray-500/30"}`}>
                        {VERDICT_LABEL[c.verdict] || c.verdict}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="capitalize">{c.type_contenu}</span>
                    {c.plateforme && <span>• {c.plateforme}</span>}
                    <span>• {new Date(c.date_soumission).toLocaleDateString("fr-FR")}</span>
                  </div>
                  {(c.score_deepfake !== null || c.score_manipulation !== null) && (
                    <div className="space-y-2">
                      {c.score_deepfake !== null && (
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">Score deepfake</p>
                          <ScoreBar score={c.score_deepfake} color={c.score_deepfake > 70 ? "#ef4444" : c.score_deepfake > 40 ? "#f97316" : "#22c55e"} />
                        </div>
                      )}
                      {c.score_manipulation !== null && (
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">Score manipulation</p>
                          <ScoreBar score={c.score_manipulation} color={c.score_manipulation > 70 ? "#f97316" : c.score_manipulation > 40 ? "#eab308" : "#22c55e"} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {c.statut_analyse === "termine" ? (
                    c.verdict === "authentique" ? <CheckCircle className="size-5 text-green-400" /> : <XCircle className="size-5 text-red-400" />
                  ) : c.statut_analyse === "en_cours" ? (
                    <Activity className="size-5 text-purple-400 animate-pulse" />
                  ) : (
                    <Clock className="size-5 text-gray-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertOctagon className="size-10 mx-auto mb-3 opacity-30" />
              <p>Aucun contenu dans cette catégorie</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
