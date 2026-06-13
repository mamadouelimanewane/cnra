// ─── Enums ────────────────────────────────────────────────────────────────────

export type StatutCampagne = 'a_venir' | 'en_cours' | 'terminee'
export type TypeMedia = 'television' | 'radio' | 'en_ligne'
export type StatutMedia = 'actif' | 'suspendu' | 'retire'
export type NiveauAlerte = 'info' | 'avertissement' | 'critique'
export type StatutAlerte = 'non_lue' | 'en_cours' | 'resolue'
export type RoleUtilisateur = 'admin' | 'agent_cnra' | 'observateur'

// ─── Entités principales ───────────────────────────────────────────────────────

export interface Campagne {
  id: string
  nom: string
  description: string | null
  date_debut: string
  date_fin: string
  statut: StatutCampagne
  seuil_alerte_pct: number // % d'écart déclenchant une alerte
  created_at: string
  updated_at: string
}

export interface Parti {
  id: string
  nom: string
  sigle: string
  couleur: string // hex color
  logo_url: string | null
  actif: boolean
  created_at: string
}

export interface Media {
  id: string
  nom: string
  sigle: string | null
  type: TypeMedia
  statut: StatutMedia
  logo_url: string | null
  region: string | null
  langue: string
  created_at: string
}

export interface Intervention {
  id: string
  campagne_id: string
  parti_id: string
  media_id: string
  duree_secondes: number
  date_intervention: string
  heure_debut: string
  heure_fin: string
  programme: string | null
  notes: string | null
  saisi_par: string
  created_at: string
  // Relations jointes
  parti?: Parti
  media?: Media
  campagne?: Campagne
}

export interface Alerte {
  id: string
  campagne_id: string
  media_id: string
  parti_id: string | null
  niveau: NiveauAlerte
  statut: StatutAlerte
  message: string
  details: string | null
  created_at: string
  resolue_at: string | null
  resolue_par: string | null
  // Relations
  media?: Media
  parti?: Parti
  campagne?: Campagne
}

export interface Rapport {
  id: string
  campagne_id: string
  titre: string
  periode_debut: string
  periode_fin: string
  contenu_json: RapportContenu
  genere_par: string
  genere_at: string
  publie: boolean
  campagne?: Campagne
}

// ─── Types de stats ────────────────────────────────────────────────────────────

export interface RapportContenu {
  resume: string
  total_interventions: number
  total_duree_secondes: number
  par_parti: StatParti[]
  par_media: StatMedia[]
  alertes_periode: number
}

export interface StatParti {
  parti: Parti
  total_secondes: number
  nombre_interventions: number
  pourcentage: number
  par_media: { media_id: string; media_nom: string; secondes: number }[]
}

export interface StatMedia {
  media: Media
  total_secondes: number
  nombre_interventions: number
  repartition_partis: { parti_id: string; parti_nom: string; secondes: number; pct: number }[]
  ecart_max_pct: number // Écart max entre le parti le + favorisé et la moyenne
}

// ─── Formulaires ──────────────────────────────────────────────────────────────

export interface FormIntervention {
  campagne_id: string
  parti_id: string
  media_id: string
  date_intervention: string
  heure_debut: string
  heure_fin: string
  programme?: string
  notes?: string
}

export interface FormCampagne {
  nom: string
  description?: string
  date_debut: string
  date_fin: string
  seuil_alerte_pct: number
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  campagne_active: Campagne | null
  total_interventions: number
  total_duree_heures: number
  partis_monitores: number
  alertes_non_lues: number
  derniere_mise_a_jour: string
}
