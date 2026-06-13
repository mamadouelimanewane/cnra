"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDuree, calculerDureeEntre } from "@/lib/utils"
import { Plus, Trash2, Search, Filter, Mic2 } from "lucide-react"
import type { Intervention, Campagne, Parti, Media } from "@/types"

export function InterventionsClient() {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [partis, setPartis] = useState<Parti[]>([])
  const [medias, setMedias] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtreMedia, setFiltreMedia] = useState("")
  const [filtreParti, setFiltreParti] = useState("")

  // Formulaire
  const [form, setForm] = useState({
    campagne_id: "", parti_id: "", media_id: "",
    date_intervention: new Date().toISOString().split("T")[0],
    heure_debut: "", heure_fin: "", programme: "", notes: "",
  })

  const charger = useCallback(async () => {
    const supabase = createClient()
    const [{ data: ivs }, { data: camps }, { data: pts }, { data: meds }] = await Promise.all([
      supabase.from("interventions")
        .select("*, parti:partis(*), media:medias(*), campagne:campagnes(id,nom)")
        .order("date_intervention", { ascending: false })
        .order("heure_debut", { ascending: false })
        .limit(100),
      supabase.from("campagnes").select("*").order("date_debut", { ascending: false }),
      supabase.from("partis").select("*").eq("actif", true).order("nom"),
      supabase.from("medias").select("*").eq("statut", "actif").order("nom"),
    ])
    setInterventions((ivs as Intervention[]) ?? [])
    setCampagnes(camps ?? [])
    setPartis(pts ?? [])
    setMedias(meds ?? [])
    setLoading(false)

    // Pré-remplir campagne active
    const active = camps?.find((c: Campagne) => c.statut === "en_cours")
    if (active) setForm((f) => ({ ...f, campagne_id: active.id }))
  }, [])

  useEffect(() => { charger() }, [charger])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.heure_debut || !form.heure_fin) return
    setSaving(true)
    const duree = calculerDureeEntre(form.heure_debut, form.heure_fin)
    if (duree <= 0) { setSaving(false); return }

    const supabase = createClient()
    await supabase.from("interventions").insert({
      ...form, duree_secondes: duree,
    })

    // Vérifier déséquilibre et créer alerte si nécessaire
    await verifierEtAlerter(form.campagne_id, form.media_id, supabase)

    setShowForm(false)
    setForm((f) => ({ ...f, parti_id: "", heure_debut: "", heure_fin: "", programme: "", notes: "" }))
    setSaving(false)
    charger()
  }

  async function verifierEtAlerter(campagneId: string, mediaId: string, supabase: ReturnType<typeof createClient>) {
    const { data: stats } = await supabase
      .from("v_stats_parti_media")
      .select("*")
      .eq("campagne_id", campagneId)
      .eq("media_id", mediaId)

    if (!stats || stats.length < 2) return

    const pcts = stats.map((s) => s.pourcentage_sur_media as number)
    const moy = pcts.reduce((a, b) => a + b, 0) / pcts.length
    const maxEcart = Math.max(...pcts.map((p) => Math.abs(p - moy)))

    const { data: camp } = await supabase.from("campagnes").select("seuil_alerte_pct").eq("id", campagneId).single()
    const seuil = camp?.seuil_alerte_pct ?? 20

    if (maxEcart > seuil) {
      const maxStat = stats.find((s) => Math.abs(s.pourcentage_sur_media - moy) === Math.max(...pcts.map((p) => Math.abs(p - moy))))
      await supabase.from("alertes").insert({
        campagne_id: campagneId,
        media_id: mediaId,
        parti_id: maxStat?.parti_id ?? null,
        niveau: maxEcart > seuil * 2 ? "critique" : "avertissement",
        message: `Déséquilibre détecté : écart de ${maxEcart.toFixed(1)}% sur ${stats[0]?.media_nom ?? "un média"}`,
        details: `Seuil autorisé : ${seuil}%. Parti sur-représenté : ${maxStat?.parti_nom ?? "inconnu"} (${maxStat?.pourcentage_sur_media?.toFixed(1)}%)`,
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette intervention ?")) return
    const supabase = createClient()
    await supabase.from("interventions").delete().eq("id", id)
    charger()
  }

  const filtered = interventions.filter((i) =>
    (!filtreMedia || i.media_id === filtreMedia) &&
    (!filtreParti || i.parti_id === filtreParti)
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Saisie des interventions</h2>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} intervention{filtered.length > 1 ? "s" : ""} enregistrée{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle intervention
        </button>
      </div>

      {/* Formulaire de saisie */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-[#1A3A6B]" />
            Enregistrer une prise de parole
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Campagne *</label>
              <select required value={form.campagne_id} onChange={(e) => setForm({ ...form, campagne_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                <option value="">Sélectionner…</option>
                {campagnes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Parti politique *</label>
              <select required value={form.parti_id} onChange={(e) => setForm({ ...form, parti_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                <option value="">Sélectionner…</option>
                {partis.map((p) => <option key={p.id} value={p.id}>{p.nom} ({p.sigle})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Média *</label>
              <select required value={form.media_id} onChange={(e) => setForm({ ...form, media_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                <option value="">Sélectionner…</option>
                {medias.map((m) => <option key={m.id} value={m.id}>{m.nom} ({m.type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date *</label>
              <input type="date" required value={form.date_intervention}
                onChange={(e) => setForm({ ...form, date_intervention: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Heure début *</label>
              <input type="time" required value={form.heure_debut}
                onChange={(e) => setForm({ ...form, heure_debut: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Heure fin *</label>
              <input type="time" required value={form.heure_fin}
                onChange={(e) => setForm({ ...form, heure_fin: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Programme / Émission</label>
              <input type="text" value={form.programme} placeholder="Ex: Journal 20h, Débat politique…"
                onChange={(e) => setForm({ ...form, programme: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes internes</label>
              <input type="text" value={form.notes} placeholder="Observations…"
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>

            {/* Durée calculée */}
            {form.heure_debut && form.heure_fin && calculerDureeEntre(form.heure_debut, form.heure_fin) > 0 && (
              <div className="md:col-span-2 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs text-blue-700 font-medium">
                  Durée calculée : {formatDuree(calculerDureeEntre(form.heure_debut, form.heure_fin))}
                </span>
              </div>
            )}

            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] transition-colors disabled:opacity-60">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filtreParti} onChange={(e) => setFiltreParti(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
            <option value="">Tous les partis</option>
            {partis.map((p) => <option key={p.id} value={p.id}>{p.sigle}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filtreMedia} onChange={(e) => setFiltreMedia(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
            <option value="">Tous les médias</option>
            {medias.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Date", "Parti", "Média", "Programme", "Durée", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Aucune intervention enregistrée</td></tr>
              ) : filtered.map((iv) => (
                <tr key={iv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    <div>{new Date(iv.date_intervention).toLocaleDateString("fr-SN")}</div>
                    <div className="text-xs text-gray-400">{iv.heure_debut} → {iv.heure_fin}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {iv.parti && (
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: iv.parti.couleur }} />
                      )}
                      <div>
                        <div className="font-medium text-gray-800">{iv.parti?.sigle}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[140px]">{iv.parti?.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{iv.media?.nom}</div>
                    <div className="text-xs text-gray-400 capitalize">{iv.media?.type?.replace("_", " ")}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                    {iv.programme ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#1A3A6B]">
                      {formatDuree(iv.duree_secondes)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(iv.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
