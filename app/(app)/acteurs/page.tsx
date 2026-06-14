"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Clock } from "lucide-react"

interface ActeurStats { acteur: string; parti: string | null; type_acteur: string; total_sec: number; nb_interventions: number; nb_medias: number }

const TYPE_COLORS: Record<string, string> = {
  politique: "#1A3A6B", gouvernement: "#C9A84C", opposition: "#dc2626", societe_civile: "#166534", expert: "#7c3aed"
}

export default function ActeursPage() {
  const supabaseRef = useRef(createClient())
  const [acteurs, setActeurs] = useState<ActeurStats[]>([])

  useEffect(() => {
    supabaseRef.current.from("temps_parole")
      .select("acteur,parti,type_acteur,duree_secondes,media_id")
      .then(r => {
        const acc: Record<string, { parti: string | null; type: string; total: number; interventions: number; medias: Set<string> }> = {}
        ;(r.data ?? []).forEach((row: { acteur: string; parti: string | null; type_acteur: string; duree_secondes: number; media_id: string }) => {
          if (!acc[row.acteur]) acc[row.acteur] = { parti: row.parti, type: row.type_acteur, total: 0, interventions: 0, medias: new Set() }
          acc[row.acteur].total += row.duree_secondes
          acc[row.acteur].interventions++
          acc[row.acteur].medias.add(row.media_id)
        })
        setActeurs(Object.entries(acc).map(([acteur, v]) => ({
          acteur, parti: v.parti, type_acteur: v.type, total_sec: v.total, nb_interventions: v.interventions, nb_medias: v.medias.size
        })).sort((a, b) => b.total_sec - a.total_sec))
      })
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Acteurs politiques suivis</h1>
        <p className="text-gray-500 text-sm mt-1">{acteurs.length} personnalités monitorées — classement par temps de parole cumulé</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Rang","Acteur","Parti","Catégorie","Temps total","Interventions","Médias couverts"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {acteurs.map((a, i) => {
              const color = TYPE_COLORS[a.type_acteur] ?? "#6b7280"
              const minutes = Math.round(a.total_sec / 60)
              return (
                <tr key={a.acteur} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <span className={`font-black text-lg ${i === 0 ? "text-[#C9A84C]" : i === 1 ? "text-gray-500" : i === 2 ? "text-amber-600" : "text-gray-300"}`}>#{i+1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: color }}>
                        {a.acteur.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-bold text-gray-900">{a.acteur}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{a.parti ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize" style={{ background: color + "18", color }}>
                      {a.type_acteur.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-gray-400" />
                      <span className="font-bold text-[#1A3A6B]">{minutes} min</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{a.nb_interventions}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{a.nb_medias}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
