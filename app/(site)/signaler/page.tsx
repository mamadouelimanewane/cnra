"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, AlertCircle, Upload, Shield } from "lucide-react"

const ETAPES = ["Type", "Description", "Preuves", "Contact", "Envoi"]

export default function SignalerPage() {
  const supabase = createClient()
  const [etape, setEtape] = useState(0)
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)

  // Champs
  const [type, setType] = useState("")
  const [media, setMedia] = useState("")
  const [dateObs, setDateObs] = useState("")
  const [desc, setDesc] = useState("")
  const [nom, setNom] = useState("")
  const [email, setEmail] = useState("")
  const [tel, setTel] = useState("")
  const [anonymous, setAnonymous] = useState(false)

  async function submit() {
    setSending(true)
    await supabase.from("signalements").insert({
      type_infraction: type || "autre",
      description: `[Média: ${media || "Non précisé"}] [Date: ${dateObs || "Non précisée"}]\n\n${desc}`,
      nom_signalant: anonymous ? null : nom || null,
      email_signalant: anonymous ? null : email || null,
      telephone: anonymous ? null : tel || null,
    })
    setSending(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="size-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Signalement enregistré</h2>
          <p className="text-gray-500 leading-relaxed mb-2">
            Votre signalement a été transmis au CNRA avec le numéro de dossier :
          </p>
          <p className="text-xl font-black text-[#1A3A6B] mb-6">CNRA-{Date.now().toString().slice(-6)}</p>
          <p className="text-sm text-gray-400 mb-8">Conservez ce numéro pour suivre l&apos;avancement de votre dossier. Une réponse vous sera apportée sous 15 jours ouvrables.</p>
          <button onClick={() => { setDone(false); setEtape(0); setDesc(""); setType(""); setMedia("") }}
            className="bg-[#1A3A6B] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1A3A6B]/90 transition-colors">
            Faire un autre signalement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-[#1A3A6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="size-7 text-[#C9A84C]" />
        </div>
        <h1 className="text-3xl font-black text-[#1A3A6B] mb-2">Signaler une infraction</h1>
        <p className="text-gray-500">Formulaire officiel CNRA — Traitement confidentiel garanti</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-10">
        {ETAPES.map((e, i) => (
          <div key={e} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center ${i < ETAPES.length - 1 ? "flex-1" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i < etape ? "bg-green-500 text-white" : i === etape ? "bg-[#1A3A6B] text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {i < etape ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium hidden sm:block ${i === etape ? "text-[#1A3A6B]" : "text-gray-400"}`}>{e}</span>
            </div>
            {i < ETAPES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${i < etape ? "bg-green-500" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Étapes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {etape === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Type d&apos;infraction constatée</h2>
            {[
              { value: "desequilibre", label: "Déséquilibre du temps de parole", desc: "Un ou plusieurs partis bénéficient d'un temps disproportionné" },
              { value: "contenu_partisan", label: "Contenu partisan / propagande", desc: "Contenu favorisant un parti sans équité éditoriale" },
              { value: "temps_non_declare", label: "Temps de parole non déclaré", desc: "Interventions non comptabilisées ou dissimulées" },
              { value: "autre", label: "Autre infraction", desc: "Toute autre violation de la réglementation audiovisuelle" },
            ].map(opt => (
              <button key={opt.value} onClick={() => setType(opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${type === opt.value ? "border-[#1A3A6B] bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                <p className="font-semibold text-gray-900">{opt.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        )}

        {etape === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Description des faits</h2>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Média concerné</label>
              <input value={media} onChange={e => setMedia(e.target.value)} placeholder="Ex: RTS1, TFM, RFM…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date d&apos;observation</label>
              <input type="date" value={dateObs} onChange={e => setDateObs(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description détaillée *</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5}
                placeholder="Décrivez précisément ce que vous avez observé : programme, heure, nature du contenu, parti(s) concerné(s)…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none" />
              <p className="text-xs text-gray-400 mt-1">{desc.length}/1000 caractères</p>
            </div>
          </div>
        )}

        {etape === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Pièces justificatives</h2>
            <p className="text-sm text-gray-500 mb-5">Facultatif — Ajoutez des captures d&apos;écran, enregistrements ou liens pour renforcer votre signalement.</p>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-[#1A3A6B]/30 transition-colors cursor-pointer">
              <Upload className="size-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">Glissez vos fichiers ici</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, MP4, PDF · Max 10 Mo</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Toute fausse déclaration ou manipulation de preuves est passible de sanctions conformément à la loi sénégalaise.
                </p>
              </div>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Vos coordonnées</h2>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer" onClick={() => setAnonymous(!anonymous)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${anonymous ? "bg-[#1A3A6B] border-[#1A3A6B]" : "border-gray-300"}`}>
                {anonymous && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Signalement anonyme</p>
                <p className="text-xs text-gray-500">Vos coordonnées ne seront pas communiquées</p>
              </div>
            </div>
            {!anonymous && (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nom complet</label>
                  <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Adresse email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Téléphone</label>
                  <input value={tel} onChange={e => setTel(e.target.value)} placeholder="+221 7X XXX XX XX"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
                </div>
              </>
            )}
          </div>
        )}

        {etape === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Récapitulatif</h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-900 capitalize">{type.replace("_", " ")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Média</span><span className="font-medium text-gray-900">{media || "Non précisé"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium text-gray-900">{dateObs || "Non précisée"}</span></div>
              <div className="flex justify-between items-start gap-4"><span className="text-gray-500 shrink-0">Description</span><span className="font-medium text-gray-900 text-right text-xs">{desc.slice(0, 80)}{desc.length > 80 ? "…" : ""}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Identité</span><span className="font-medium text-gray-900">{anonymous ? "Anonyme" : nom || "Non renseigné"}</span></div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-700 leading-relaxed">
                <Shield className="size-3 inline mr-1" />
                En soumettant ce formulaire, vous attestez que les informations fournies sont exactes et que vous agissez de bonne foi conformément aux dispositions légales en vigueur au Sénégal.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button onClick={() => setEtape(e => Math.max(0, e - 1))} disabled={etape === 0}
            className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 font-medium">
            ← Précédent
          </button>
          {etape < 4 ? (
            <button onClick={() => setEtape(e => e + 1)}
              disabled={etape === 0 && !type || etape === 1 && !desc}
              className="px-6 py-2.5 bg-[#1A3A6B] text-white font-bold rounded-xl text-sm disabled:opacity-40 hover:bg-[#1A3A6B]/90 transition-colors">
              Suivant →
            </button>
          ) : (
            <button onClick={submit} disabled={sending}
              className="px-8 py-2.5 bg-[#C9A84C] text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-[#b8973d] transition-colors">
              {sending ? "Envoi…" : "Soumettre le signalement"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
