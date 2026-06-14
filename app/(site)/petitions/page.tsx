"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Plus, CheckCircle, Clock, TrendingUp } from "lucide-react"

interface Petition {
  id: string
  titre: string
  description: string
  objectif_signatures: number
  nb_signatures: number
  statut: string
  categorie: string
  created_at: string
  auteur: string
}

const PETITIONS_DEMO: Petition[] = [
  { id: "1", titre: "Pour l'équité du temps de parole sur RTS1 pendant les campagnes", description: "Nous demandons au CNRA de renforcer les contrôles sur RTS1 et d'imposer une répartition équitable du temps de parole entre tous les partis politiques enregistrés.", objectif_signatures: 5000, nb_signatures: 3847, statut: "active", categorie: "Pluralisme", created_at: "2024-10-20", auteur: "Coalition Médias Équitables" },
  { id: "2", titre: "Transparence des sanctions CNRA — Publication obligatoire", description: "Toutes les décisions et sanctions prononcées par le CNRA doivent être publiées dans un délai de 48h sur le portail officiel.", objectif_signatures: 2000, nb_signatures: 2000, statut: "acceptee", categorie: "Transparence", created_at: "2024-09-15", auteur: "Association Presse Libre SN" },
  { id: "3", titre: "Accès aux fréquences radio pour les médias communautaires ruraux", description: "Plaidoyer pour l'attribution de fréquences aux radios communautaires rurales afin de garantir l'accès à l'information dans toutes les régions du Sénégal.", objectif_signatures: 10000, nb_signatures: 6234, statut: "active", categorie: "Accès à l'info", created_at: "2024-08-01", auteur: "Réseau Radios Communautaires" },
  { id: "4", titre: "Contre la concentration excessive des médias privés", description: "Limiter la propriété croisée des médias pour préserver le pluralisme de l'information et éviter les monopoles médiatiques.", objectif_signatures: 3000, nb_signatures: 1245, statut: "active", categorie: "Pluralisme", created_at: "2024-11-01", auteur: "Journalistes Sans Frontières SN" },
]

export default function PetitionsPage() {
  const supabase = createClient()
  const [petitions] = useState<Petition[]>(PETITIONS_DEMO)
  const [showForm, setShowForm] = useState(false)
  const [signing, setSigning] = useState<string | null>(null)
  const [signed, setSigned] = useState<Set<string>>(new Set())
  const [filtre, setFiltre] = useState("toutes")

  // Formulaire nouvelle pétition
  const [titre, setTitre] = useState("")
  const [desc, setDesc] = useState("")
  const [objectif, setObjectif] = useState("1000")
  const [auteur, setAuteur] = useState("")
  const [submitted, setSubmitted] = useState(false)

  async function signer(id: string) {
    setSigning(id)
    await new Promise(r => setTimeout(r, 800))
    setSigned(prev => new Set([...prev, id]))
    setSigning(null)
  }

  const filtered = filtre === "toutes" ? petitions : petitions.filter(p => p.statut === filtre)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A3A6B] mb-2">Pétitions citoyennes</h1>
          <p className="text-gray-500">Signalez vos préoccupations médiatiques et soutenez les causes en cours</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1A3A6B] text-white font-bold px-5 py-3 rounded-xl hover:bg-[#1A3A6B]/90 transition-colors">
          <Plus className="size-5" /> Créer une pétition
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pétitions actives", value: petitions.filter(p => p.statut === "active").length, icon: TrendingUp, color: "text-[#1A3A6B] bg-blue-50" },
          { label: "Total signatures", value: petitions.reduce((s, p) => s + p.nb_signatures, 0).toLocaleString("fr-FR"), icon: Users, color: "text-purple-700 bg-purple-50" },
          { label: "Pétitions acceptées", value: petitions.filter(p => p.statut === "acceptee").length, icon: CheckCircle, color: "text-green-700 bg-green-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color.split(" ")[1]}`}>
            <s.icon className={`size-6 mb-2 ${s.color.split(" ")[0]}`} />
            <p className={`text-3xl font-black ${s.color.split(" ")[0]}`}>{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {[["toutes", "Toutes"], ["active", "Actives"], ["acceptee", "Acceptées"]].map(([v, l]) => (
          <button key={v} onClick={() => setFiltre(v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtre === v ? "bg-[#1A3A6B] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#1A3A6B]"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Liste pétitions */}
      <div className="space-y-5">
        {filtered.map(p => {
          const progress = Math.min(100, Math.round(p.nb_signatures / p.objectif_signatures * 100))
          const isSigned = signed.has(p.id)
          const isAccepted = p.statut === "acceptee"

          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-[#1A3A6B] px-2 py-0.5 rounded-full font-medium">{p.categorie}</span>
                        {isAccepted && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCircle className="size-3" />Acceptée par le CNRA</span>}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg leading-snug">{p.titre}</h3>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users className="size-3" /> {p.auteur}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                {/* Compteur + bouton */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-3 sm:min-w-40">
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#1A3A6B]">{(p.nb_signatures + (isSigned ? 1 : 0)).toLocaleString("fr-FR")}</p>
                    <p className="text-xs text-gray-400">sur {p.objectif_signatures.toLocaleString("fr-FR")} objectif</p>
                  </div>
                  {!isAccepted && (
                    <button
                      onClick={() => !isSigned && signer(p.id)}
                      disabled={isSigned || signing === p.id}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        isSigned ? "bg-green-100 text-green-700 cursor-default" :
                        "bg-[#1A3A6B] text-white hover:bg-[#1A3A6B]/90 active:scale-95"
                      }`}
                    >
                      {signing === p.id ? "…" : isSigned ? "✓ Signé" : "Signer"}
                    </button>
                  )}
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>{progress}% de l&apos;objectif atteint</span>
                  <span>{p.objectif_signatures - p.nb_signatures > 0 ? `${(p.objectif_signatures - p.nb_signatures).toLocaleString("fr-FR")} signatures restantes` : "Objectif atteint ✓"}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: isAccepted ? "#166534" : progress >= 100 ? "#C9A84C" : "#1A3A6B" }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal nouvelle pétition */}
      {showForm && !submitted && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#1A3A6B]">Lancer une pétition</h2>
              <p className="text-sm text-gray-500 mt-1">Votre pétition sera examinée par le CNRA avant publication</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Titre de la pétition *</label>
                <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Pour l'équité du temps de parole…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description *</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="Décrivez votre demande en détail…"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Votre nom / Organisation</label>
                  <input value={auteur} onChange={e => setAuteur(e.target.value)} placeholder="Ex: Association X"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Objectif signatures</label>
                  <input type="number" value={objectif} onChange={e => setObjectif(e.target.value)} min="100"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Annuler</button>
              <button onClick={() => setSubmitted(true)} disabled={!titre || !desc}
                className="px-6 py-2.5 bg-[#1A3A6B] text-white font-bold rounded-xl text-sm disabled:opacity-40 hover:bg-[#1A3A6B]/90">
                Soumettre au CNRA
              </button>
            </div>
          </div>
        </div>
      )}

      {submitted && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-10">
            <CheckCircle className="size-14 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pétition soumise !</h3>
            <p className="text-gray-500 text-sm mb-6">Votre pétition sera examinée par le CNRA dans les 5 jours ouvrables.</p>
            <button onClick={() => { setSubmitted(false); setShowForm(false); setTitre(""); setDesc("") }}
              className="w-full bg-[#1A3A6B] text-white font-bold py-3 rounded-xl">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
