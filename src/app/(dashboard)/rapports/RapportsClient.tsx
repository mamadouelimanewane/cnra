"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDuree } from "@/lib/utils"
import { FileText, Download, Globe, Eye, Plus } from "lucide-react"
import type { Rapport, Campagne, StatParti } from "@/types"

export function RapportsClient() {
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    campagne_id: "", titre: "", periode_debut: "", periode_fin: "",
  })

  const charger = useCallback(async () => {
    const supabase = createClient()
    const [{ data: rpts }, { data: camps }] = await Promise.all([
      supabase.from("rapports").select("*, campagne:campagnes(id,nom)").order("genere_at", { ascending: false }),
      supabase.from("campagnes").select("*").order("date_debut", { ascending: false }),
    ])
    setRapports((rpts as Rapport[]) ?? [])
    setCampagnes(camps ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function genererRapport(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    const supabase = createClient()

    // Récupérer les stats pour la période
    const { data: statsRaw } = await supabase
      .from("v_stats_parti_campagne")
      .select("*")
      .eq("campagne_id", form.campagne_id)

    const { data: interventions } = await supabase
      .from("interventions")
      .select("id, duree_secondes")
      .eq("campagne_id", form.campagne_id)
      .gte("date_intervention", form.periode_debut)
      .lte("date_intervention", form.periode_fin)

    const totalSecondes = (interventions ?? []).reduce((a, i) => a + i.duree_secondes, 0)

    const contenu = {
      resume: `Rapport de monitoring du pluralisme politique — ${form.titre}`,
      total_interventions: interventions?.length ?? 0,
      total_duree_secondes: totalSecondes,
      par_parti: (statsRaw ?? []).map((s) => ({
        parti: { id: s.parti_id, nom: s.parti_nom, sigle: s.parti_sigle, couleur: s.parti_couleur, logo_url: null, actif: true, created_at: "" },
        total_secondes: s.total_secondes,
        nombre_interventions: s.nb_interventions,
        pourcentage: s.pourcentage,
        par_media: [],
      })) as StatParti[],
      par_media: [],
      alertes_periode: 0,
    }

    await supabase.from("rapports").insert({
      campagne_id: form.campagne_id,
      titre: form.titre,
      periode_debut: form.periode_debut,
      periode_fin: form.periode_fin,
      contenu_json: contenu,
    })

    setShowForm(false)
    setGenerating(false)
    charger()
  }

  async function togglePublier(id: string, publie: boolean) {
    const supabase = createClient()
    await supabase.from("rapports").update({ publie: !publie }).eq("id", id)
    charger()
  }

  async function telechargerPDF(rapport: Rapport) {
    const { jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const contenu = rapport.contenu_json

    // En-tête
    doc.setFillColor(26, 58, 107)
    doc.rect(0, 0, 210, 35, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("CNRA ElectroWatch", 15, 14)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Observatoire Électoral des Médias — Sénégal", 15, 22)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(rapport.titre, 15, 31)

    // Infos
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Campagne : ${rapport.campagne?.nom ?? "—"}`, 15, 45)
    doc.text(`Période : du ${rapport.periode_debut} au ${rapport.periode_fin}`, 15, 51)
    doc.text(`Généré le : ${new Date(rapport.genere_at).toLocaleString("fr-SN")}`, 15, 57)

    // Stats globales
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Statistiques globales", 15, 70)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Total interventions : ${contenu.total_interventions}`, 15, 78)
    doc.text(`Temps total : ${formatDuree(contenu.total_duree_secondes)}`, 15, 84)

    // Table partis
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Temps de parole par parti", 15, 98)

    autoTable(doc, {
      startY: 103,
      head: [["Parti", "Sigle", "Durée", "Interventions", "Part (%)"]],
      body: contenu.par_parti.map((s) => [
        s.parti.nom, s.parti.sigle,
        formatDuree(s.total_secondes),
        s.nombre_interventions.toString(),
        `${s.pourcentage.toFixed(1)}%`,
      ]),
      headStyles: { fillColor: [26, 58, 107], textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      margin: { left: 15, right: 15 },
    })

    // Pied de page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `Document officiel CNRA — Confidentiel — Page ${i}/${pageCount}`,
        105, 290, { align: "center" }
      )
    }

    doc.save(`CNRA_ElectroWatch_${rapport.titre.replace(/\s+/g, "_")}.pdf`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rapports officiels</h2>
          <p className="text-sm text-gray-500 mt-0.5">Avis hebdomadaires et bilans de campagne</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] transition-colors">
          <Plus className="w-4 h-4" /> Générer un rapport
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-5">Nouveau rapport de monitoring</h3>
          <form onSubmit={genererRapport} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Campagne *</label>
              <select required value={form.campagne_id} onChange={(e) => setForm({ ...form, campagne_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]">
                <option value="">Sélectionner…</option>
                {campagnes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Titre du rapport *</label>
              <input type="text" required value={form.titre} placeholder="Ex: Avis hebdomadaire n°3"
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Période — Début *</label>
              <input type="date" required value={form.periode_debut}
                onChange={(e) => setForm({ ...form, periode_debut: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Période — Fin *</label>
              <input type="date" required value={form.periode_fin}
                onChange={(e) => setForm({ ...form, periode_fin: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B]" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={generating}
                className="px-5 py-2 bg-[#1A3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4080] disabled:opacity-60">
                {generating ? "Génération en cours…" : "Générer le rapport"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#1A3A6B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rapports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">Aucun rapport généré</h3>
          <p className="text-sm text-gray-400">Générez votre premier rapport à partir des données de monitoring.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rapports.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#1A3A6B]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{r.titre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.campagne?.nom} · {r.periode_debut} → {r.periode_fin}
                    </p>
                  </div>
                  {r.publie && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full shrink-0">
                      Publié
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>{r.contenu_json.total_interventions} interventions</span>
                  <span>·</span>
                  <span>{formatDuree(r.contenu_json.total_duree_secondes)}</span>
                  <span>·</span>
                  <span>Généré le {new Date(r.genere_at).toLocaleDateString("fr-SN")}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => telechargerPDF(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A3A6B] text-white rounded-lg hover:bg-[#1e4080] transition-colors">
                    <Download className="w-3.5 h-3.5" /> Télécharger PDF
                  </button>
                  <button onClick={() => togglePublier(r.id, r.publie)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    {r.publie ? "Dépublier" : "Publier"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
