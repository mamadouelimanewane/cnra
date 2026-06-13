"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { StatParti, StatMedia, Campagne, Alerte } from "@/types"

export function useStatsCampagne(campagneId: string | null) {
  const [statsPartis, setStatsPartis] = useState<StatParti[]>([])
  const [statsMedias, setStatsMedias] = useState<StatMedia[]>([])
  const [loading, setLoading] = useState(false)

  const charger = useCallback(async () => {
    if (!campagneId) return
    setLoading(true)
    const supabase = createClient()

    const [{ data: partisData }, { data: mediasData }, { data: partisMediaData }] = await Promise.all([
      supabase.from("v_stats_parti_campagne").select("*").eq("campagne_id", campagneId),
      supabase.from("v_stats_media_campagne").select("*").eq("campagne_id", campagneId),
      supabase.from("v_stats_parti_media").select("*").eq("campagne_id", campagneId),
    ])

    // Construire StatParti[]
    const sp: StatParti[] = (partisData ?? []).map((r) => ({
      parti: {
        id: r.parti_id, nom: r.parti_nom, sigle: r.parti_sigle,
        couleur: r.parti_couleur, logo_url: null, actif: true, created_at: "",
      },
      total_secondes: r.total_secondes,
      nombre_interventions: r.nb_interventions,
      pourcentage: r.pourcentage,
      par_media: (partisMediaData ?? [])
        .filter((pm) => pm.parti_id === r.parti_id)
        .map((pm) => ({ media_id: pm.media_id, media_nom: pm.media_nom, secondes: pm.total_secondes })),
    }))

    // Construire StatMedia[]
    const sm: StatMedia[] = (mediasData ?? []).map((r) => {
      const repartition = (partisMediaData ?? [])
        .filter((pm) => pm.media_id === r.media_id)
        .map((pm) => ({
          parti_id: pm.parti_id, parti_nom: pm.parti_nom,
          secondes: pm.total_secondes, pct: pm.pourcentage_sur_media,
        }))
      const pcts = repartition.map((p) => p.pct)
      const moy = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0
      const ecart_max_pct = pcts.length ? Math.max(...pcts.map((p) => Math.abs(p - moy))) : 0

      return {
        media: {
          id: r.media_id, nom: r.media_nom, sigle: null, type: r.media_type,
          statut: "actif" as const, logo_url: null, region: null,
          langue: "Français", created_at: "",
        },
        total_secondes: r.total_secondes,
        nombre_interventions: r.nb_interventions,
        repartition_partis: repartition,
        ecart_max_pct,
      }
    })

    setStatsPartis(sp)
    setStatsMedias(sm)
    setLoading(false)
  }, [campagneId])

  useEffect(() => { charger() }, [charger])

  return { statsPartis, statsMedias, loading, recharger: charger }
}

export function useCampagneActive() {
  const [campagne, setCampagne] = useState<Campagne | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("campagnes")
      .select("*")
      .eq("statut", "en_cours")
      .order("date_debut", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { setCampagne(data); setLoading(false) })
  }, [])

  return { campagne, loading }
}

export function useAlertesNonLues() {
  const [alertes, setAlertes] = useState<Alerte[]>([])

  useEffect(() => {
    const supabase = createClient()

    const charger = async () => {
      const { data } = await supabase
        .from("alertes")
        .select("*, media:medias(id,nom,type), parti:partis(id,nom,sigle,couleur), campagne:campagnes(id,nom)")
        .eq("statut", "non_lue")
        .order("created_at", { ascending: false })
        .limit(10)
      setAlertes((data as Alerte[]) ?? [])
    }

    charger()

    // Temps réel
    const channel = supabase
      .channel("alertes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "alertes" }, charger)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return alertes
}
