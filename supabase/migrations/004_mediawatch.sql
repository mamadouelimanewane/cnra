-- ============================================================
-- CNRA MediaWatch — Migration 004
-- Veille et monitoring des contenus audiovisuels
-- ============================================================

-- ─── Sessions de monitoring ───────────────────────────────────
CREATE TABLE IF NOT EXISTS monitoring_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id      UUID NOT NULL REFERENCES medias(id),
  date_session  DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_debut   TIME NOT NULL,
  heure_fin     TIME,
  duree_minutes INTEGER,
  type_session  TEXT NOT NULL DEFAULT 'direct' CHECK (type_session IN ('direct','replay','analyse')),
  operateur     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Temps de parole ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS temps_parole (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID REFERENCES monitoring_sessions(id) ON DELETE CASCADE,
  media_id        UUID NOT NULL REFERENCES medias(id),
  acteur          TEXT NOT NULL,
  type_acteur     TEXT NOT NULL DEFAULT 'politique' CHECK (type_acteur IN ('politique','gouvernement','opposition','societe_civile','expert','journaliste','citoyen','autre')),
  parti           TEXT,
  duree_secondes  INTEGER NOT NULL DEFAULT 0,
  date_mesure     DATE NOT NULL DEFAULT CURRENT_DATE,
  contexte        TEXT,
  favorable       BOOLEAN,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Alertes de monitoring ────────────────────────────────────
CREATE TABLE IF NOT EXISTS alertes_monitoring (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id      UUID NOT NULL REFERENCES medias(id),
  type_alerte   TEXT NOT NULL CHECK (type_alerte IN ('depassement_pub','desequilibre_parole','contenu_inapproprie','biais_editorial','absence_pluralisme','autre')),
  severite      TEXT NOT NULL DEFAULT 'moyenne' CHECK (severite IN ('faible','moyenne','elevee','critique')),
  titre         TEXT NOT NULL,
  description   TEXT,
  date_alerte   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  statut        TEXT NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','en_cours','resolue','classee')),
  traitee_par   TEXT,
  date_cloture  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Observations de contenu ──────────────────────────────────
CREATE TABLE IF NOT EXISTS observations_contenu (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id        UUID NOT NULL REFERENCES medias(id),
  date_obs        DATE NOT NULL DEFAULT CURRENT_DATE,
  heure_obs       TIME,
  thematique      TEXT NOT NULL,
  sous_thematique TEXT,
  ton             TEXT CHECK (ton IN ('neutre','positif','negatif','critique','laudatif')),
  duree_minutes   INTEGER,
  description     TEXT,
  operateur       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Rapports de veille ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS rapports_veille (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre         TEXT NOT NULL,
  periode_debut DATE NOT NULL,
  periode_fin   DATE NOT NULL,
  type_rapport  TEXT NOT NULL DEFAULT 'hebdomadaire' CHECK (type_rapport IN ('quotidien','hebdomadaire','mensuel','special')),
  statut        TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','publie','archive')),
  redacteur     TEXT,
  resume        TEXT,
  conclusions   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Index ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_temps_parole_media   ON temps_parole(media_id);
CREATE INDEX IF NOT EXISTS idx_temps_parole_acteur  ON temps_parole(acteur);
CREATE INDEX IF NOT EXISTS idx_temps_parole_date    ON temps_parole(date_mesure);
CREATE INDEX IF NOT EXISTS idx_alertes_media        ON alertes_monitoring(media_id);
CREATE INDEX IF NOT EXISTS idx_obs_media            ON observations_contenu(media_id);
CREATE INDEX IF NOT EXISTS idx_obs_date             ON observations_contenu(date_obs);

-- ─── RLS ──────────────────────────────────────────────────────
ALTER TABLE monitoring_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE temps_parole         ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertes_monitoring   ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations_contenu ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapports_veille      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_sessions"   ON monitoring_sessions  FOR SELECT USING (true);
CREATE POLICY "public_read_parole"     ON temps_parole         FOR SELECT USING (true);
CREATE POLICY "public_read_alertes"    ON alertes_monitoring   FOR SELECT USING (true);
CREATE POLICY "public_read_obs"        ON observations_contenu FOR SELECT USING (true);
CREATE POLICY "public_read_rapports"   ON rapports_veille      FOR SELECT USING (true);
CREATE POLICY "auth_write_sessions"    ON monitoring_sessions  FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_parole"      ON temps_parole         FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_alertes"     ON alertes_monitoring   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_obs"         ON observations_contenu FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_rapports"    ON rapports_veille      FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── Seed — Temps de parole (élections législatives 2024) ─────
INSERT INTO temps_parole (media_id, acteur, type_acteur, parti, duree_secondes, date_mesure, contexte, favorable) VALUES
  -- RTS1
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'Bassirou Diomaye Faye',  'politique',    'PASTEF',  4320, '2024-10-28', 'JT 20h — discours politique', true),
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'Ousmane Sonko',          'politique',    'PASTEF',  3180, '2024-10-28', 'Grand Jury interview',         true),
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'Amadou Ba',              'opposition',   'APR',     1800, '2024-10-28', 'Réaction opposition',          false),
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'Khalifa Sall',           'opposition',   'PS',       960, '2024-10-28', 'Déclaration',                  null),
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'Macky Sall',             'gouvernement', 'APR',     2400, '2024-10-29', 'Discours officiel',            true),
  -- TFM
  ((SELECT id FROM medias WHERE sigle='TFM'),  'Bassirou Diomaye Faye',  'politique',    'PASTEF',  3600, '2024-10-28', 'Interview exclusive',          true),
  ((SELECT id FROM medias WHERE sigle='TFM'),  'Amadou Ba',              'opposition',   'APR',     2700, '2024-10-28', 'Conférence de presse',         null),
  ((SELECT id FROM medias WHERE sigle='TFM'),  'Aissatou Tall Sall',     'gouvernement', 'APR',     1500, '2024-10-28', 'Point presse gouvernement',    true),
  ((SELECT id FROM medias WHERE sigle='TFM'),  'Ousmane Sonko',          'politique',    'PASTEF',  2100, '2024-10-29', 'Meeting retransmis',           true),
  -- 2STV
  ((SELECT id FROM medias WHERE sigle='2STV'), 'Khalifa Sall',           'opposition',   'PS',      2880, '2024-10-28', 'Plateau politique',            null),
  ((SELECT id FROM medias WHERE sigle='2STV'), 'Idrissa Seck',           'opposition',   'PDS',     1920, '2024-10-28', 'Déclaration',                  null),
  ((SELECT id FROM medias WHERE sigle='2STV'), 'Bassirou Diomaye Faye',  'politique',    'PASTEF',  1440, '2024-10-29', 'Extrait discours',             true),
  -- RFM
  ((SELECT id FROM medias WHERE sigle='RFM'),  'Ousmane Sonko',          'politique',    'PASTEF',  5400, '2024-10-28', 'Interview longue durée',       true),
  ((SELECT id FROM medias WHERE sigle='RFM'),  'Amadou Ba',              'opposition',   'APR',     2160, '2024-10-28', 'Réponse',                      false),
  ((SELECT id FROM medias WHERE sigle='RFM'),  'Macky Sall',             'gouvernement', 'APR',     1800, '2024-10-29', 'Allocution présidentielle',    true),
  -- Sud FM
  ((SELECT id FROM medias WHERE sigle='SUDFM'),'Khalifa Sall',           'opposition',   'PS',      3600, '2024-10-28', 'Interview politique',          null),
  ((SELECT id FROM medias WHERE sigle='SUDFM'),'Bassirou Diomaye Faye',  'politique',    'PASTEF',  2700, '2024-10-28', 'Point de presse',              true),
  ((SELECT id FROM medias WHERE sigle='SUDFM'),'Idrissa Seck',           'opposition',   'PDS',     1620, '2024-10-29', 'Réaction',                     null);

