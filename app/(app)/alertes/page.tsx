"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"

interface Alerte {
  id: string; type_alerte: string; severite: string; titre: string; description: string | null;
  date_alerte: string; statut: string; traitee_par: string | null; media_nom: string | null
}

const SEV_COLORS: Record<string, string> = { critique: "#dc2626", elevee: "#ea580c", moyenne: "#d97706", faible: "#16a34a" }
const SEV_ORDER = ["critique", "elevee", "moyenne", "faible"]

export default function AlertesPage() {
  const supabaseRef = useRef(createClient())
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [filterSev, setFilterSev] = useState("tous")
  const [filterStatut, setFilterStatut] = useState("tous")

  useEffect(() => {
    const sb = supabaseRef.current
    sb.from("alertes_monitoring")
      .select("id,type_alerte,severite,titre,description,date_alerte,statut,traitee_par,medias:media_id(nom)")
      .order("date_alerte", { ascending: false })
      .then(r => {
        setAlertes((r.data ?? []).map((x: Record<string, unknown>) => ({
          ...x, media_nom: (x.medias as { nom: string } | null)?.nom ?? null
        })) as Alerte[])
      })
  }, [])

  const filtered = alertes
    .filter(a => (filterSev === "tous" || a.severite === filterSev) && (filterStatut === "tous" || a.statut === filterStatut))
    .sort((a, b) => SEV_ORDER.indexOf(a.severite) - SEV_ORDER.indexOf(b.severite))

  const stats = {
    critique: alertes.filter(a => a.severite === "critique").length,
    elevee: alertes.filter(a => a.severite === "elevee").length,
    actives: alertes.filter(a => a.statut === "nouvelle" || a.statut === "en_cours").length,
    resolues: alertes.filter(a => a.statut === "resolue").length,
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Alertes de monitoring</h1>
        <p className="text-gray-500 text-sm mt-1">Signalements et non-conformités détectés lors de la surveillance des médias</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Critiques", value: stats.critique, color: "bg-red-50 text-red-700", icon: XCircle },
          { label: "Élevées", value: stats.elevee, color: "bg-orange-50 text-orange-700", icon: AlertTriangle },
          { label: "Actives", value: stats.actives, color: "bg-yellow-50 text-yellow-700", icon: Clock },
          { label: "Résolues", value: stats.resolues, color: "bg-green-50 text-green-700", icon: CheckCircle },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-5 ${k.color.split(" ")[0]}`}>
            <k.icon className={`size-7 mb-2 ${k.color.split(" ")[1]}`} />
            <p className={`text-3xl font-black ${k.color.split(" ")[1]}`}>{k.value}</p>
            <p className="text-sm font-medium text-gray-600">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl" value={filterSev} onChange={e => setFilterSev(e.target.value)}>
          <option value="tous">Toutes sévérités</option>
          {SEV_ORDER.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="tous">Tous statuts</option>
          {["nouvelle","en_cours","resolue","classee"].map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <div className="ml-auto text-sm text-gray-400 flex items-center">{filtered.length} alertes</div>
      </div>

      {/* Liste alertes */}
      <div className="space-y-3">
        {filtered.map(a => {
          const color = SEV_COLORS[a.severite] ?? "#6b7280"
          return (
            <div key={a.id} className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderLeftWidth: 4, borderLeftColor: color, borderColor: color + "30" }}>
              <div className="flex items-start gap-4">
                <AlertTriangle className="size-5 mt-0.5 shrink-0" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-sm">{a.titre}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize" style={{ background: color + "18", color }}>{a.severite}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.statut === "nouvelle" ? "bg-red-100 text-red-700" : a.statut === "resolue" ? "bg-green-100 text-green-700" : a.statut === "en_cours" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                      {a.statut.replace(/_/g, " ")}
                    </span>
                  </div>
                  {a.description && <p className="text-sm text-gray-500 mb-2">{a.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span className="font-medium text-gray-600">{a.media_nom}</span>
                    <span>•</span>
                    <span>{a.type_alerte.replace(/_/g, " ")}</span>
                    <span>•</span>
                    <span>{new Date(a.date_alerte).toLocaleDateString("fr-FR")}</span>
                    {a.traitee_par && <><span>•</span><span>Traité par: {a.traitee_par}</span></>}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle className="size-12 mx-auto mb-3 text-green-400" />
          <p className="font-semibold">Aucune alerte correspondant aux filtres</p>
        </div>
      )}
    </div>
  )
}
