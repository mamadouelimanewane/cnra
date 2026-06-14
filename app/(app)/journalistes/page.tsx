"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, Users, Award } from "lucide-react"

interface Journaliste {
  id: string; prenom: string; nom: string; email: string | null; telephone: string | null;
  poste: string | null; specialite: string | null; carte_presse: string | null; date_accreditation: string | null;
  media_nom: string | null; type_media: string | null
}

export default function JournalistesPage() {
  const supabase = createClient()
  const [journalistes, setJournalistes] = useState<Journaliste[]>([])
  const [search, setSearch] = useState("")
  const [filterSpecialite, setFilterSpecialite] = useState("tous")

  useEffect(() => {
    supabase.from("journalistes")
      .select("id,prenom,nom,email,telephone,poste,specialite,carte_presse,date_accreditation,medias:media_id(nom,type)")
      .order("nom")
      .then(r => {
        const data = (r.data ?? []).map((j: Record<string, unknown>) => ({
          ...j,
          media_nom: (j.medias as { nom: string } | null)?.nom ?? null,
          type_media: (j.medias as { type: string } | null)?.type ?? null,
        }))
        setJournalistes(data as Journaliste[])
      })
  }, [])

  const specialites = ["tous", ...Array.from(new Set(journalistes.map(j => j.specialite).filter(Boolean)))]

  const filtered = journalistes.filter(j => {
    const name = `${j.prenom} ${j.nom}`.toLowerCase()
    return name.includes(search.toLowerCase()) && (filterSpecialite === "tous" || j.specialite === filterSpecialite)
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Journalistes accrédités</h1>
          <p className="text-gray-500 text-sm mt-1">{journalistes.length} professionnels des médias dans la base CNRA</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total accrédités", value: journalistes.length },
          { label: "Avec carte presse", value: journalistes.filter(j => j.carte_presse).length },
          { label: "Spécialités", value: specialites.length - 1 },
          { label: "Médias couverts", value: new Set(journalistes.map(j => j.media_nom).filter(Boolean)).size },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-3xl font-black text-[#1A3A6B]">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]/20 focus:border-[#1A3A6B]"
            placeholder="Rechercher un journaliste…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none"
          value={filterSpecialite}
          onChange={e => setFilterSpecialite(e.target.value)}
        >
          {specialites.map(s => (
            <option key={s} value={s}>{s === "tous" ? "Toutes spécialités" : s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Journaliste", "Média", "Poste", "Spécialité", "Carte presse", "Accréditation"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(j => (
              <tr key={j.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#1A3A6B] font-bold text-xs shrink-0">
                      {j.prenom[0]}{j.nom[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{j.prenom} {j.nom}</p>
                      {j.email && <p className="text-xs text-gray-400">{j.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {j.media_nom ? (
                    <div>
                      <p className="font-medium text-gray-800">{j.media_nom}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${j.type_media === "television" ? "bg-blue-100 text-blue-700" : j.type_media === "radio" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {j.type_media === "television" ? "TV" : j.type_media === "radio" ? "Radio" : "En ligne"}
                      </span>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{j.poste ?? "—"}</td>
                <td className="px-4 py-3">
                  {j.specialite ? (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">{j.specialite}</span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {j.carte_presse ? (
                    <span className="flex items-center gap-1 text-green-700 text-xs font-bold">
                      <Award className="size-3" />
                      {j.carte_presse}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {j.date_accreditation ? new Date(j.date_accreditation).toLocaleDateString("fr-FR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
