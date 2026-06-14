"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, Link2, CheckCircle, AlertOctagon } from "lucide-react"

type FormState = "idle" | "loading" | "success" | "error"

export default function SoumettreePage() {
  const supabaseRef = useRef(createClient())
  const [form, setForm] = useState({
    titre: "",
    type_contenu: "video",
    url_source: "",
    plateforme: "",
    date_publication: "",
    description: "",
    soumis_par: "",
  })
  const [formState, setFormState] = useState<FormState>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre.trim()) return
    setFormState("loading")
    const supabase = supabaseRef.current
    const { error } = await supabase.from("contenus_analyses").insert([{
      titre: form.titre,
      type_contenu: form.type_contenu,
      url_source: form.url_source || null,
      plateforme: form.plateforme || null,
      date_publication: form.date_publication || null,
      description: form.description || null,
      soumis_par: form.soumis_par || null,
      statut_analyse: "en_attente",
    }])
    if (error) {
      setErrorMsg(error.message)
      setFormState("error")
    } else {
      setFormState("success")
      setForm({ titre: "", type_contenu: "video", url_source: "", plateforme: "", date_publication: "", description: "", soumis_par: "" })
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
  const labelClass = "block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2"

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Upload className="size-6 text-purple-400" /> Soumettre un contenu
        </h1>
        <p className="text-sm text-gray-400 mt-1">Signalez un contenu audiovisuel suspect pour analyse IA deepfake</p>
      </div>

      {formState === "success" && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl mb-6">
          <CheckCircle className="size-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-400">Contenu soumis avec succès</p>
            <p className="text-xs text-gray-400 mt-0.5">Le contenu a été ajouté à la file d'analyse. Résultats disponibles sous 24h.</p>
          </div>
        </div>
      )}

      {formState === "error" && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
          <AlertOctagon className="size-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className={labelClass}>Titre / description courte *</label>
          <input required value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
            placeholder="Ex: Vidéo virale attribuée au Président..." className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type de contenu *</label>
            <select value={form.type_contenu} onChange={e => setForm(f => ({ ...f, type_contenu: e.target.value }))}
              className={inputClass}>
              <option value="video">Vidéo</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
              <option value="texte">Texte</option>
              <option value="url">URL</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Plateforme</label>
            <select value={form.plateforme} onChange={e => setForm(f => ({ ...f, plateforme: e.target.value }))}
              className={inputClass}>
              <option value="">— Sélectionner —</option>
              {["Facebook","WhatsApp","Telegram","Twitter/X","TikTok","YouTube","Instagram","Web","Autre"].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>URL du contenu</label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <input value={form.url_source} onChange={e => setForm(f => ({ ...f, url_source: e.target.value }))}
              placeholder="https://..." className={`${inputClass} pl-10`} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Date de publication estimée</label>
          <input type="date" value={form.date_publication} onChange={e => setForm(f => ({ ...f, date_publication: e.target.value }))}
            className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Contexte / observations</label>
          <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Décrivez le contenu, son contexte de diffusion, pourquoi il vous semble suspect..." className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className={labelClass}>Soumis par</label>
          <input value={form.soumis_par} onChange={e => setForm(f => ({ ...f, soumis_par: e.target.value }))}
            placeholder="Nom ou service (ex: Cellule CNRA, signalement citoyen...)" className={inputClass} />
        </div>

        <button type="submit" disabled={formState === "loading"}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
          <Upload className="size-4" />
          {formState === "loading" ? "Soumission en cours..." : "Soumettre pour analyse"}
        </button>
      </form>

      <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
        <p className="text-xs text-purple-400 font-bold mb-1">À propos de l'analyse</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Les contenus soumis sont analysés par notre système d'IA spécialisé dans la détection de deepfakes (manipulation faciale, clonage vocal, montage audio/vidéo). Les résultats sont disponibles sous 24h et archivés dans la base CNRA.
        </p>
      </div>
    </div>
  )
}