-- ─── Seed — Alertes ───────────────────────────────────────────
INSERT INTO alertes_monitoring (media_id, type_alerte, severite, titre, description, statut) VALUES
  ((SELECT id FROM medias WHERE sigle='2STV'),  'desequilibre_parole',   'elevee',    '2STV — Déséquilibre temps de parole opposition vs pouvoir',         'L''opposition représente 78% du temps de parole sur la semaine du 28/10', 'nouvelle'),
  ((SELECT id FROM medias WHERE sigle='RTS1'),  'biais_editorial',       'moyenne',   'RTS1 — Ton favorable systématique au gouvernement',                 'Analyse sémantique révèle 85% de tonalité positive pour les sujets gouvernementaux', 'en_cours'),
  ((SELECT id FROM medias WHERE sigle='TFM'),   'depassement_pub',       'faible',    'TFM — Dépassement quota publicitaire de 3% en soirée (22h-23h)',    'Quota légal de 9min/heure dépassé à 9min18sec en moyenne sur 5 soirées', 'resolue'),
  ((SELECT id FROM medias WHERE sigle='SENTV'), 'absence_pluralisme',    'critique',  'Sen TV — Absence quasi-totale des partis de l''opposition classique', 'PDS et PS absents des journaux télévisés depuis 12 jours consécutifs',  'nouvelle'),
  ((SELECT id FROM medias WHERE sigle='SUDFM'), 'contenu_inapproprie',   'moyenne',   'Sud FM — Diffusion de propos non vérifiés lors du journal 13h',     'Information non sourcée sur des résultats partiels diffusée le 02/11',  'en_cours');

