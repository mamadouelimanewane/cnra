"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface Parole { acteur: string; duree_secondes: number; media_nom: string | null }

export default function ComparatifPage() {
  const supabaseRef = useRef(createClient())
  const [data, setData] = useState<Parole[]>([])

  useEffect(() => {
    supabaseRef.current.from("temps_parole")
      .select("acteur,duree_secondes,medias:media_id(nom)")
      .then(r => setData((r.data ?? []).map((x: Record<string, unknown>) => ({
        acteur: x.acteur as string, duree_secondes: x.duree_secondes as number,
        media_nom: (x.medias as { nom: string } | null)?.nom ?? null
      }))))
  }, [])

  const medias = Array.from(new Set(data.map(d => d.media_nom).filter(Boolean))) as string[]
  const acteurs = Array.from(new Set(data.map(d => d.acteur))).slice(0, 6)

  // Données radar : pour chaque acteur, temps par média
  const radarData = medias.map(media => {
    const row: Record<string, string | number> = { media: media.split(" ")[0] }
    acteurs.forEach(acteur => {
      const total = data.filter(d => d.acteur === acteur && d.media_nom === media).reduce((s, d) => s + d.duree_secondes, 0)
      row[acteur.split(" ").slice(-1)[0]] = Math.round(total / 60)
    })
    return row
  })

  const COLORS = ["#1A3A6B","#C9A84C","#166534","#dc2626","#7c3aed","#0891b2"]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Analyse comparative</h1>
        <p className="text-gray-500 text-sm mt-1">Comparaison du temps de parole accordé aux acteurs politiques par média</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-6">Radar — Temps de parole par acteur et par média (min)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="media" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => [`${v} min`]} />
            <Legend />
            {acteurs.map((acteur, i) => (
              <Radar
                key={acteur}
                name={acteur.split(" ").slice(-1)[0]}
                dataKey={acteur.split(" ").slice(-1)[0]}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.15}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Table croisée */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Table croisée — Temps de parole (minutes)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Acteur</th>
                {medias.map(m => <th key={m} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{m.split(" ")[0]}</th>)}
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {acteurs.map((acteur, i) => {
                const total = data.filter(d => d.acteur === acteur).reduce((s, d) => s + d.duree_secondes, 0)
                return (
                  <tr key={acteur} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-900">{acteur}</td>
                    {medias.map(media => {
                      const sec = data.filter(d => d.acteur === acteur && d.media_nom === media).reduce((s, d) => s + d.duree_secondes, 0)
                      return <td key={media} className="px-4 py-3 text-gray-700">{sec > 0 ? `${Math.round(sec / 60)} min` : "—"}</td>
                    })}
                    <td className="px-4 py-3 font-black text-[#1A3A6B]">{Math.round(total / 60)} min</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
