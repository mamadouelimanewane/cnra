"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Calendar, CheckCircle, Clock, Archive } from "lucide-react"

interface Rapport {
  id: string; titre: string; periode_debut: string; periode_fin: string; type_rapport: string;
  statut: string; redacteur: string | null; resume: string | null; created_at: string
}

const TYPE_COLORS: Record<string, string> = { quotidien: "#1A3A6B", hebdomadaire: "#C9A84C", mensuel: "#166534", special: "#dc2626" }

export default function RapportsPage() {
  const supabaseRef = useRef(createClient())
  const [rapports, setRapports] = useState<Rapport[]>([])

  useEffect(() => {
    supabaseRef.current.from("rapports_veille").select("*").order("created_at", { ascending: false })
      .then(r => setRapports((r.data ?? []) as Rapport[]))
  }, [])

  const stats = {
    total: rapports.length,
    publies: rapports.filter(r => r.statut === "publie").length,
    brouillons: rapports.filter(r => r.statut === "brouillon").length,
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Rapports de veille</h1>
          <p className="text-gray-500 text-sm mt-1">Rapports périodiques de surveillance des contenus audiovisuels</p>
        </div>
        <button className="bg-[#1A3A6B] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#0f2550] transition-colors">
          + Nouveau rapport
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total rapports", value: stats.total, icon: FileText, color: "bg-blue-50 text-[#1A3A6B]" },
          { label: "Publiés", value: stats.publies, icon: CheckCircle, color: "bg-green-50 text-green-700" },
          { label: "En brouillon", value: stats.brouillons, icon: Clock, color: "bg-yellow-50 text-yellow-700" },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 ${k.color.split(" ")[0]}`}>
            <k.icon className={`size-7 mb-2 ${k.color.split(" ")[1]}`} />
            <p className={`text-3xl font-black ${k.color.split(" ")[1]}`}>{k.value}</p>
            <p className="text-sm font-medium text-gray-600">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Grille rapports */}
      <div className="space-y-4">
        {rapports.map(r => {
          const typeColor = TYPE_COLORS[r.type_rapport] ?? "#6b7280"
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: typeColor + "18" }}>
                  <FileText className="size-6" style={{ color: typeColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-gray-900">{r.titre}</h3>
                    <div className="flex gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize" style={{ background: typeColor + "18", color: typeColor }}>
                        {r.type_rapport}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${r.statut === "publie" ? "bg-green-100 text-green-700" : r.statut === "brouillon" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                        {r.statut}
                      </span>
                    </div>
                  </div>
                  {r.resume && <p className="text-sm text-gray-500 mt-1">{r.resume}</p>}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(r.periode_debut).toLocaleDateString("fr-FR")} → {new Date(r.periode_fin).toLocaleDateString("fr-FR")}
                    </span>
                    {r.redacteur && <span>Rédigé par: <span className="font-medium text-gray-600">{r.redacteur}</span></span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {rapports.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Archive className="size-12 mx-auto mb-3" />
          <p className="font-semibold">Aucun rapport — exécutez la migration SQL 004</p>
        </div>
      )}
    </div>
  )
}
