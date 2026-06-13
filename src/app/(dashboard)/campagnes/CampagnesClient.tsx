"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getStatutCampagneBadge } from "@/lib/utils"
import { Plus, Calendar, ChevronRight, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Campagne } from "@/types"

export function CampagnesClient() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nom: "", description: "",
    date_debut: "", date_fin: "",
    seuil_alerte_pct: 20,
  })

  const charger = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("campagnes").select("*").order("date_debut", { ascending: false })
    setCampagnes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Déterminer statut
    const today = new Date().toISOString().split("T")[0]
    let statut: Campagne["statut"] = "a_venir"
    if (form.date_debut <= today && form.date_fin >= today) statut = "en_cours"
    else if (form.date_fin < today) statut = "terminee"

    const supabase = createClient()
    await supabase.from("campagnes").insert({ ...form, statut })
    setShowForm(false)
    setForm({ nom: "", description: "", date_debut: "", date_fin: "", seuil_alerte_pct: 20 })
    setSaving(false)
    charger()
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette campagne et toutes ses données ?")) return
    const supabase = createClient()
    await supabase.from("campagnes").delete().eq("id", id)
    charger()
  }

  async function changerStatut(id: string, statut: Campagne["statut"]) {
    const supabase = createClient()
    await supabase.from("campagnes").update({ statut }).eq("id", id)
    charger()
  }

  const badge = getStatutCampagneBadge

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Campagnes électorales</h2>
          <p className="text-sm text-gray-500 mt-0.5">{campagnes.length} campagne{campagnes.length > 1 ? "s" : ""} enregistrée{campagnes.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle campagne
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1A3A6B]" />
            Créer une campagne électorale
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom de la campagne *</label>
              <input type="text" required value={form.nom}
                placeholder="Ex: Élections législatives 2026"
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea value={form.description} rows={2}
                placeholder="Description optionnelle…"
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date de début *</label>
              <input type="date" required value={form.date_debut}
                onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date de fin *</label>
              <input type="date" required value={form.date_fin}
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Seuil d'alerte (%) *
              </label>
              <input type="number" min={1} max={100} required value={form.seuil_alerte_pct}
                onChange={(e) => setForm({ ...form, seuil_alerte_pct: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
              <p className="text-xs text-gray-400 mt-1">Une alerte est créée si l'écart entre partis dépasse ce seuil sur un même média.</p>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] disabled:opacity-60">
                {saving ? "Enregistrement…" : "Créer la campagne"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#1A3A6B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campagnes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">Aucune campagne</h3>
          <p className="text-sm text-gray-400">Créez votre première campagne électorale.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campagnes.map((c) => {
            const b = badge(c.statut)
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-[#1A3A6B]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{c.nom}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${b.class}`}>{b.label}</span>
                      </div>
                      {c.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{c.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>📅 {new Date(c.date_debut).toLocaleDateString("fr-SN")} → {new Date(c.date_fin).toLocaleDateString("fr-SN")}</span>
                        <span>⚠️ Seuil : {c.seuil_alerte_pct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.statut !== "en_cours" && (
                      <button onClick={() => changerStatut(c.id, "en_cours")}
                        className="px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                        Activer
                      </button>
                    )}
                    {c.statut === "en_cours" && (
                      <button onClick={() => changerStatut(c.id, "terminee")}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Clôturer
                      </button>
                    )}
                    <Link href={`/campagnes/${c.id}`}
                      className="p-1.5 text-gray-400 hover:text-[#1A3A6B] hover:bg-blue-50 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
