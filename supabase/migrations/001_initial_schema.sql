-- ============================================================
-- CNRA ElectroWatch — Schéma initial
-- Observatoire Électoral des Médias
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Partis politiques ────────────────────────────────────────
CREATE TABLE partis (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  sigle       TEXT NOT NULL UNIQUE,
  couleur     TEXT NOT NULL DEFAULT '#1A3A6B',
  logo_url    TEXT,
  actif       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Médias ───────────────────────────────────────────────────
CREATE TABLE medias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  sigle       TEXT,
  type        TEXT NOT NULL CHECK (type IN ('television','radio','en_ligne')),
  statut      TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif','suspendu','retire')),
  logo_url    TEXT,
  region      TEXT,
  langue      TEXT NOT NULL DEFAULT 'Français',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Campagnes électorales ────────────────────────────────────
CREATE TABLE campagnes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom                 TEXT NOT NULL,
  description         TEXT,
  date_debut          DATE NOT NULL,
  date_fin            DATE NOT NULL,
  statut              TEXT NOT NULL DEFAULT 'a_venir' CHECK (statut IN ('a_venir','en_cours','terminee')),
  seuil_alerte_pct    NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT date_coherente CHECK (date_fin >= date_debut)
);

-- ─── Interventions (saisies de temps de parole) ───────────────
CREATE TABLE interventions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campagne_id         UUID NOT NULL REFERENCES campagnes(id) ON DELETE CASCADE,
  parti_id            UUID NOT NULL REFERENCES partis(id),
  media_id            UUID NOT NULL REFERENCES medias(id),
  duree_secondes      INTEGER NOT NULL CHECK (duree_secondes > 0),
  date_intervention   DATE NOT NULL,
  heure_debut         TIME NOT NULL,
  heure_fin           TIME NOT NULL,
  programme           TEXT,
  notes               TEXT,
  saisi_par           UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT heure_coherente CHECK (heure_fin > heure_debut)
);

-- ─── Alertes ──────────────────────────────────────────────────
CREATE TABLE alertes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campagne_id     UUID NOT NULL REFERENCES campagnes(id) ON DELETE CASCADE,
  media_id        UUID NOT NULL REFERENCES medias(id),
  parti_id        UUID REFERENCES partis(id),
  niveau          TEXT NOT NULL CHECK (niveau IN ('info','avertissement','critique')),
  statut          TEXT NOT NULL DEFAULT 'non_lue' CHECK (statut IN ('non_lue','en_cours','resolue')),
  message         TEXT NOT NULL,
  details         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolue_at      TIMESTAMPTZ,
  resolue_par     UUID REFERENCES auth.users(id)
);

-- ─── Rapports ─────────────────────────────────────────────────
CREATE TABLE rapports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campagne_id     UUID NOT NULL REFERENCES campagnes(id) ON DELETE CASCADE,
  titre           TEXT NOT NULL,
  periode_debut   DATE NOT NULL,
  periode_fin     DATE NOT NULL,
  contenu_json    JSONB NOT NULL DEFAULT '{}',
  genere_par      UUID REFERENCES auth.users(id),
  genere_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  publie          BOOLEAN NOT NULL DEFAULT false
);

