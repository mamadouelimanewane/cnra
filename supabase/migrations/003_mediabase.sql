-- ============================================================
-- CNRA MediaBase — Migration 003
-- Base de données exhaustive du paysage médiatique sénégalais
-- ============================================================

-- ─── Propriétaires / Groupes médias ──────────────────────────
CREATE TABLE groupes_media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'prive' CHECK (type IN ('public','prive','communautaire','religieux','diaspora')),
  pays_origine TEXT NOT NULL DEFAULT 'Sénégal',
  description TEXT,
  site_web    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Extension de la table medias ─────────────────────────────
ALTER TABLE medias ADD COLUMN IF NOT EXISTS groupe_id      UUID REFERENCES groupes_media(id);
ALTER TABLE medias ADD COLUMN IF NOT EXISTS date_creation  DATE;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS numero_agrement TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS date_agrement  DATE;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS frequence      TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS audience_estimee INTEGER;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS couverture     TEXT DEFAULT 'national' CHECK (couverture IN ('national','regional','local','international'));
ALTER TABLE medias ADD COLUMN IF NOT EXISTS description    TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS adresse        TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS telephone      TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS email          TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS site_web       TEXT;
ALTER TABLE medias ADD COLUMN IF NOT EXISTS latitude       NUMERIC(9,6);
ALTER TABLE medias ADD COLUMN IF NOT EXISTS longitude      NUMERIC(9,6);

-- ─── Journalistes / Présentateurs ────────────────────────────
CREATE TABLE journalistes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  media_id        UUID REFERENCES medias(id),
  poste           TEXT NOT NULL DEFAULT 'journaliste' CHECK (poste IN ('journaliste','presentateur','redacteur_en_chef','correspondant','caméraman','technicien','directeur')),
  specialite      TEXT,
  carte_presse    TEXT UNIQUE,
  date_accreditation DATE,
  actif           BOOLEAN NOT NULL DEFAULT true,
  photo_url       TEXT,
  biographie      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Programmes / Grilles ─────────────────────────────────────
