"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Shield, AlertTriangle, FileText, Users, ChevronRight, Eye, MessageSquare, BookOpen, Radio } from "lucide-react"
import { formatDuree } from "@/lib/utils"

interface Stats {
  campagneNom: string | null
  totalInterventions: number
  totalSecondes: number
  totalMedias: number
  totalAlertes: number
  totalPartis: number
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let n = 0
    const step = Math.max(1, Math.ceil(value / 40))
    const t = setInterval(() => {
      n = Math.min(n + step, value)
      setDisplay(n)
      if (n >= value) clearInterval(t)
    }, 30)
    return () => clearInterval(t)
  }, [value])
  return <>{display.toLocaleString("fr-FR")}</>
}

export default function AccueilPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({ campagneNom: null, totalInterventions: 0, totalSecondes: 0, totalMedias: 0, totalAlertes: 0, totalPartis: 0 })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: campagne } = await supabase.from("campagnes").select("id,nom").eq("statut", "en_cours").limit(1).single()
      if (!campagne) { setLoaded(true); return }
      const [ints, meds, alts, parts] = await Promise.all([
        supabase.from("interventions").select("duree_secondes").eq("campagne_id", campagne.id),
        supabase.from("v_stats_media_campagne").select("media_id").eq("campagne_id", campagne.id),
        supabase.from("alertes").select("id").eq("campagne_id", campagne.id).in("statut", ["non_lue", "en_cours"]),
        supabase.from("v_stats_parti_campagne").select("parti_id").eq("campagne_id", campagne.id),
      ])
      const totalSec = (ints.data ?? []).reduce((s: number, i: { duree_secondes: number }) => s + i.duree_secondes, 0)
      setStats({
        campagneNom: campagne.nom,
        totalInterventions: ints.data?.length ?? 0,
        totalSecondes: totalSec,
        totalMedias: meds.data?.length ?? 0,
        totalAlertes: alts.data?.length ?? 0,
        totalPartis: parts.data?.length ?? 0,
      })
      setLoaded(true)
    }
    load()
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1A3A6B] via-[#1e4a85] to-[#0f2347] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 text-[#C9A84C] text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
              Plateforme officielle · République du Sénégal
            </div>
            <h1 className="text-5xl font-black leading-tight mb-6">
              Le CNRA au service<br />
              <span className="text-[#C9A84C]">des citoyens</span>
            </h1>
            <p className="text-xl text-blue-200 leading-relaxed mb-10 max-w-xl">
              Signalez, consultez, participez. Le Conseil National de Régulation de l&apos;Audiovisuel
              garantit votre droit à une information équilibrée et plurielle.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signaler"
                className="bg-[#C9A84C] hover:bg-[#b8973d] text-white font-bold px-8 py-4 rounded-xl transition-colors flex items-center gap-2 text-base">
                <AlertTriangle className="size-5" /> Signaler une infraction
              </Link>
              <Link href="/observatoire"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-colors flex items-center gap-2 text-base border border-white/20">
                <Eye className="size-5" /> Voir l&apos;observatoire
              </Link>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Stats live */}
      {loaded && stats.campagneNom && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-10">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-gray-900">Monitoring en direct — {stats.campagneNom}</span>
              </div>
              <Link href="/observatoire" className="text-sm text-[#1A3A6B] font-medium hover:underline flex items-center gap-1">
                Voir détails <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
              {[
                { label: "Interventions", value: stats.totalInterventions, color: "#1A3A6B" },
                { label: "Temps total", value: null, custom: formatDuree(stats.totalSecondes), color: "#166534" },
                { label: "Médias suivis", value: stats.totalMedias, color: "#7c3aed" },
                { label: "Partis couverts", value: stats.totalPartis, color: "#0891b2" },
                { label: "Alertes actives", value: stats.totalAlertes, color: "#dc2626" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black" style={{ color: s.color }}>
                    {s.value !== null ? <AnimatedNumber value={s.value} /> : s.custom}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-[#1A3A6B] mb-3">Vos droits, nos services</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Accédez à tous les services du CNRA depuis cette plateforme citoyenne</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: AlertTriangle, title: "Signaler", desc: "Déposez un signalement d'infraction médiatique. Traçabilité garantie, réponse sous 15 jours.", href: "/signaler", color: "#dc2626", bg: "bg-red-50" },
            { icon: Eye, title: "Observatoire", desc: "Consultez en temps réel les données de monitoring du pluralisme politique dans les médias.", href: "/observatoire", color: "#1A3A6B", bg: "bg-blue-50" },
            { icon: MessageSquare, title: "Pétitions", desc: "Lancez ou signez des pétitions citoyennes sur la régulation des médias au Sénégal.", href: "/petitions", color: "#7c3aed", bg: "bg-purple-50" },
            { icon: FileText, title: "Décisions CNRA", desc: "Consultez toutes les sanctions, décisions et rapports officiels publiés par le CNRA.", href: "/decisions", color: "#166534", bg: "bg-green-50" },
            { icon: Radio, title: "Médias agréés", desc: "Retrouvez la liste complète des médias audiovisuels agréés par le CNRA au Sénégal.", href: "/medias", color: "#0891b2", bg: "bg-cyan-50" },
            { icon: BookOpen, title: "Éducation aux médias", desc: "Fiches pédagogiques, ressources et quiz pour développer l'esprit critique médiatique.", href: "/education", color: "#C9A84C", bg: "bg-yellow-50" },
          ].map(s => (
            <Link key={s.href} href={s.href}
              className={`group ${s.bg} rounded-2xl p-7 border border-transparent hover:border-current hover:shadow-lg transition-all duration-200`}
              style={{ borderColor: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = s.color + "40")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: s.color + "15" }}>
                <s.icon className="size-6" style={{ color: s.color }} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-current transition-colors" style={{ "--tw-text-opacity": "1" } as React.CSSProperties}>
                {s.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{s.desc}</p>
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: s.color }}>
                Accéder <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Mission CNRA */}
      <section className="bg-[#1A3A6B] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black mb-5">La mission du CNRA</h2>
              <p className="text-blue-200 text-base leading-relaxed mb-6">
                Le CNRA est l&apos;autorité administrative indépendante chargée de réguler l&apos;audiovisuel
                sénégalais. Il veille au respect du pluralisme, de l&apos;équité et de l&apos;éthique
                dans les médias, particulièrement en période électorale.
              </p>
              <div className="space-y-3">
                {[
                  "Garantir le pluralisme politique dans les médias",
                  "Surveiller le respect des temps de parole en campagne",
                  "Sanctionner les infractions à la réglementation",
                  "Protéger le droit à l'information des citoyens",
                ].map(m => (
                  <div key={m} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                    </div>
                    <p className="text-blue-100 text-sm">{m}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Médias agréés", value: "200+", icon: Radio },
                { label: "Années d'existence", value: "25+", icon: Shield },
                { label: "Signalements traités", value: "500+", icon: AlertTriangle },
                { label: "Décisions rendues", value: "150+", icon: FileText },
              ].map(k => (
                <div key={k.label} className="bg-white/10 rounded-2xl p-6 border border-white/10">
                  <k.icon className="size-6 text-[#C9A84C] mb-3" />
                  <p className="text-3xl font-black text-white mb-1">{k.value}</p>
                  <p className="text-blue-300 text-xs">{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA signalement */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-[#C9A84C]/10 to-[#1A3A6B]/10 rounded-3xl p-10 text-center border border-[#C9A84C]/20">
          <Users className="size-12 text-[#1A3A6B] mx-auto mb-5" />
          <h2 className="text-2xl font-black text-[#1A3A6B] mb-3">Votre voix compte</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Vous avez observé un déséquilibre médiatique ? Un contenu partisan non justifié ?
            Signalez-le au CNRA en quelques clics.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signaler"
              className="bg-[#1A3A6B] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#1A3A6B]/90 transition-colors">
              Faire un signalement
            </Link>
            <Link href="/petitions"
              className="bg-white text-[#1A3A6B] font-bold px-8 py-3.5 rounded-xl border-2 border-[#1A3A6B] hover:bg-[#1A3A6B]/5 transition-colors">
              Voir les pétitions
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
