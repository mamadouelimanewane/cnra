"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileSearch, Search, ExternalLink } from "lucide-react"

type Contenu = {
  id: string
  titre: string
  type_contenu: string
  plateforme: string | null
  date_publication: string | null
  date_soumission: string
  statut_analyse: string
  score_deepfake: number | null
  score_manipulation: number | null
  verdict: string | null
  soumis_par: string | null
  description: string | null
  url_source: string | null
  tags: string[] | null
}

const VERDICT_STYLE: Record<string, string> = {
  deepfake_confirme: "text-red-400 bg-red-500/10 border-red-500/30",
  manipulation_confirmed: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  suspect: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  authentique: "text-green-400 bg-green-500/10 border-green-500/30",
  indetermmine: "text-gray-400 bg-gray-500/10 border-gray-500/30",
}
const VERDICT_LABEL: Record<string, string> = {
  deepfake_confirme: "Deepfake confirmé",
  manipulation_confirmed: "Manipulation confirmée",
  suspect: "Suspect",
  authentique: "Authentique",
  indetermmine: "Indéterminé",
}

export default function ContenusPage() {
  const supabaseRef = useRef(createClient())
  const [contenus, setContenus] = useState<Contenu[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [verdictFilter, setVerdictFilter] = useState("tous")
  const [selected, setSelected] = useState<Contenu | null>(null)

  useEffect(() => {
    const supabase = supabaseRef.current
    async function load() {
      const { data } = await supabase.from("contenus_analyses").select("*").order("date_soumission", { ascending: false })
      setContenus(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = contenus.filter(c => {
    const matchSearch = !search || c.titre.toLowerCase().includes(search.toLowerCase()) || (c.plateforme || "").toLowerCase().includes(search.toLowerCase())
    const matchVerdict = verdictFilter === "tous" || c.verdict === verdictFilter
    return matchSearch && matchVerdict
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <FileSearch className="size-6 text-purple-400" /> Contenus analysés
        </h1>
        <p className="text-sm text-gray-400 mt-1">{contenus.length} contenus dans la base d'analyse</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
        </div>
        <select value={verdictFilter} onChange={e => setVerdictFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
          <option value="tous">Tous les verdicts</option>
          <option value="deepfake_confirme">Deepfake confirmé</option>
          <option value="manipulation_confirmed">Manipulation confirmée</option>
          <option value="suspect">Suspect</option>
          <option value="authentique">Authentique</option>
        </select>
      </div>

      <div className="flex gap-4">
        <div className={`flex-1 space-y-2 ${selected ? "max-h-[calc(100vh-14rem)] overflow-y-auto pr-2" : ""}`}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)
          ) : filtered.map(c => (
            <button key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className={`w-full text-left bg-white/5 border rounded-2xl p-4 hover:border-purple-500/30 transition-all ${selected?.id === c.id ? "border-purple-500/50 bg-purple-500/5" : "border-white/10"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate">{c.titre}</p>
                    {c.verdict && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase ${VERDICT_STYLE[c.verdict]}`}>
                        {VERDICT_LABEL[c.verdict]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="capitalize">{c.type_contenu}</span>
                    {c.plateforme && <span>• {c.plateforme}</span>}
                    <span>• {new Date(c.date_soumission).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                {(c.score_deepfake !== null) && (
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${c.score_deepfake > 70 ? "text-red-400" : c.score_deepfake > 40 ? "text-orange-400" : "text-green-400"}`}>
                      {c.score_deepfake}%
                    </p>
                    <p className="text-[10px] text-gray-500">deepfake</p>
                  </div>
                )}
              </div>
            </button>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <FileSearch className="size-10 mx-auto mb-3 opacity-30" />
              <p>Aucun contenu trouvé</p>
            </div>
          )}
        </div>

        {selected && (
          <div className="w-80 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 self-start sticky top-0 space-y-4">
            <div className="flex items-start gap-2">
              <h3 className="text-sm font-bold text-white flex-1 leading-tight">{selected.titre}</h3>
              {selected.url_source && (
                <a href={selected.url_source} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>

            {selected.verdict && (
              <div className={`inline-flex px-3 py-1.5 rounded-xl border text-xs font-bold uppercase ${VERDICT_STYLE[selected.verdict]}`}>
                {VERDICT_LABEL[selected.verdict]}
              </div>
            )}

            <div className="space-y-2 text-xs">
              {[
                { label: "Type", value: selected.type_contenu },
                { label: "Plateforme", value: selected.plateforme },
                { label: "Statut", value: selected.statut_analyse },
                { label: "Soumis par", value: selected.soumis_par },
                { label: "Date publication", value: selected.date_publication ? new Date(selected.date_publication).toLocaleDateString("fr-FR") : null },
                { label: "Date soumission", value: new Date(selected.date_soumission).toLocaleDateString("fr-FR") },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="text-gray-300 capitalize">{r.value}</span>
                </div>
              ))}
            </div>

            {(selected.score_deepfake !== null || selected.score_manipulation !== null) && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                {selected.score_deepfake !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Score deepfake</span>
                      <span className="font-bold text-white">{selected.score_deepfake}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${selected.score_deepfake}%` }} />
                    </div>
                  </div>
                )}
                {selected.score_manipulation !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Score manipulation</span>
                      <span className="font-bold text-white">{selected.score_manipulation}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${selected.score_manipulation}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected.description && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-1 font-bold">Description</p>
                <p className="text-xs text-gray-400 leading-relaxed">{selected.description}</p>
              </div>
            )}

            {selected.tags && selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
