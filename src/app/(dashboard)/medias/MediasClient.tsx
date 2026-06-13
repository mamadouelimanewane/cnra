"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Plus, Radio, Tv, Globe, Pencil } from "lucide-react"
import type { Media, TypeMedia, StatutMedia } from "@/types"

const TYPE_ICON = { television: Tv, radio: Radio, en_ligne: Globe }
const TYPE_LABELS = { television: "Télévision", radio: "Radio", en_ligne: "En ligne" }
const TYPE_COLORS = {
  television: "bg-purple-50 text-purple-700 border-purple-200",
  radio:      "bg-blue-50 text-blue-700 border-blue-200",
  en_ligne:   "bg-green-50 text-green-700 border-green-200",
}
const STATUT_COLORS: Record<StatutMedia, string> = {
  actif:    "bg-green-100 text-green-700",
  suspendu: "bg-amber-100 text-amber-700",
  retire:   "bg-red-100 text-red-600",
}

export function MediasClient() {
  const [medias, setMedias] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Media | null>(null)
  const [saving, setSaving] = useState(false)
  const [filtreType, setFiltreType] = useState<string>("")
  const [form, setForm] = useState({
    nom: "", sigle: "", type: "television" as TypeMedia,
    statut: "actif" as StatutMedia, region: "", langue: "Français",
  })

  const charger = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("medias").select("*").order("nom")
    setMedias(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  function ouvrirForm(media?: Media) {
    if (media) {
      setEditing(media)
      setForm({ nom: media.nom, sigle: media.sigle ?? "", type: media.type, statut: media.statut, region: media.region ?? "", langue: media.langue })
    } else {
      setEditing(null)
      setForm({ nom: "", sigle: "", type: "television", statut: "actif", region: "", langue: "Français" })
    }
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      await supabase.from("medias").update(form).eq("id", editing.id)
    } else {
      await supabase.from("medias").insert(form)
    }
    setShowForm(false)
    setSaving(false)
    charger()
  }

  const filtered = filtreType ? medias.filter((m) => m.type === filtreType) : medias

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Médias régulés</h2>
          <p className="text-sm text-gray-500 mt-0.5">{medias.filter(m => m.statut === "actif").length} médias actifs</p>
        </div>
        <button onClick={() => ouvrirForm()}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] transition-colors">
          <Plus className="w-4 h-4" /> Ajouter un média
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5">{editing ? "Modifier le média" : "Nouveau média"}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom *</label>
              <input type="text" required value={form.nom} placeholder="Ex: RTS 1"
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sigle</label>
              <input type="text" value={form.sigle} placeholder="Ex: RTS1"
                onChange={(e) => setForm({ ...form, sigle: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type *</label>
              <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TypeMedia })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                <option value="television">Télévision</option>
                <option value="radio">Radio</option>
                <option value="en_ligne">En ligne</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Statut *</label>
              <select required value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as StatutMedia })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="retire">Retiré</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Région</label>
              <input type="text" value={form.region} placeholder="Ex: National, Dakar…"
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Langue</label>
              <input type="text" value={form.langue} placeholder="Ex: Français, Wolof…"
                onChange={(e) => setForm({ ...form, langue: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] disabled:opacity-60">
                {saving ? "Enregistrement…" : editing ? "Modifier" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres type */}
      <div className="flex gap-2 flex-wrap">
        {(["", "television", "radio", "en_ligne"] as const).map((t) => (
          <button key={t} onClick={() => setFiltreType(t)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
              filtreType === t ? "bg-[#1A3A6B] text-white border-[#1A3A6B]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}>
            {t === "" ? "Tous" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#1A3A6B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
            const Icon = TYPE_ICON[m.type] ?? Radio
            return (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border", TYPE_COLORS[m.type])}>
                    <Icon className="w-3 h-3" />
                    {TYPE_LABELS[m.type]}
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUT_COLORS[m.statut])}>
                    {m.statut.charAt(0).toUpperCase() + m.statut.slice(1)}
                  </span>
                </div>
                <p className="font-semibold text-gray-800">{m.nom}</p>
                {m.sigle && <p className="text-xs text-gray-400 mt-0.5">{m.sigle}</p>}
                <div className="flex gap-2 mt-2 text-xs text-gray-400 flex-wrap">
                  {m.region && <span>📍 {m.region}</span>}
                  <span>🗣 {m.langue}</span>
                </div>
                <button onClick={() => ouvrirForm(m)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-[#1A3A6B] hover:underline font-medium">
                  <Pencil className="w-3 h-3" /> Modifier
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
