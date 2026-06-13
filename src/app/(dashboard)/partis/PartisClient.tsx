"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Users } from "lucide-react"
import type { Parti } from "@/types"

const COULEURS_PRESET = [
  "#1A3A6B","#2563EB","#16A34A","#DC2626","#D97706",
  "#7C3AED","#DB2777","#0891B2","#65A30D","#EA580C",
]

export function PartisClient() {
  const [partis, setPartis] = useState<Parti[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Parti | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: "", sigle: "", couleur: "#1A3A6B" })

  const charger = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("partis").select("*").order("nom")
    setPartis(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  function ouvrirForm(parti?: Parti) {
    if (parti) {
      setEditing(parti)
      setForm({ nom: parti.nom, sigle: parti.sigle, couleur: parti.couleur })
    } else {
      setEditing(null)
      setForm({ nom: "", sigle: "", couleur: "#1A3A6B" })
    }
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      await supabase.from("partis").update(form).eq("id", editing.id)
    } else {
      await supabase.from("partis").insert(form)
    }
    setShowForm(false)
    setSaving(false)
    charger()
  }

  async function toggleActif(id: string, actif: boolean) {
    const supabase = createClient()
    await supabase.from("partis").update({ actif: !actif }).eq("id", id)
    charger()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Partis politiques</h2>
          <p className="text-sm text-gray-500 mt-0.5">{partis.filter(p => p.actif).length} actif{partis.filter(p => p.actif).length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => ouvrirForm()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] transition-colors">
          <Plus className="w-4 h-4" /> Ajouter un parti
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5">
            {editing ? "Modifier le parti" : "Nouveau parti politique"}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet *</label>
              <input type="text" required value={form.nom}
                placeholder="Ex: Parti Socialiste"
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sigle *</label>
              <input type="text" required value={form.sigle}
                placeholder="Ex: PS"
                onChange={(e) => setForm({ ...form, sigle: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Couleur du parti</label>
              <div className="flex items-center gap-3 flex-wrap">
                {COULEURS_PRESET.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, couleur: c })}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.couleur === c ? c : "transparent",
                      outline: form.couleur === c ? `3px solid ${c}40` : "none" }} />
                ))}
                <input type="color" value={form.couleur}
                  onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                  className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer" />
                <span className="text-xs text-gray-400">{form.couleur}</span>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] disabled:opacity-60">
                {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#1A3A6B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partis.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${p.couleur}20`, border: `2px solid ${p.couleur}40` }}>
                <span className="font-black text-sm" style={{ color: p.couleur }}>{p.sigle}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{p.nom}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.couleur }} />
                  <span className="text-xs text-gray-400">{p.couleur}</span>
                  {!p.actif && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactif</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => ouvrirForm(p)}
                  className="p-2 text-gray-400 hover:text-[#1A3A6B] hover:bg-blue-50 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => toggleActif(p.id, p.actif)}
                  className={`p-2 rounded-lg transition-colors text-xs font-medium ${p.actif ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                  {p.actif ? "Désactiver" : "Activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