-- ─── Seed — Observations contenu ─────────────────────────────
INSERT INTO observations_contenu (media_id, date_obs, heure_obs, thematique, sous_thematique, ton, duree_minutes, operateur) VALUES
  ((SELECT id FROM medias WHERE sigle='RTS1'),  '2024-10-28', '20:00', 'Politique',      'Élections législatives',  'neutre',   25, 'Agent CNRA 01'),
  ((SELECT id FROM medias WHERE sigle='RTS1'),  '2024-10-28', '20:30', 'Économie',       'Budget 2025',             'positif',  12, 'Agent CNRA 01'),
  ((SELECT id FROM medias WHERE sigle='TFM'),   '2024-10-28', '20:00', 'Politique',      'Campagne électorale',     'neutre',   30, 'Agent CNRA 02'),
  ((SELECT id FROM medias WHERE sigle='TFM'),   '2024-10-28', '21:00', 'Société',        'Sécurité routière',       'negatif',   8, 'Agent CNRA 02'),
  ((SELECT id FROM medias WHERE sigle='2STV'),  '2024-10-28', '20:00', 'Politique',      'Opposition',              'critique', 22, 'Agent CNRA 03'),
  ((SELECT id FROM medias WHERE sigle='RFM'),   '2024-10-28', '07:00', 'Information',    'Revue de presse',         'neutre',   55, 'Agent CNRA 04'),
  ((SELECT id FROM medias WHERE sigle='SUDFM'), '2024-10-28', '13:00', 'Politique',      'Résultats partiels',      'negatif',  18, 'Agent CNRA 05'),
  ((SELECT id FROM medias WHERE sigle='RTS1'),  '2024-10-29', '20:00', 'International',  'Politique étrangère',     'positif',  15, 'Agent CNRA 01'),
  ((SELECT id FROM medias WHERE sigle='TFM'),   '2024-10-29', '20:00', 'Sport',          'Football — Équipe nat.',  'positif',  10, 'Agent CNRA 02'),
  ((SELECT id FROM medias WHERE sigle='2STV'),  '2024-10-29', '20:00', 'Politique',      'Résultats élections',     'neutre',   35, 'Agent CNRA 03');

-- ─── Seed — Rapports ──────────────────────────────────────────
INSERT INTO rapports_veille (titre, periode_debut, periode_fin, type_rapport, statut, redacteur, resume) VALUES
  ('Rapport de veille — Semaine 44 (28 oct – 3 nov 2024)',          '2024-10-28', '2024-11-03', 'hebdomadaire', 'publie',   'Direction CNRA', 'Surveillance intensive de la période pré-électorale. 5 alertes émises dont 1 critique.'),
  ('Rapport spécial — Couverture campagne législative 2024',         '2024-10-20', '2024-11-15', 'special',      'brouillon', 'Cellule Analyse', 'Analyse approfondie du traitement médiatique de la campagne électorale.'),
  ('Rapport mensuel octobre 2024',                                   '2024-10-01', '2024-10-31', 'mensuel',      'publie',   'Direction CNRA', 'Bilan mensuel des activités de monitoring. 23 sessions, 12 alertes, 3 mises en demeure.');
