"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface Obs {
  id: string; thematique: string; ton: string | null; duree_minutes: number | null; media_nom: string | null; date_obs: string
}

const TON_COLORS: Record<string, string> = {
  neutre: "#6b7280", positif: "#16a34a", negatif: "#dc2626", critique: "#ea580c", laudatif: "#C9A84C"
}

export default function BiaisPage() {
  const supabaseRef = useRef(createClient())
  const [obs, setObs] = useState<Obs[]>([])

  useEffect(() => {
    const sb = supabaseRef.current
    sb.from("observations_contenu")
      .select("id,thematique,ton,duree_minutes,date_obs,medias:media_id(nom)")
      .order("date_obs", { ascending: false })
      .then(r => {
        setObs((r.data ?? []).map((x: Record<string, unknown>) => ({
          ...x, media_nom: (x.medias as { nom: string } | null)?.nom ?? null
        })) as Obs[])
      })
  }, [])

  // Biais par média = ratio tons négatifs/positifs
  const medias = Array.from(new Set(obs.map(o => o.media_nom).filter(Boolean))) as string[]

  const biaisData = medias.map(media => {
    const mediaObs = obs.filter(o => o.media_nom === media)
    const positif = mediaObs.filter(o => o.ton === "positif" || o.ton === "laudatif").length
    const negatif = mediaObs.filter(o => o.ton === "negatif" || o.ton === "critique").length
    const neutre = mediaObs.filter(o => o.ton === "neutre").length
    const total = mediaObs.length
    return { media: media.split(" ")[0], positif, negatif, neutre, total, score: total > 0 ? Math.round((positif - negatif) / total * 100) : 0 }
  }).sort((a, b) => b.score - a.score)

  // Tons par thématique
  const tonsParTheme = Array.from(new Set(obs.map(o => o.thematique))).map(theme => {
    const t = obs.filter(o => o.thematique === theme)
    const tonsCount = Object.fromEntries(Object.keys(TON_COLORS).map(ton => [ton, t.filter(o => o.ton === ton).length]))
    return { theme, total: t.length, ...tonsCount }
  }).sort((a, b) => b.total - a.total)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Analyse des biais éditoriaux</h1>
        <p className="text-gray-500 text-sm mt-1">Détection des déséquilibres de ton et orientations éditoriales par média</p>
      </div>

      {/* Score de biais par média */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-2">Score de biais éditorial par média</h3>
        <p className="text-xs text-gray-400 mb-5">Score positif = tendance favorable · Score négatif = tendance critique/négative · 0 = équilibré</p>
        <div className="space-y-4">
          {biaisData.map(d => (
            <div key={d.media} className="flex items-center gap-4">
              <span className="w-20 text-sm font-bold text-gray-700">{d.media}</span>
              <div className="flex-1 flex items-center gap-2">
                {/* Barre centrée */}
                <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                  {d.score > 0 ? (
                    <div className="absolute left-1/2 top-0 bottom-0 bg-green-400 rounded-r-full" style={{ width: `${Math.min(d.score, 50)}%` }} />
                  ) : (
                    <div className="absolute top-0 bottom-0 bg-red-400 rounded-l-full" style={{ right: "50%", width: `${Math.min(Math.abs(d.score), 50)}%` }} />
                  )}
                </div>
                <span className={`text-sm font-black w-12 text-right ${d.score > 0 ? "text-green-600" : d.score < 0 ? "text-red-600" : "text-gray-500"}`}>
                  {d.score > 0 ? "+" : ""}{d.score}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-600 font-bold">{d.positif}✓</span>
                <span className="text-gray-400">{d.neutre}○</span>
                <span className="text-red-600 font-bold">{d.negatif}✗</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Répartition des tons par thématique */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-5">Tons éditoriaux par thématique</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={tonsParTheme}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="theme" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {Object.entries(TON_COLORS).map(([ton, color]) => (
              <Bar key={ton} dataKey={ton} stackId="a" fill={color} name={ton} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">
          {Object.entries(TON_COLORS).map(([ton, color]) => (
            <div key={ton} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-gray-600 capitalize">{ton}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table observations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Journal des observations ({obs.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Média", "Date", "Thématique", "Ton", "Durée", "Opérateur"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {obs.map(o => {
              const color = TON_COLORS[o.ton ?? "neutre"] ?? "#6b7280"
              return (
                <tr key={o.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-[#1A3A6B]">{o.media_nom}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.date_obs).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-gray-700">{o.thematique}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize" style={{ background: color + "18", color }}>{o.ton ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o.duree_minutes ? `${o.duree_minutes} min` : "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{(o as Record<string, unknown>).operateur as string ?? "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
