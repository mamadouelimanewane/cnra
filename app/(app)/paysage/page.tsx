"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tv, Radio, Globe, MapPin, Building2, Users } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts"

interface Media {
  id: string; nom: string; type: string; statut: string; ville: string | null; couverture: string | null;
  langue: string | null; groupes_media: { nom: string } | null
}

const COUVERTURE_COLORS = { nationale: "#1A3A6B", regionale: "#C9A84C", internationale: "#166534", locale: "#7c3aed" }

export default function PaysagePage() {
  const supabase = createClient()
  const [medias, setMedias] = useState<Media[]>([])

  useEffect(() => {
    supabase.from("medias")
      .select("id,nom,type,statut,ville,couverture,langue,groupes_media:groupe_id(nom)")
      .order("nom")
      .then(r => setMedias((r.data ?? []) as Media[]))
  }, [])

  const byType = [
    { name: "Télévision", count: medias.filter(m => m.type === "television").length, color: "#1A3A6B", icon: Tv },
    { name: "Radio", count: medias.filter(m => m.type === "radio").length, color: "#C9A84C", icon: Radio },
    { name: "En ligne", count: medias.filter(m => m.type === "en_ligne").length, color: "#166534", icon: Globe },
  ]

  const byCouverture = Object.entries(
    medias.reduce((acc, m) => { const k = m.couverture ?? "nc"; acc[k] = (acc[k] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value, color: (COUVERTURE_COLORS as Record<string, string>)[name] ?? "#94a3b8" }))

  const byStatut = [
    { name: "Actifs", value: medias.filter(m => m.statut === "actif").length, color: "#166534" },
    { name: "Suspendus", value: medias.filter(m => m.statut === "suspendu").length, color: "#dc2626" },
    { name: "En attente", value: medias.filter(m => m.statut === "en_attente").length, color: "#d97706" },
  ]

  const byVille = Object.entries(
    medias.reduce((acc, m) => { const k = m.ville ?? "Inconnue"; acc[k] = (acc[k] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }))

  const byLangue = Object.entries(
    medias.reduce((acc, m) => { const k = m.langue ?? "nc"; acc[k] = (acc[k] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Paysage médiatique</h1>
        <p className="text-gray-500 text-sm mt-1">Panorama structurel du paysage audiovisuel et numérique sénégalais</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-6">
        {byType.map(t => (
          <div key={t.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: t.color + "18" }}>
                <t.icon className="size-6" style={{ color: t.color }} />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900">{t.count}</p>
                <p className="text-sm text-gray-500">{t.name}</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {medias.filter(m => m.type === (t.name === "En ligne" ? "en_ligne" : t.name.toLowerCase()) && m.statut === "actif").length} actifs
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts répartition */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Par couverture</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byCouverture} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {byCouverture.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Par statut</h3>
          <div className="space-y-3 mt-6">
            {byStatut.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm text-gray-700">{s.name}</span>
                </div>
                <span className="font-bold text-gray-900">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>{medias.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Par langue</h3>
          <div className="space-y-3 mt-2">
            {byLangue.map(l => (
              <div key={l.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 capitalize">{l.name}</span>
                  <span className="font-bold text-gray-900">{l.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-2 bg-[#1A3A6B] rounded-full" style={{ width: `${(l.value / medias.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Par ville */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-5">Répartition géographique (top villes)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byVille}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Médias" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table récap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Liste complète des médias ({medias.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Nom", "Type", "Ville", "Couverture", "Langue", "Groupe", "Statut"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {medias.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-[#1A3A6B]">{m.nom}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.type === "television" ? "bg-blue-100 text-blue-700" : m.type === "radio" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {m.type === "television" ? "TV" : m.type === "radio" ? "Radio" : "En ligne"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.ville ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{m.couverture ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{m.langue ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.groupes_media?.nom ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.statut === "actif" ? "bg-green-100 text-green-700" : m.statut === "suspendu" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {m.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
