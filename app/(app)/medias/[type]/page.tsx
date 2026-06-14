"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Search, Filter, MapPin, Users, ExternalLink } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface Media {
  id: string; nom: string; type: string; statut: string; ville: string | null; couverture: string | null;
  langue: string | null; frequence: string | null; site_web: string | null; description: string | null;
  audience_estimee: number | null; numero_agrement: string | null; date_creation: string | null;
  groupes_media: { nom: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  television: "Télévisions", radio: "Radios", en_ligne: "Médias en ligne"
}

export default function MediaTypeListPage() {
  const { type } = useParams<{ type: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [medias, setMedias] = useState<Media[]>([])
  const [search, setSearch] = useState("")
  const [filterCouverture, setFilterCouverture] = useState("tous")
  const [filterStatut, setFilterStatut] = useState("tous")

  useEffect(() => {
    supabase.from("medias")
      .select("id,nom,type,statut,ville,couverture,langue,frequence,site_web,description,audience_estimee,numero_agrement,date_creation,groupes_media:groupe_id(nom)")
      .eq("type", type)
      .order("nom")
      .then(r => setMedias((r.data ?? []) as Media[]))
  }, [type])

  const filtered = medias.filter(m => {
    const matchSearch = m.nom.toLowerCase().includes(search.toLowerCase()) || (m.ville ?? "").toLowerCase().includes(search.toLowerCase())
    const matchCouv = filterCouverture === "tous" || m.couverture === filterCouverture
    const matchStat = filterStatut === "tous" || m.statut === filterStatut
    return matchSearch && matchCouv && matchStat
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{TYPE_LABELS[type] ?? type}</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} résultats sur {medias.length} enregistrés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]/20 focus:border-[#1A3A6B]"
            placeholder="Rechercher par nom, ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
          value={filterCouverture}
          onChange={e => setFilterCouverture(e.target.value)}
        >
          <option value="tous">Toute couverture</option>
          <option value="nationale">Nationale</option>
          <option value="regionale">Régionale</option>
          <option value="internationale">Internationale</option>
          <option value="locale">Locale</option>
        </select>
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
        >
          <option value="tous">Tous statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="en_attente">En attente</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(m => (
          <div
            key={m.id}
            onClick={() => router.push(`/medias/fiche/${m.id}`)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#1A3A6B]/20 cursor-pointer transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 group-hover:text-[#1A3A6B] transition-colors truncate">{m.nom}</h3>
                {m.groupes_media && (
                  <p className="text-xs text-gray-400 mt-0.5">{m.groupes_media.nom}</p>
                )}
              </div>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${m.statut === "actif" ? "bg-green-100 text-green-700" : m.statut === "suspendu" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                {m.statut}
              </span>
            </div>

            <div className="space-y-1.5 text-sm text-gray-500">
              {m.ville && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>{m.ville}</span>
                </div>
              )}
              {m.couverture && (
                <div className="flex items-center gap-2">
                  <Filter className="size-3.5 shrink-0" />
                  <span className="capitalize">{m.couverture}</span>
                </div>
              )}
              {m.audience_estimee && (
                <div className="flex items-center gap-2">
                  <Users className="size-3.5 shrink-0" />
                  <span>{formatNumber(m.audience_estimee)} audience est.</span>
                </div>
              )}
              {m.frequence && (
                <div className="flex items-center gap-2 text-[#C9A84C] font-semibold">
                  <span className="text-xs">FM {m.frequence} MHz</span>
                </div>
              )}
            </div>

            {m.numero_agrement && (
              <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                Agrément: {m.numero_agrement}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-semibold">Aucun média trouvé</p>
          <p className="text-sm">Modifiez vos filtres ou vérifiez la migration SQL</p>
        </div>
      )}
    </div>
  )
}
