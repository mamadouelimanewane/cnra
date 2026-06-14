"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tv, Radio, Globe, Search, CheckCircle, XCircle } from "lucide-react"

interface Media { id: string; nom: string; sigle: string | null; type: string; statut: string; region: string | null; langue: string }

const TYPE_ICON = { television: Tv, radio: Radio, en_ligne: Globe }
const TYPE_LABEL = { television: "Télévision", radio: "Radio", en_ligne: "En ligne" }

export default function MediasPage() {
  const supabase = createClient()
  const [medias, setMedias] = useState<Media[]>([])
  const [search, setSearch] = useState("")
  const [type, setType] = useState("tous")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from("medias").select("*").order("nom").then(({ data }) => {
      setMedias((data ?? []) as Media[])
      setLoading(false)
    })
  }, [])

  const filtered = medias.filter(m => {
    const matchSearch = !search || m.nom.toLowerCase().includes(search.toLowerCase()) || (m.sigle ?? "").toLowerCase().includes(search.toLowerCase())
    const matchType = type === "tous" || m.type === type
    return matchSearch && matchType
  })

  const stats = { tv: medias.filter(m => m.type === "television").length, radio: medias.filter(m => m.type === "radio").length, online: medias.filter(m => m.type === "en_ligne").length, actifs: medias.filter(m => m.statut === "actif").length }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#1A3A6B] mb-2">Médias agréés au Sénégal</h1>
        <p className="text-gray-500">Liste officielle des médias audiovisuels sous régulation du CNRA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Télévisions", value: stats.tv, Icon: Tv, color: "bg-blue-50 text-[#1A3A6B]" },
          { label: "Radios", value: stats.radio, Icon: Radio, color: "bg-purple-50 text-purple-700" },
          { label: "En ligne", value: stats.online, Icon: Globe, color: "bg-green-50 text-green-700" },
          { label: "Actifs", value: stats.actifs, Icon: CheckCircle, color: "bg-emerald-50 text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color.split(" ")[0]}`}>
            <s.Icon className={`size-6 mb-2 ${s.color.split(" ")[1]}`} />
            <p className={`text-3xl font-black ${s.color.split(" ")[1]}`}>{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un média…"
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white" />
        </div>
        <div className="flex gap-2">
          {[["tous", "Tous"], ["television", "Télévision"], ["radio", "Radio"], ["en_ligne", "En ligne"]].map(([v, l]) => (
            <button key={v} onClick={() => setType(v)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${type === v ? "bg-[#1A3A6B] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#1A3A6B]"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Grille médias */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(m => {
            const Icon = TYPE_ICON[m.type as keyof typeof TYPE_ICON] ?? Globe
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    m.type === "television" ? "bg-blue-100" : m.type === "radio" ? "bg-purple-100" : "bg-green-100"
                  }`}>
                    <Icon className={`size-5 ${m.type === "television" ? "text-[#1A3A6B]" : m.type === "radio" ? "text-purple-700" : "text-green-700"}`} />
                  </div>
                  {m.statut === "actif"
                    ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="size-3" />Actif</span>
                    : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle className="size-3" />{m.statut}</span>
                  }
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{m.nom}</h3>
                {m.sigle && <p className="text-xs font-mono text-gray-400 mb-2">{m.sigle}</p>}
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">{TYPE_LABEL[m.type as keyof typeof TYPE_LABEL]}</p>
                  {m.region && <p className="text-xs text-gray-400">📍 {m.region}</p>}
                  <p className="text-xs text-gray-400">🌐 {m.langue}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucun média correspondant à votre recherche</div>
      )}
    </div>
  )
}
