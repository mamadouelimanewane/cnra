"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Building2, Globe, Tv, Radio, Users } from "lucide-react"

interface Groupe {
  id: string; nom: string; type_groupe: string; description: string | null; pays_origine: string | null;
  annee_creation: number | null; proprietaire: string | null; site_web: string | null
}
interface MediaCount { groupe_id: string; count: number }

const TYPE_COLORS: Record<string, string> = {
  public: "#1A3A6B", prive: "#C9A84C", communautaire: "#166534", religieux: "#7c3aed", diaspora: "#0891b2"
}

export default function GroupesPage() {
  const supabase = createClient()
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([
      supabase.from("groupes_media").select("*").order("nom"),
      supabase.from("medias").select("groupe_id").not("groupe_id", "is", null),
    ]).then(([g, m]) => {
      setGroupes((g.data ?? []) as Groupe[])
      const c: Record<string, number> = {}
      ;(m.data ?? []).forEach((row: { groupe_id: string }) => { c[row.groupe_id] = (c[row.groupe_id] ?? 0) + 1 })
      setCounts(c)
    })
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Groupes médias</h1>
        <p className="text-gray-500 text-sm mt-1">{groupes.length} conglomérats et groupes de presse recensés</p>
      </div>

      {/* Légende types */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: color + "18", color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="capitalize">{type}</span>
            <span className="ml-1">{groupes.filter(g => g.type_groupe === type).length}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        {groupes.map(g => {
          const color = TYPE_COLORS[g.type_groupe] ?? "#6b7280"
          const nbMedias = counts[g.id] ?? 0
          return (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
                  <Building2 className="size-6" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 truncate">{g.nom}</h3>
                  <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: color + "18", color }}>
                    {g.type_groupe}
                  </span>
                </div>
              </div>

              {g.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{g.description}</p>
              )}

              <div className="space-y-1.5 text-sm text-gray-500">
                {g.pays_origine && (
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5" />
                    <span>{g.pays_origine}</span>
                  </div>
                )}
                {g.proprietaire && (
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5" />
                    <span>{g.proprietaire}</span>
                  </div>
                )}
                {g.annee_creation && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Fondé en {g.annee_creation}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Tv className="size-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{nbMedias} média{nbMedias > 1 ? "s" : ""}</span>
                </div>
                {g.site_web && (
                  <a href={g.site_web} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1A3A6B] hover:underline" onClick={e => e.stopPropagation()}>
                    Site web →
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
