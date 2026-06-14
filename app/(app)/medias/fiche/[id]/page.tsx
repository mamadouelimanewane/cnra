"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Globe, MapPin, Phone, Mail, Calendar, FileText, Users, BarChart2, Tv, Radio } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Media {
  id: string; nom: string; type: string; statut: string; ville: string | null; couverture: string | null;
  langue: string | null; frequence: string | null; site_web: string | null; description: string | null;
  audience_estimee: number | null; numero_agrement: string | null; date_creation: string | null;
  latitude: number | null; longitude: number | null; capital_social: number | null; effectif: number | null;
  groupes_media: { nom: string; type_groupe: string } | null
}

interface Programme { id: string; nom: string; jour_semaine: string; heure_debut: string; heure_fin: string; categorie: string }
interface Audit { id: string; date_audit: string; type_audit: string; resultat: string; score: number | null; observations: string | null }
interface StatsAud { trimestre: number; annee: number; audience_hebdo: number; parts_marche: number }
interface Journaliste { id: string; prenom: string; nom: string; poste: string | null }

export default function FicheMediaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [media, setMedia] = useState<Media | null>(null)
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [audits, setAudits] = useState<Audit[]>([])
  const [stats, setStats] = useState<StatsAud[]>([])
  const [journalistes, setJournalistes] = useState<Journaliste[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from("medias").select("*,groupes_media:groupe_id(nom,type_groupe)").eq("id", id).single(),
      supabase.from("programmes").select("id,nom,jour_semaine,heure_debut,heure_fin,categorie").eq("media_id", id).order("heure_debut"),
      supabase.from("audits_media").select("id,date_audit,type_audit,resultat,score,observations").eq("media_id", id).order("date_audit", { ascending: false }),
      supabase.from("stats_audience").select("trimestre,annee,audience_hebdo,parts_marche").eq("media_id", id).order("annee").order("trimestre"),
      supabase.from("journalistes").select("id,prenom,nom,poste").eq("media_id", id),
    ]).then(([m, p, a, s, j]) => {
      setMedia(m.data as Media)
      setProgrammes((p.data ?? []) as Programme[])
      setAudits((a.data ?? []) as Audit[])
      setStats((s.data ?? []) as StatsAud[])
      setJournalistes((j.data ?? []) as Journaliste[])
    })
  }, [id])

  if (!media) return <div className="p-8 text-gray-400">Chargement…</div>

  const dernierAudit = audits[0]
  const statsChart = stats.map(s => ({ label: `T${s.trimestre} ${s.annee}`, audience: Math.round(s.audience_hebdo / 1000), part: s.parts_marche }))

  const TypeIcon = media.type === "television" ? Tv : media.type === "radio" ? Radio : Globe

  return (
    <div className="p-8 space-y-6">
      {/* Back + Header */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A3A6B] transition-colors mb-2">
        <ArrowLeft className="size-4" />
        Retour
      </button>

      <div className="bg-gradient-to-br from-[#1A3A6B] to-[#0f2550] rounded-2xl p-8 text-white flex items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <TypeIcon className="size-8 text-[#C9A84C]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black">{media.nom}</h1>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${media.statut === "actif" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {media.statut}
            </span>
          </div>
          {media.groupes_media && <p className="text-blue-300 text-sm">{media.groupes_media.nom}</p>}
          {media.description && <p className="text-blue-200 text-sm mt-2 max-w-2xl">{media.description}</p>}
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-blue-300">
            {media.ville && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{media.ville}</span>}
            {media.couverture && <span className="capitalize">• {media.couverture}</span>}
            {media.langue && <span className="capitalize">• {media.langue}</span>}
            {media.frequence && <span className="text-[#C9A84C] font-bold">• FM {media.frequence} MHz</span>}
          </div>
        </div>
        {media.audience_estimee && (
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-[#C9A84C]">{formatNumber(media.audience_estimee)}</p>
            <p className="text-blue-300 text-xs">audience estimée</p>
          </div>
        )}
      </div>

      {/* Infos admin */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Agrément CNRA", value: media.numero_agrement ?? "—", icon: FileText },
          { label: "Date de création", value: media.date_creation ? new Date(media.date_creation).toLocaleDateString("fr-FR") : "—", icon: Calendar },
          { label: "Effectif", value: media.effectif ? `${media.effectif} personnes` : "—", icon: Users },
        ].map(f => (
          <div key={f.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <f.icon className="size-6 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{f.label}</p>
              <p className="font-bold text-gray-900 mt-0.5">{f.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Audiences */}
      {statsChart.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart2 className="size-5 text-[#1A3A6B]" />
            Évolution des audiences
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={statsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="audience" stroke="#1A3A6B" strokeWidth={2} dot name="Audience (k)" />
              <Line yAxisId="right" type="monotone" dataKey="part" stroke="#C9A84C" strokeWidth={2} dot name="Part marché %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Journalistes */}
        {journalistes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Journalistes ({journalistes.length})</h3>
            <div className="space-y-2">
              {journalistes.map(j => (
                <div key={j.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#1A3A6B] font-bold text-xs shrink-0">
                    {j.prenom[0]}{j.nom[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{j.prenom} {j.nom}</p>
                    {j.poste && <p className="text-xs text-gray-400">{j.poste}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Derniers audits */}
        {audits.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Historique audits ({audits.length})</h3>
            <div className="space-y-3">
              {audits.map(a => (
                <div key={a.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">{a.type_audit}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.resultat === "conforme" ? "bg-green-100 text-green-700" : a.resultat === "non_conforme" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {a.resultat}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(a.date_audit).toLocaleDateString("fr-FR")}</p>
                  {a.score != null && <p className="text-lg font-black text-[#1A3A6B] mt-1">{a.score}/100</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Programmes */}
      {programmes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Grille des programmes</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Émission", "Jour", "Heure début", "Heure fin", "Catégorie"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {programmes.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{p.nom}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{p.jour_semaine}</td>
                  <td className="px-4 py-3 text-gray-600">{p.heure_debut?.slice(0, 5)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.heure_fin?.slice(0, 5)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold capitalize">{p.categorie}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
