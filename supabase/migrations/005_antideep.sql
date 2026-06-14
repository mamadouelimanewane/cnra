-- ============================================================
-- CNRA AntiDeep — Migration 005
-- Détection de deepfakes et désinformation audiovisuelle
-- ============================================================

-- ─── Contenus soumis à analyse ────────────────────────────────
CREATE TABLE IF NOT EXISTS contenus_analyses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre            TEXT NOT NULL,
  type_contenu     TEXT NOT NULL CHECK (type_contenu IN ('video','audio','image','texte','url')),
  url_source       TEXT,
  plateforme       TEXT,
  date_publication TIMESTAMPTZ,
  date_soumission  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  soumis_par       TEXT,
  statut_analyse   TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_analyse IN ('en_attente','en_cours','termine','erreur')),
  score_deepfake   INTEGER CHECK (score_deepfake BETWEEN 0 AND 100),
  score_manipulation INTEGER CHECK (score_manipulation BETWEEN 0 AND 100),
  verdict          TEXT CHECK (verdict IN ('authentique','suspect','deepfake_confirme','manipulation_confirmed','indetermmine')),
  description      TEXT,
  tags             TEXT[],
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Campagnes de désinformation ──────────────────────────────
CREATE TABLE IF NOT EXISTS campagnes_desinfo (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom             TEXT NOT NULL,
  description     TEXT,
  date_detection  DATE NOT NULL DEFAULT CURRENT_DATE,
  date_debut_est  DATE,
  statut          TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active','contenue','neutralisee','surveillee')),
  niveau_menace   TEXT NOT NULL DEFAULT 'moyen' CHECK (niveau_menace IN ('faible','moyen','eleve','critique')),
  origine_suspectee TEXT,
  cibles          TEXT[],
  nb_contenus     INTEGER DEFAULT 0,
  nb_partages_est INTEGER DEFAULT 0,
  plateformes     TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sources suspectes ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources_suspectes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom             TEXT NOT NULL,
  type_source     TEXT NOT NULL CHECK (type_source IN ('site_web','compte_social','chaine_telegram','groupe_whatsapp','autre')),
  url             TEXT,
  plateforme      TEXT,
  pays_origine    TEXT,
  niveau_confiance INTEGER CHECK (niveau_confiance BETWEEN 0 AND 100),
  nb_contenus_signales INTEGER DEFAULT 0,
  actif           BOOLEAN DEFAULT true,
  description     TEXT,
  date_detection  DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Signatures de deepfakes (empreintes connues) ─────────────
CREATE TABLE IF NOT EXISTS signatures_deepfake (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hash_contenu    TEXT UNIQUE NOT NULL,
  type_signature  TEXT NOT NULL CHECK (type_signature IN ('video','audio','image')),
  technique       TEXT,
  outil_detecte   TEXT,
  date_ajout      DATE DEFAULT CURRENT_DATE,
  actif           BOOLEAN DEFAULT true,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Alertes AntiDeep ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alertes_antideep (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contenu_id     UUID REFERENCES contenus_analyses(id),
  campagne_id    UUID REFERENCES campagnes_desinfo(id),
  type_alerte    TEXT NOT NULL,
  severite       TEXT NOT NULL DEFAULT 'moyenne' CHECK (severite IN ('faible','moyenne','elevee','critique')),
  titre          TEXT NOT NULL,
  description    TEXT,
  statut         TEXT NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle','en_cours','resolue','classee')),
  date_alerte    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Index ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contenus_statut  ON contenus_analyses(statut_analyse);
CREATE INDEX IF NOT EXISTS idx_contenus_verdict ON contenus_analyses(verdict);
CREATE INDEX IF NOT EXISTS idx_campagnes_statut ON campagnes_desinfo(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_ad_sev   ON alertes_antideep(severite);

-- ─── RLS ──────────────────────────────────────────────────────
ALTER TABLE contenus_analyses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagnes_desinfo   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources_suspectes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures_deepfake ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertes_antideep    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_contenus"    ON contenus_analyses   FOR SELECT USING (true);
CREATE POLICY "public_read_campagnes"   ON campagnes_desinfo   FOR SELECT USING (true);
CREATE POLICY "public_read_sources"     ON sources_suspectes   FOR SELECT USING (true);
CREATE POLICY "public_read_signatures"  ON signatures_deepfake FOR SELECT USING (true);
CREATE POLICY "public_read_alertes_ad"  ON alertes_antideep    FOR SELECT USING (true);
CREATE POLICY "auth_write_contenus"     ON contenus_analyses   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_campagnes"    ON campagnes_desinfo   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_sources"      ON sources_suspectes   FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_signatures"   ON signatures_deepfake FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_write_alertes_ad"   ON alertes_antideep    FOR ALL USING (auth.uid() IS NOT NULL);

-- ─── Seed — Contenus analysés ─────────────────────────────────
INSERT INTO contenus_analyses (titre, type_contenu, url_source, plateforme, date_publication, soumis_par, statut_analyse, score_deepfake, score_manipulation, verdict, description, tags) VALUES
  ('Vidéo virale — Faux discours attribué au Président Faye', 'video', 'https://t.me/fake_channel/1234', 'Telegram', '2024-11-02 14:30:00', 'Cellule CNRA', 'termine', 94, 91, 'deepfake_confirme', 'Vidéo générée par IA imitant la voix et le visage du Président. Diffusée 48h avant les élections.', ARRAY['deepfake','politique','elections','presidentiel']),
  ('Audio — Fausse déclaration ministre de l''Intérieur', 'audio', 'https://wa.me/fake_audio', 'WhatsApp', '2024-11-01 08:15:00', 'Signalement citoyen', 'termine', 12, 87, 'manipulation_confirmed', 'Audio authentique du ministre monté et découpé pour inverser le sens de ses propos.', ARRAY['montage','audio','ministre','interieur']),
  ('Image — Photo truquée meeting PASTEF Dakar', 'image', 'https://twitter.com/fake_acct/status/123', 'Twitter/X', '2024-10-30 19:00:00', 'Cellule CNRA', 'termine', 15, 72, 'manipulation_confirmed', 'Photo d''archive de 2019 recadrée et recolorée présentée comme un meeting récent.', ARRAY['image','meeting','manipulation','foule']),
  ('Vidéo — Deepfake journaliste RTS annonçant fraude', 'video', 'https://facebook.com/fake/video/456', 'Facebook', '2024-11-03 22:00:00', 'RTS (signalement)', 'termine', 89, 88, 'deepfake_confirme', 'Deepfake d''une présentatrice de RTS1 annonçant des fraudes électorales non avérées.', ARRAY['deepfake','journaliste','rts','fraude']),
  ('Texte — Faux communiqué CNRA sur résultats partiels', 'texte', NULL, 'WhatsApp', '2024-11-04 06:45:00', 'Direction CNRA', 'termine', 0, 95, 'manipulation_confirmed', 'Document Word imitant la charte graphique du CNRA avec de faux résultats électoraux.', ARRAY['faux_document','cnra','resultats','elections']),
  ('URL — Site clone simulant le portail officiel CENA', 'url', 'https://cena-senegal.net', 'Web', '2024-11-03 12:00:00', 'Cellule CNRA', 'termine', 0, 98, 'manipulation_confirmed', 'Site web cloné imitant le portail officiel de la CENA pour diffuser de faux résultats.', ARRAY['clone_site','cena','phishing','elections']),
  ('Vidéo — Violence électorale hors contexte', 'video', 'https://tiktok.com/fake/video', 'TikTok', '2024-11-02 16:20:00', 'Signalement citoyen', 'termine', 8, 45, 'suspect', 'Vidéo de violence filmée en 2021 au Mali, diffusée comme si elle venait du Sénégal le jour du scrutin.', ARRAY['hors_contexte','violence','elections']),
  ('Audio — Rumeur sur coupure internet le jour du vote', 'audio', NULL, 'WhatsApp', '2024-11-04 05:00:00', 'Signalement citoyen', 'termine', 5, 30, 'authentique', 'Audio vérifié — rumeur non fondée, aucune coupure planifiée selon les autorités compétentes.', ARRAY['rumeur','internet','elections']);

-- ─── Seed — Campagnes ─────────────────────────────────────────
INSERT INTO campagnes_desinfo (nom, description, date_detection, date_debut_est, statut, niveau_menace, origine_suspectee, cibles, nb_contenus, nb_partages_est, plateformes) VALUES
  ('OpElection2024', 'Campagne coordonnée de deepfakes visant à déstabiliser les élections législatives du 17 novembre 2024. Production industrielle de faux contenus audio/vidéo.', '2024-10-28', '2024-10-15', 'contenue', 'critique', 'Acteurs étrangers non identifiés', ARRAY['PASTEF','gouvernement','CENA','médias'], 23, 850000, ARRAY['Telegram','WhatsApp','Facebook','TikTok']),
  ('FakeRTS', 'Série de deepfakes imitant des journalistes de RTS1 pour diffuser de fausses informations officielles.', '2024-11-03', '2024-11-01', 'active', 'eleve', 'Inconnu', ARRAY['RTS1','journalistes','opinion_publique'], 6, 120000, ARRAY['Facebook','WhatsApp']),
  ('DocFaux-CNRA', 'Circulation de faux documents officiels imitant le CNRA et la CENA.', '2024-11-04', '2024-11-03', 'neutralisee', 'eleve', 'Inconnu', ARRAY['CNRA','CENA','electeurs'], 4, 45000, ARRAY['WhatsApp','Telegram']),
  ('HorsContexte-Violence', 'Diffusion systématique de vidéos de violence hors contexte pour alimenter la peur et la méfiance.', '2024-11-02', '2024-10-25', 'surveillee', 'moyen', 'Comptes automatisés', ARRAY['opinion_publique','electeurs'], 12, 320000, ARRAY['TikTok','Twitter/X','Facebook']);

-- ─── Seed — Sources suspectes ─────────────────────────────────
INSERT INTO sources_suspectes (nom, type_source, plateforme, pays_origine, niveau_confiance, nb_contenus_signales, description) VALUES
  ('Canal Infos SN Officiel', 'chaine_telegram', 'Telegram', 'Inconnu', 8, 14, 'Chaîne Telegram se présentant comme source officielle. Aucune accréditation. Diffuse des deepfakes et montages.'),
  ('SenActu247', 'site_web', 'Web', 'Inconnu', 12, 8, 'Site web clone imitant des médias légitimes. Hébergé hors du Sénégal. Contenu généré par IA.'),
  ('Vérité Sénégal', 'compte_social', 'Facebook', 'Inconnu', 5, 19, 'Page Facebook créée 3 semaines avant les élections. 45 000 abonnés en 10 jours. Comportement de bot.'),
  ('InfosExclu221', 'groupe_whatsapp', 'WhatsApp', 'Inconnu', 15, 11, 'Réseau de groupes WhatsApp coordonnés diffusant les mêmes contenus à des intervalles réguliers.'),
  ('TruthSN_Network', 'chaine_telegram', 'Telegram', 'Inconnu', 6, 7, 'Réseau de 12 chaînes Telegram liées diffusant du contenu coordonné en wolof et français.');

-- ─── Seed — Signatures ────────────────────────────────────────
INSERT INTO signatures_deepfake (hash_contenu, type_signature, technique, outil_detecte, description) VALUES
  ('sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'video', 'Face swap IA', 'DeepFaceLab v3', 'Empreinte de la vidéo deepfake Président Faye — référence confirmée'),
  ('sha256:b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a', 'video', 'Lip sync IA', 'Wav2Lip', 'Deepfake journaliste RTS — technique lip sync identifiée'),
  ('sha256:c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2', 'image', 'Photoshop + IA', 'Stable Diffusion inpainting', 'Image meeting PASTEF manipulée — signature extraite'),
  ('sha256:d4e5f6789012345678901234567890abcdef1234567890abcdef1234567ab2c3', 'audio', 'Voice cloning', 'ElevenLabs clone', 'Faux audio ministre — voix clonée par IA identifiée');

-- ─── Seed — Alertes AntiDeep ──────────────────────────────────
INSERT INTO alertes_antideep (type_alerte, severite, titre, description, statut) VALUES
  ('deepfake_critique',    'critique', 'DEEPFAKE CONFIRMÉ — Vidéo Président Faye en circulation massive',    'Deepfake haute qualité diffusé sur Telegram, 850k vues estimées. Démenti officiel requis en urgence.', 'en_cours'),
  ('clone_site',           'critique', 'SITE CLONE — Portail CENA falsifié actif',                           'Site cena-senegal.net actif avec faux résultats. Signalement ARTP pour takedown immédiat.', 'resolue'),
  ('reseau_coordonne',     'elevee',   'RÉSEAU COORDONNÉ — 12 chaînes Telegram liées détectées',             'Comportement coordonné identifié. Publication synchronisée toutes les 47 minutes.', 'en_cours'),
  ('faux_document_officiel','elevee',  'FAUX DOCUMENT — Usurpation identité CNRA',                           'Document Word circulant avec logo CNRA falsifié. Plainte déposée.', 'resolue'),
  ('video_hors_contexte',  'moyenne',  'VIDÉO HORS CONTEXTE — Violence Mali présentée comme sénégalaise',    'Vidéo vérifiée comme étant du Mali 2021. Fact-check publié.', 'resolue');
