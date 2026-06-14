"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"

interface Obs {
  thematique: string; ton: string | null; duree_minutes: number | null; media_nom: string | null; date_obs: string
}

const COLORS = ["#1A3A6B","#C9A84C","#166534","#dc2626","#7c3aed","#0891b2","#d97706","#6b7280"]

export default function ThematiquesPage() {
  const supabaseRef = useRef(createClient())
  const [obs, setObs] = useState<Obs[]>([])

  useEffect(() => {
    supabaseRef.current.from("observations_contenu")
      .select("thematique,ton,duree_minutes,date_obs,medias:media_id(nom)")
      .then(r => setObs((r.data ?? []).map((x: Record<string, unknown>) => ({
        ...x, media_nom: (x.medias as { nom: string } | null)?.nom ?? null
      })) as Obs[]))
  }, [])

  const byTheme = Object.entries(
    obs.reduce((acc, o) => { acc[o.thematique] = (acc[o.thematique] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] })).sort((a, b) => b.value - a.value)

  const byThemeDuree = Object.entries(
    obs.reduce((acc, o) => { acc[o.thematique] = (acc[o.thematique] ?? 0) + (o.duree_minutes ?? 0); return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const byMediaTheme = Array.from(new Set(obs.map(o => o.media_nom).filter(Boolean))).map(media => {
    const mediaObs = obs.filter(o => o.media_nom === media)
    const themes = Object.entries(mediaObs.reduce((acc, o) => { acc[o.thematique] = (acc[o.thematique] ?? 0) + 1; return acc }, {} as Record<string, number>))
    return { media: (media as string).split(" ")[0], ...Object.fromEntries(themes) }
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Analyse thématique</h1>
        <p className="text-gray-500 text-sm mt-1">Répartition des thèmes traités par les médias surveillés</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Fréquence thèmes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Fréquence des thèmes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byTheme} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                {byTheme.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {byTheme.map(t => (
              <div key={t.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                <span className="text-gray-600 flex-1">{t.name}</span>
                <span className="font-bold text-gray-800">{t.value} obs.</span>
              </div>
            ))}
          </div>
        </div>

        {/* Durée par thème */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Temps d&apos;antenne par thème (min)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byThemeDuree} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit=" min" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v: number) => [`${v} min`]} />
              <Bar dataKey="value" fill="#C9A84C" radius={[0, 4, 4, 0]} name="Durée (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Thèmes par média */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-5">Thèmes traités par média</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byMediaTheme}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="media" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {byTheme.map((t, i) => (
              <Bar key={t.name} dataKey={t.name} stackId="a" fill={COLORS[i % COLORS.length]} name={t.name} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">
          {byTheme.map((t, i) => (
            <div key={t.name} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-gray-600">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