CREATE TABLE programmes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id    UUID NOT NULL REFERENCES medias(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'information' CHECK (type IN ('information','divertissement','sport','culture','politique','religieux','education','publicite','autre')),
  jour_semaine TEXT,
  heure_debut TIME,
  heure_fin   TIME,
  description TEXT,
  actif       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audits / Contrôles CNRA ──────────────────────────────────
CREATE TABLE audits_media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id    UUID NOT NULL REFERENCES medias(id),
  date_audit  DATE NOT NULL DEFAULT CURRENT_DATE,
  type_audit  TEXT NOT NULL DEFAULT 'routine' CHECK (type_audit IN ('routine','suite_signalement','renouvellement_agrement','urgence')),
  auditeur    TEXT,
  score_conformite INTEGER CHECK (score_conformite BETWEEN 0 AND 100),
  observations TEXT,
  recommandations TEXT,
  statut      TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours','termine','archive')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Statistiques d'audience (données déclarées) ──────────────
CREATE TABLE stats_audience (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id    UUID NOT NULL REFERENCES medias(id),
  periode     TEXT NOT NULL,
  annee       INTEGER NOT NULL,
  trimestre   INTEGER CHECK (trimestre BETWEEN 1 AND 4),
  audience_hebdo INTEGER,
  parts_marche NUMERIC(5,2),
  source      TEXT DEFAULT 'CNRA',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Index ────────────────────────────────────────────────────
CREATE INDEX idx_journalistes_media ON journalistes(media_id);
CREATE INDEX idx_programmes_media   ON programmes(media_id);
CREATE INDEX idx_audits_media       ON audits_media(media_id);
CREATE INDEX idx_stats_audience_media ON stats_audience(media_id);

-- ─── RLS ──────────────────────────────────────────────────────
ALTER TABLE groupes_media   ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalistes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits_media    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats_audience  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_groupes"     ON groupes_media   FOR SELECT USING (true);
CREATE POLICY "public_read_journalistes" ON journalistes   FOR SELECT USING (true);
CREATE POLICY "public_read_programmes"  ON programmes      FOR SELECT USING (true);
CREATE POLICY "auth_all_audits"         ON audits_media    FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "public_read_stats_aud"   ON stats_audience  FOR SELECT USING (true);
CREATE POLICY "auth_write_groupes"      ON groupes_media   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_journalistes" ON journalistes    FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_programmes"   ON programmes      FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── Données initiales — Groupes médias ───────────────────────
INSERT INTO groupes_media (nom, type, description) VALUES
  ('Radiodiffusion Télévision Sénégalaise', 'public', 'Groupe audiovisuel public national du Sénégal'),
  ('Futurs Médias Group', 'prive', 'Groupe médias de Youssou Ndour — TFM, RFM, L''Obs'),
  ('Excaf Télécom', 'prive', 'Groupe de distribution et production audiovisuelle — 2STV, Excaf TV'),
  ('Groupe Walfadjri', 'prive', 'Groupe de presse sénégalais — Walf TV, Walf FM'),
  ('Sen TV Group', 'prive', 'Groupe audiovisuel privé sénégalais — Sen TV, 7TV'),
  ('Groupe Sud Communication', 'prive', 'Groupe de presse — Sud FM, Sud Quotidien');

-- ─── Enrichissement des médias existants ──────────────────────
UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Radiodiffusion Télévision Sénégalaise'),
  date_creation = '1972-01-01', numero_agrement = 'CNRA-TV-001',
  audience_estimee = 3500000, couverture = 'national',
  description = 'Première chaîne publique nationale du Sénégal, créée en 1972.',
  frequence = 'Satellite + Hertzien', latitude = 14.7167, longitude = -17.4677
WHERE sigle = 'RTS1';

UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Futurs Médias Group'),
  date_creation = '2000-06-01', numero_agrement = 'CNRA-TV-007',
  audience_estimee = 2800000, couverture = 'national',
  description = 'Télévision Futurs Médias, chaîne privée du groupe de Youssou Ndour.',
  frequence = 'Satellite + TNT', latitude = 14.6937, longitude = -17.4441
WHERE sigle = 'TFM';

UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Excaf Télécom'),
  date_creation = '2003-09-01', numero_agrement = 'CNRA-TV-009',
  audience_estimee = 1900000, couverture = 'national',
  description = '2STV, chaîne privée généraliste du groupe Excaf Télécom.',
  frequence = 'TNT + Satellite'
WHERE sigle = '2STV';

UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Sen TV Group'),
  date_creation = '2010-03-01', numero_agrement = 'CNRA-TV-015',
  audience_estimee = 1200000, couverture = 'national',
  description = 'Sen TV, chaîne d''information et de divertissement.'
WHERE sigle = 'SENTV';

UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Sen TV Group'),
  date_creation = '2012-07-01', numero_agrement = 'CNRA-TV-018',
  audience_estimee = 800000, couverture = 'national',
  description = '7TV, chaîne jeunesse et culture du groupe Sen TV.'
WHERE sigle = '7TV';

UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Futurs Médias Group'),
  date_creation = '1997-01-01', numero_agrement = 'CNRA-RAD-003',
  audience_estimee = 4200000, couverture = 'national',
  description = 'Radio Futurs Médias, première radio privée musicale du Sénégal.',
  frequence = '96.7 MHz Dakar'
WHERE sigle = 'RFM';

UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Radiodiffusion Télévision Sénégalaise'),
  date_creation = '1962-01-01', numero_agrement = 'CNRA-RAD-001',
  audience_estimee = 5000000, couverture = 'national',
  description = 'Radio nationale du Sénégal, la plus ancienne station du pays.',
  frequence = '92.5 MHz Dakar'
WHERE sigle = 'RS';

UPDATE medias SET
  groupe_id = (SELECT id FROM groupes_media WHERE nom = 'Groupe Sud Communication'),
  date_creation = '1994-05-01', numero_agrement = 'CNRA-RAD-008',
  audience_estimee = 3100000, couverture = 'national',
  description = 'Sud FM, radio d''information du groupe Sud Communication.',
  frequence = '98.5 MHz Dakar'
WHERE sigle = 'SUDFM';

-- ─── Journalistes ─────────────────────────────────────────────
INSERT INTO journalistes (nom, prenom, media_id, poste, specialite, carte_presse) VALUES
  ('Diallo', 'Fatou', (SELECT id FROM medias WHERE sigle='RTS1'), 'presentateur', 'Politique', 'CP-2024-001'),
  ('Ndiaye', 'Ousmane', (SELECT id FROM medias WHERE sigle='RTS1'), 'redacteur_en_chef', 'Information générale', 'CP-2024-002'),
  ('Seck', 'Aminata', (SELECT id FROM medias WHERE sigle='TFM'), 'presentateur', 'Économie', 'CP-2024-003'),
  ('Fall', 'Ibrahima', (SELECT id FROM medias WHERE sigle='TFM'), 'journaliste', 'Sport', 'CP-2024-004'),
  ('Mbaye', 'Rokhaya', (SELECT id FROM medias WHERE sigle='2STV'), 'presentateur', 'Culture', 'CP-2024-005'),
  ('Diouf', 'Mamadou', (SELECT id FROM medias WHERE sigle='RFM'), 'journaliste', 'Politique', 'CP-2024-006'),
  ('Sarr', 'Khady', (SELECT id FROM medias WHERE sigle='SUDFM'), 'presentateur', 'Société', 'CP-2024-007'),
  ('Ly', 'Aliou', (SELECT id FROM medias WHERE sigle='SENTV'), 'directeur', 'Information', 'CP-2024-008');

-- ─── Programmes ───────────────────────────────────────────────
INSERT INTO programmes (media_id, nom, type, jour_semaine, heure_debut, heure_fin) VALUES
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'Journal de 20h', 'information', 'Lun-Dim', '20:00', '20:30'),
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'Grand Jury', 'politique', 'Dimanche', '10:00', '12:00'),
  ((SELECT id FROM medias WHERE sigle='TFM'), 'Infos 20h', 'information', 'Lun-Dim', '20:00', '20:35'),
  ((SELECT id FROM medias WHERE sigle='TFM'), 'Plateau Politique', 'politique', 'Vendredi', '21:00', '23:00'),
  ((SELECT id FROM medias WHERE sigle='RFM'), 'Revue de Presse', 'information', 'Lun-Sam', '07:00', '08:00'),
  ((SELECT id FROM medias WHERE sigle='RFM'), 'Bonjour Sénégal', 'information', 'Lun-Ven', '06:00', '09:00');

-- ─── Stats audience ───────────────────────────────────────────
INSERT INTO stats_audience (media_id, periode, annee, trimestre, audience_hebdo, parts_marche) VALUES
  ((SELECT id FROM medias WHERE sigle='RTS1'), 'T3 2024', 2024, 3, 3500000, 28.5),
  ((SELECT id FROM medias WHERE sigle='TFM'), 'T3 2024', 2024, 3, 2800000, 22.8),
  ((SELECT id FROM medias WHERE sigle='RFM'), 'T3 2024', 2024, 3, 4200000, 34.2),
  ((SELECT id FROM medias WHERE sigle='2STV'), 'T3 2024', 2024, 3, 1900000, 15.5),
  ((SELECT id FROM medias WHERE sigle='SUDFM'), 'T3 2024', 2024, 3, 3100000, 25.3),
  ((SELECT id FROM medias WHERE sigle='SENTV'), 'T3 2024', 2024, 3, 1200000, 9.8);