-- ─── Profils utilisateurs ─────────────────────────────────────
CREATE TABLE profils (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_complet TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'agent_cnra' CHECK (role IN ('admin','agent_cnra','observateur')),
  actif       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Index ────────────────────────────────────────────────────
CREATE INDEX idx_interventions_campagne ON interventions(campagne_id);
CREATE INDEX idx_interventions_parti    ON interventions(parti_id);
CREATE INDEX idx_interventions_media    ON interventions(media_id);
CREATE INDEX idx_interventions_date     ON interventions(date_intervention);
CREATE INDEX idx_alertes_campagne       ON alertes(campagne_id);
CREATE INDEX idx_alertes_statut         ON alertes(statut);

-- ─── Vues ─────────────────────────────────────────────────────

-- Vue : stats temps de parole par parti et campagne
CREATE VIEW v_stats_parti_campagne AS
SELECT
  i.campagne_id,
  i.parti_id,
  p.nom          AS parti_nom,
  p.sigle        AS parti_sigle,
  p.couleur      AS parti_couleur,
  SUM(i.duree_secondes) AS total_secondes,
  COUNT(*)               AS nb_interventions,
  ROUND(
    SUM(i.duree_secondes) * 100.0 /
    NULLIF(SUM(SUM(i.duree_secondes)) OVER (PARTITION BY i.campagne_id), 0),
    2
  ) AS pourcentage
FROM interventions i
JOIN partis p ON p.id = i.parti_id
GROUP BY i.campagne_id, i.parti_id, p.nom, p.sigle, p.couleur;

-- Vue : stats par média et campagne
CREATE VIEW v_stats_media_campagne AS
SELECT
  i.campagne_id,
  i.media_id,
  m.nom          AS media_nom,
  m.type         AS media_type,
  SUM(i.duree_secondes) AS total_secondes,
  COUNT(*)               AS nb_interventions
FROM interventions i
JOIN medias m ON m.id = i.media_id
GROUP BY i.campagne_id, i.media_id, m.nom, m.type;

-- Vue : stats par parti, média et campagne
CREATE VIEW v_stats_parti_media AS
SELECT
  i.campagne_id,
  i.parti_id,
  i.media_id,
  p.nom   AS parti_nom,
  p.sigle AS parti_sigle,
  p.couleur AS parti_couleur,
  m.nom   AS media_nom,
  m.type  AS media_type,
  SUM(i.duree_secondes) AS total_secondes,
  COUNT(*)               AS nb_interventions,
  ROUND(
    SUM(i.duree_secondes) * 100.0 /
    NULLIF(SUM(SUM(i.duree_secondes)) OVER (PARTITION BY i.campagne_id, i.media_id), 0),
    2
  ) AS pourcentage_sur_media
FROM interventions i
JOIN partis p ON p.id = i.parti_id
JOIN medias m ON m.id = i.media_id
GROUP BY i.campagne_id, i.parti_id, i.media_id, p.nom, p.sigle, p.couleur, m.nom, m.type;

-- ─── Triggers ─────────────────────────────────────────────────

-- Mise à jour automatique de updated_at sur campagnes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_campagnes_updated_at
  BEFORE UPDATE ON campagnes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Création automatique du profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profils (id, nom_complet, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nom_complet', NEW.email), 'agent_cnra');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── RLS (Row Level Security) ─────────────────────────────────
ALTER TABLE partis       ENABLE ROW LEVEL SECURITY;
ALTER TABLE medias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagnes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profils      ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les observateurs non connectés (partis, médias)
CREATE POLICY "public_read_partis"  ON partis  FOR SELECT USING (true);
CREATE POLICY "public_read_medias"  ON medias  FOR SELECT USING (true);
CREATE POLICY "public_read_campagnes" ON campagnes FOR SELECT USING (true);
CREATE POLICY "public_read_rapports_publies" ON rapports FOR SELECT USING (publie = true);

-- Accès complet pour agents authentifiés
CREATE POLICY "auth_all_interventions" ON interventions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_alertes"       ON alertes       FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_all_rapports"      ON rapports      FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_profils"      ON profils       FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_own_profil" ON profils       FOR UPDATE USING (auth.uid() = id);

-- ─── Données initiales ────────────────────────────────────────

INSERT INTO medias (nom, sigle, type, region, langue) VALUES
  ('RTS 1',                    'RTS1',   'television', 'National', 'Français'),
  ('TFM',                      'TFM',    'television', 'National', 'Français/Wolof'),
  ('2STV',                     '2STV',   'television', 'National', 'Français/Wolof'),
  ('Sen TV',                   'SENTV',  'television', 'National', 'Français/Wolof'),
  ('7TV',                      '7TV',    'television', 'National', 'Français/Wolof'),
  ('RFM Radio',                'RFM',    'radio',      'National', 'Français/Wolof'),
  ('Radio Sénégal',            'RS',     'radio',      'National', 'Français/Wolof'),
  ('Sud FM',                   'SUDFM',  'radio',      'National', 'Français/Wolof'),
  ('Dakar Actu',               'DKRACTU','en_ligne',   'Dakar',    'Français'),
  ('Seneweb',                  'SNWB',   'en_ligne',   'National', 'Français');
