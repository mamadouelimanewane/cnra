const PDFDocument = require("C:/gravity/node_modules/pdfkit")
const fs = require("fs")
const path = require("path")

// ──────────────────────────────────────────────────────────────────────────────
// PALETTE
// ──────────────────────────────────────────────────────────────────────────────
const NAVY  = "#1A3A6B"
const GOLD  = "#C9A84C"
const WHITE = "#FFFFFF"
const LIGHT = "#F4F6FA"
const GRAY  = "#6B7280"
const DARK  = "#111827"
const SILVER= "#E5E7EB"

// ──────────────────────────────────────────────────────────────────────────────
// DATA — same as DOCX script
// ──────────────────────────────────────────────────────────────────────────────
const APPS = [
  {
    num: "1", name: "MediaBase",
    subtitle: "Base de données des médias audiovisuels",
    color: NAVY,
    pages: 25, tables: 14,
    description: "MediaBase est le référentiel central de tous les opérateurs de médias audiovisuels sous régulation du CNRA. Il centralise les licences, les actionnaires, les sanctions et les données structurelles du paysage médiatique sénégalais. C'est la source de vérité unique pour les agents de régulation.",
    features: [
      { cat: "Tableau de bord", items: ["KPIs globaux en temps réel (médias actifs, licences, sanctions en cours)","Graphiques de répartition par type de média (TV, radio, en ligne)","Alertes de renouvellement imminentes de licences","Carte géographique de couverture nationale"] },
      { cat: "Gestion des licences", items: ["Liste complète des licences avec filtres multi-critères","Fiche détaillée par licence (conditions, zones de couverture, fréquences)","Génération PDF officielle avec en-tête CNRA, cachet et QR code","QR code de vérification d'authenticité (route API /api/licences/[id]/qr)","Suivi des alertes de renouvellement (J-90, J-30, J-0)","Workflow de renouvellement avec historique des demandes"] },
      { cat: "Répertoire des médias", items: ["Annuaire complet par type (télévision, radio, en ligne)","Fiche complète : actionnaires, grille de programmes, audiences","Graphe SVG interactif des liens capitalistiques entre médias","Carte SVG géographique avec filtres par type et région","Analyse de concentration HHI (indice Herfindahl-Hirschman) par marché","Vue panoramique du paysage audiovisuel sénégalais"] },
      { cat: "Annuaire des professionnels", items: ["Répertoire des journalistes accrédités (photo, spécialité, médias)","Annuaire général des professionnels des médias","Historique de carrière et mutations inter-médias","Accréditations spéciales (Présidence, Assemblée nationale, armées)"] },
      { cat: "Discipline et sanctions", items: ["Registre des sanctions disciplinaires prononcées","Suivi de l'exécution des sanctions (payées, en cours, contestées)","Historique complet par média avec montants et motifs","Génération d'états des lieux pour rapports officiels"] },
      { cat: "Données & intégrations", items: ["Import par OCR simulé (4 étapes : scan → revue → import)","Export multi-format : CSV (UTF-8 BOM), XLSX, JSON — 6 tables","Gestion des webhooks avec HMAC-SHA256 et test en un clic","API publique documentée avec 4 endpoints REST et clés API CRUD","Génération de 5 modèles de rapports officiels téléchargeables"] },
    ],
    db_tables: [
      ["groupes_media","Holdings et groupes de presse"],
      ["journalistes","Annuaire des journalistes accrédités"],
      ["programmes","Grilles de programmes déclarées"],
      ["audits_media","Audits de conformité"],
      ["stats_audience","Statistiques d'audience"],
      ["licences","Licences audiovisuelles (conditions, zones, fréquences)"],
      ["mutations_media","Historique des mutations de propriété"],
      ["accreditations_speciales","Accréditations présidentielles et institutionnelles"],
      ["historique_carriere","Parcours des journalistes"],
      ["sanctions_disciplinaires","Sanctions avec montants et statuts"],
      ["liens_capitalistiques","Participations croisées entre entités"],
      ["webhook_configs","Webhooks HMAC configurés par les clients"],
      ["api_keys","Clés API publique avec quotas"],
      ["alertes_renouvellement","Alertes automatiques de renouvellement"],
    ],
  },
  {
    num: "2", name: "MediaWatch",
    subtitle: "Monitoring, pluralisme & temps de parole",
    color: "#166534",
    pages: 27, tables: 19,
    description: "MediaWatch est la plateforme de veille en temps réel des contenus diffusés par les médias audiovisuels. Elle combine l'analyse NLP (transcription, sentiment, entités nommées), le monitoring du pluralisme, la détection d'incidents de signal et les outils de régulation juridique. C'est l'outil opérationnel quotidien des analystes du CNRA.",
    features: [
      { cat: "Tableau de bord veille", items: ["Vue synthétique du monitoring en cours (médias, alertes, score global)","KPIs temps réel : émissions transcrites, incidents, score pluralisme moyen","Graphique d'évolution du pluralisme sur 30 jours","Liste des 5 dernières alertes avec niveaux de sévérité"] },
      { cat: "Transcription & NLP", items: ["Transcription STT en 3 langues : français, wolof, pulaar/fula","Simulation du flux (en_cours → terminé) avec score de confiance","Analyse de sentiment par segment et locuteur (-1.0 à +1.0)","Détection des émotions (joie, colère, peur, surprise, tristesse)","Extraction d'entités nommées NER : PERSONNE, ORG, LIEU, ÉVÉNEMENT, DATE, PARTI","Nuage de bulles des entités les plus mentionnées avec sentiment"] },
      { cat: "Score de pluralisme", items: ["Score global /100 avec jauge SVG (seuil CNRA ≥ 60)","4 dimensions : politique, genre, régional, linguistique","RadarChart multi-dimensionnel par média","Heatmap hebdomadaire des thématiques (interpolation RGB)","Diagramme Sankey SVG des flux d'opinions","Comparaison ordinaire vs période électorale"] },
      { cat: "Monitoring des incidents", items: ["Grille de statut de 6 chaînes en direct avec viewers simulés","Détection d'incidents : coupure, silence suspect, interruption, bruit, freeze","Horodatage et durée avec hash SHA-256 de la preuve","Alertes avec niveaux de sévérité et assignation"] },
      { cat: "Outils de régulation", items: ["Workflow mise en demeure 5 étapes : brouillon → AR","Template pré-rempli conforme aux textes réglementaires CNRA","Archivage légal des preuves avec hash SHA-256 (Web Crypto API)","Saisines judiciaires avec génération auto des pièces jointes"] },
      { cat: "Partenaires & publication", items: ["Portail partenaires : accréditation OSC, partis, ambassades","Tokens API auto-générés avec affichage masqué et copie","Widget public intégrable (3 formats : compact, carte, complet)","Assistant IA d'analyse en langage naturel avec mini-graphiques"] },
    ],
    db_tables: [
      ["monitoring_sessions","Sessions de veille actives"],
      ["transcriptions","Textes transcrits avec langue et score de confiance"],
      ["analyses_sentiment","Scores sentiment par segment (-1.0 à +1.0)"],
      ["entites_nommees","Entités NER extraites avec type et mention_count"],
      ["incidents_signal","Incidents techniques (coupure, silence, freeze)"],
      ["scores_pluralisme","Scores hebdomadaires par média et dimension"],
      ["heatmap_themes","Densité thématique par jour × heure"],
      ["flux_opinions","Flux source → cible pour diagramme Sankey"],
      ["preuves_legales","Preuves avec hash SHA-256 immuable"],
      ["periodes_electorales","Définition des périodes avec dates limites"],
      ["connecteurs_streaming","Flux live configurés (YouTube, M3U8, RTMP…)"],
      ["mentions_reseaux_sociaux","Mentions collectées sur 4 plateformes"],
      ["partenaires","Partenaires accrédités avec token et niveau d'accès"],
      ["saisines_judiciaires","Dossiers judiciaires avec pièces jointes"],
      ["mises_en_demeure","Workflow complet avec 5 statuts"],
      ["alertes_monitoring","Alertes déclenchées avec niveaux de sévérité"],
      ["observations_contenu","Observations manuelles des analystes"],
      ["rapports_veille","Rapports générés automatiquement"],
      ["temps_parole","Mesures de temps de parole par locuteur"],
    ],
  },
  {
    num: "3", name: "CitoyenCNRA",
    subtitle: "Portail public de participation citoyenne",
    color: "#7c3aed",
    pages: 8, tables: 5,
    description: "CitoyenCNRA est la vitrine publique du CNRA destinée aux citoyens sénégalais. Elle permet à tout citoyen de signaler une infraction médiatique, consulter les décisions du CNRA, signer des pétitions et se former à l'éducation aux médias. L'application est accessible sans authentification.",
    features: [
      { cat: "Formulaire de signalement", items: ["Formulaire guidé en 5 étapes : Type → Description → Preuves → Contact → Envoi","4 types d'infraction : déséquilibre temps de parole, contenu partisan, temps non déclaré, autre","Numéro de dossier auto au format CNRA-000001 (séquence PostgreSQL)","Option de signalement anonyme avec masquage des coordonnées","Upload de pièces justificatives (PNG, JPG, MP4, PDF, max 10 Mo)","Confirmation avec numéro de dossier à conserver"] },
      { cat: "Observatoire du pluralisme", items: ["Données officielles de monitoring en temps réel depuis ElectroWatch","BarChart temps de parole par parti (minutes, coloré par couleur officielle)","PieChart répartition globale en pourcentage","Tableau détaillé : parti, sigle, temps total, interventions, part (%)"] },
      { cat: "Pétitions citoyennes", items: ["Liste des pétitions actives avec filtres","KPIs : pétitions actives, total signatures, pétitions acceptées","Barre de progression vers l'objectif avec pourcentage atteint","Signature en un clic avec anti-doublon par hash IP (SHA-256)","Formulaire de création de pétition soumis au CNRA pour validation"] },
      { cat: "Décisions & sanctions", items: ["Registre public des décisions CNRA (sanctions, avertissements, rapports)","Filtres par type de décision et recherche plein texte","Affichage du montant des sanctions financières","Téléchargement des décisions en PDF"] },
      { cat: "Éducation aux médias", items: ["3 fiches pédagogiques (débutant / intermédiaire) avec modal de lecture","Thèmes : pluralisme médiatique, contenu partisan, temps de parole électoral","Quiz interactif 4 questions avec correction immédiate et explication","Score final avec recommandations personnalisées"] },
    ],
    db_tables: [
      ["signalements","Signalements citoyens avec numéro dossier auto et statuts"],
      ["petitions","Pétitions avec objectif, compteur et workflow de validation"],
      ["signatures_petition","Anti-doublon par hash IP, trigger auto-incrément du compteur"],
      ["consultations_portail","Analytics RGPD-friendly (section visitée, sans IP)"],
      ["abonnements_alertes","Newsletter opt-in avec token de désinscription sécurisé"],
    ],
  },
  {
    num: "4", name: "ElectroWatch",
    subtitle: "Observatoire électoral des médias",
    color: "#92400e",
    pages: 16, tables: 12,
    description: "ElectroWatch est le système de monitoring en temps réel du temps de parole politique pendant les campagnes électorales. Il permet aux agents CNRA de saisir les interventions des partis, de détecter automatiquement les déséquilibres, de déclencher des alertes et de gérer les sanctions. Il dispose d'une page publique d'observatoire accessible à tous.",
    features: [
      { cat: "Tableau de bord", items: ["Vue synthétique de la campagne électorale en cours","KPIs : total interventions, temps cumulé, médias couverts, partis monitorés","Graphique temps de parole par parti en temps réel","Classement des médias les plus actifs","Dernières alertes de déséquilibre avec niveaux de priorité"] },
      { cat: "Gestion des campagnes", items: ["Création de campagnes électorales (présidentielle, législative, locale)","Définition de la période, des seuils d'alerte et des partis","Activation / clôture des campagnes avec archivage","Historique de toutes les campagnes passées"] },
      { cat: "Saisie des interventions", items: ["Formulaire de saisie rapide : média, parti, locuteur, durée, type","Validation en temps réel des données saisies","Import CSV des interventions par lot","Historique des saisies par agent avec horodatage"] },
      { cat: "Alertes de déséquilibre", items: ["Détection automatique des écarts (seuil configurable)","Niveaux d'alerte : information, avertissement, critique","Assignation aux agents pour traitement","Workflow de résolution (nouvelle → en cours → résolue → classée)"] },
      { cat: "Vues stratégiques", items: ["Vue Directeur : synthèse exécutive avec indicateurs et tendances","Salle de crise : tableau de bord temps réel pour urgences","Assistant IA : analyse des données en langage naturel","Observatoire public : page accessible sans authentification","Formulaire de signalement public intégré"] },
    ],
    db_tables: [
      ["partis","Partis politiques avec sigles, couleurs et représentants"],
      ["medias","Médias sous surveillance électorale"],
      ["campagnes","Campagnes électorales avec seuils et périodes"],
      ["interventions","Temps de parole saisis par les agents"],
      ["alertes","Alertes de déséquilibre avec statuts et assignations"],
      ["rapports","Rapports générés avec métadonnées"],
      ["profils","Comptes agents CNRA avec rôles"],
      ["mises_en_demeure","Documents de mise en demeure liés aux alertes"],
      ["sanctions","Sanctions prononcées avec montants et exécution"],
      ["signalements","Signalements citoyens reçus via portail public"],
      ["notifications_log","Journal des notifications email envoyées"],
      ["contacts_cnra","Contacts institutionnels du CNRA"],
    ],
  },
  {
    num: "5", name: "AntiDeep",
    subtitle: "Détection de deepfakes & campagnes de désinformation",
    color: "#7c3aed",
    pages: 10, tables: 5,
    description: "AntiDeep est la plateforme de détection et de suivi des contenus falsifiés (deepfakes, images manipulées, fausses informations) et des campagnes de désinformation coordonnées ciblant le paysage médiatique sénégalais. Elle s'appuie sur des modèles d'IA pour analyser les contenus soumis et générer des alertes automatiques.",
    features: [
      { cat: "Tableau de bord détection", items: ["KPIs : contenus analysés, deepfakes confirmés, campagnes actives, sources suspectes","PieChart de répartition des verdicts (deepfake, manipulation, suspect, authentique)","BarChart des contenus par type (vidéo, image, audio, texte)","Liste des 5 dernières alertes critiques avec statuts"] },
      { cat: "Moteur de détection IA", items: ["Analyse IA avec score de confiance (0-100%)","5 types d'altération : deepfake vidéo, synthèse vocale, manipulation image, fausse transcription, montage audio","Verdict en 5 niveaux : deepfake confirmé, manipulation, suspect, indéterminé, authentique","Extraction des indicateurs techniques ayant motivé le verdict","Progression de l'analyse avec étapes détaillées"] },
      { cat: "Sources & campagnes", items: ["Cartographie des sources identifiées comme productrices de faux contenus","Score de crédibilité par source (0-100)","Identification et suivi des campagnes coordonnées","Chronologie des publications liées à une campagne","Évaluation de l'impact et de la portée estimée"] },
      { cat: "Alertes & rapports", items: ["Alertes automatiques sur nouveaux deepfakes confirmés","Niveaux de sévérité : faible, moyenne, élevée, critique","Rapports d'analyse complets exportables en PDF","Statistiques mensuelles et trimestrielles de détection"] },
    ],
    db_tables: [
      ["contenus_analyses","Contenus soumis avec verdict, score et type"],
      ["campagnes_desinfo","Campagnes de désinformation identifiées et suivies"],
      ["sources_suspectes","Sources productrices de faux contenus avec score"],
      ["signatures_deepfake","Empreintes techniques pour détection rapide de variantes"],
      ["alertes_antideep","Alertes générées avec niveaux de sévérité et statuts"],
    ],
  },
  {
    num: "6", name: "EduMedia",
    subtitle: "Formation et éducation aux médias",
    color: "#166534",
    pages: 9, tables: 6,
    description: "EduMedia est la plateforme de formation professionnelle et d'éducation aux médias du CNRA. Elle s'adresse aux journalistes, aux établissements scolaires et aux formateurs. Elle propose des modules pédagogiques structurés, des sessions de formation certifiantes, des quiz d'évaluation et la délivrance de certificats officiels.",
    features: [
      { cat: "Modules pédagogiques", items: ["Catalogue de modules par niveau (débutant, intermédiaire, avancé)","Thèmes : pluralisme, éthique journalistique, fact-checking, réseaux sociaux, deepfakes","Contenu textuel, vidéo et ressources téléchargeables par module","Prérequis et compétences acquises par module"] },
      { cat: "Sessions de formation", items: ["Calendrier des formations (présentiel, distanciel, hybride)","Inscription avec confirmation automatique","Gestion des listes de présence et des émargements","Suivi des statuts : planifiée → en cours → terminée → certifiée"] },
      { cat: "Quiz & certification", items: ["Quiz associés à chaque module avec banque de questions","Score minimum requis pour le certificat (configurable)","Correction automatique avec explications détaillées","Génération de certificats PDF avec numéro unique et QR code","Registre public des certifications délivrées"] },
      { cat: "Établissements partenaires", items: ["Répertoire des établissements scolaires et universités","Convention de partenariat et conditions d'accès","Statistiques de participation par établissement","Export CSV/PDF pour transmission au ministère"] },
    ],
    db_tables: [
      ["etablissements","Établissements scolaires et universités partenaires"],
      ["ressources","Bibliothèque documentaire (guides, textes, études de cas)"],
      ["modules_formation","Modules pédagogiques avec niveau et prérequis"],
      ["formations","Sessions planifiées avec dates, mode et participants"],
      ["quiz","Questions et réponses avec scores de passage"],
      ["certificats","Certificats délivrés avec numéro unique et QR code"],
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const W = 595.28, H = 841.89
const ML = 50, MR = 50, MT = 50, MB = 50
const CW = W - ML - MR  // 495.28

function ensureSpace(doc, needed) {
  if (doc.y + needed > H - MB - 40) doc.addPage()
}

function header(doc) {
  doc.save()
    .rect(0, 0, W, 36).fill(NAVY)
    .fontSize(9).fillColor(WHITE)
    .text("CNRA Sénégal — Documentation Fonctionnelle Complète", ML, 12, { width: CW * 0.6 })
    .text("Plateforme Numérique CNRA · 2026", ML, 12, { width: CW, align: "right" })
    .restore()
}

function footer(doc, pageNum) {
  doc.save()
    .moveTo(ML, H - 32).lineTo(W - MR, H - 32).stroke(SILVER)
    .fontSize(8).fillColor(GRAY)
    .text("Document confidentiel — Processingenierie SURL pour CNRA", ML, H - 24, { width: CW * 0.7 })
    .text(`Page ${pageNum}`, ML, H - 24, { width: CW, align: "right" })
    .restore()
}

function sectionBand(doc, text, bg, fg = WHITE) {
  ensureSpace(doc, 28)
  doc.save()
    .rect(ML, doc.y, CW, 22).fill(bg)
    .fontSize(10).fillColor(fg).font("Helvetica-Bold")
    .text(text, ML + 10, doc.y + 5, { width: CW - 20 })
    .restore()
  doc.y += 24
}

// ──────────────────────────────────────────────────────────────────────────────
// COVER PAGE
// ──────────────────────────────────────────────────────────────────────────────
function drawCover(doc) {
  // Top navy band
  doc.rect(0, 0, W, 90).fill(NAVY)
  doc.fontSize(13).fillColor(WHITE).font("Helvetica-Bold")
    .text("CONSEIL NATIONAL DE RÉGULATION DE L'AUDIOVISUEL", 0, 20, { width: W, align: "center" })
  doc.fontSize(10).fillColor("#C9D8F0").font("Helvetica")
    .text("République du Sénégal  •  CNRA", 0, 48, { width: W, align: "center" })

  // Gold line
  doc.rect(0, 90, W, 6).fill(GOLD)

  // Title block
  doc.y = 130
  doc.fontSize(14).fillColor(GRAY).font("Helvetica")
    .text("Plateforme Numérique CNRA", 0, 130, { width: W, align: "center" })
  doc.fontSize(30).fillColor(NAVY).font("Helvetica-Bold")
    .text("Documentation", 0, 158, { width: W, align: "center" })
  doc.fontSize(30).fillColor(GOLD).font("Helvetica-Bold")
    .text("Fonctionnelle Complète", 0, 194, { width: W, align: "center" })

  // Divider
  doc.moveTo(ML + 80, 238).lineTo(W - MR - 80, 238).lineWidth(2).stroke(GOLD)

  doc.fontSize(11).fillColor(GRAY).font("Helvetica")
    .text("6 applications  ·  95 pages  ·  50+ tables Supabase", 0, 250, { width: W, align: "center" })

  // Stats cards
  const stats = [
    { val: "6",    lbl: "Applications" },
    { val: "95",   lbl: "Pages" },
    { val: "50+",  lbl: "Tables SQL" },
    { val: "130+", lbl: "Fonctionnalités" },
  ]
  const cw = CW / 4, cx = ML
  stats.forEach((s, i) => {
    const x = cx + i * cw
    doc.roundedRect(x + 4, 290, cw - 8, 72, 6).fill(LIGHT)
    doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold")
      .text(s.val, x + 4, 304, { width: cw - 8, align: "center" })
    doc.fontSize(9).fillColor(GRAY).font("Helvetica")
      .text(s.lbl, x + 4, 336, { width: cw - 8, align: "center" })
  })

  // App list
  const apps = APPS
  doc.y = 385
  doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold")
    .text("Applications comprises dans ce document", ML, doc.y, { width: CW })
  doc.y += 18
  doc.moveTo(ML, doc.y).lineTo(W - MR, doc.y).lineWidth(1).stroke(SILVER)
  doc.y += 8

  apps.forEach((a, i) => {
    const y = doc.y
    doc.rect(ML, y, 6, 16).fill(a.color)
    doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold")
      .text(a.name, ML + 14, y + 2, { continued: true, width: 120 })
    doc.fontSize(10).fillColor(GRAY).font("Helvetica")
      .text(" — " + a.subtitle, { continued: false })
    doc.y += 4
  })

  // Bottom
  doc.moveTo(ML, 750).lineTo(W - MR, 750).lineWidth(1).stroke(SILVER)
  doc.fontSize(9).fillColor(GRAY).font("Helvetica")
    .text("Processingenierie SURL  •  Juin 2026", ML, 760, { width: CW, align: "center" })
  doc.fontSize(8).fillColor(GRAY).font("Helvetica-Oblique")
    .text("Document confidentiel — Usage interne CNRA", ML, 774, { width: CW, align: "center" })
}

// ──────────────────────────────────────────────────────────────────────────────
// SUMMARY TABLE
// ──────────────────────────────────────────────────────────────────────────────
function drawSummary(doc) {
  doc.addPage()
  header(doc)
  doc.y = 50

  doc.fontSize(18).fillColor(NAVY).font("Helvetica-Bold")
    .text("Sommaire des applications", ML, doc.y)
  doc.y += 4
  doc.moveTo(ML, doc.y).lineTo(W - MR, doc.y).lineWidth(2).stroke(GOLD)
  doc.y += 16

  // Table header
  const cols = [130, 215, 50, 60, 40]  // App, Description, Pages, Tables, (gap)
  const xs = [ML, ML+130, ML+345, ML+395, ML+455]

  doc.rect(ML, doc.y, CW, 22).fill(NAVY)
  doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold")
  const hdrs = ["Application", "Description courte", "Pages", "Tables SQL", "Stack"]
  hdrs.forEach((h, i) => doc.text(h, xs[i] + 4, doc.y + 6, { width: cols[i], align: i > 1 ? "center" : "left" }))
  doc.y += 24

  APPS.forEach((a, idx) => {
    const y = doc.y
    const bg = idx % 2 === 0 ? LIGHT : WHITE
    doc.rect(ML, y, CW, 20).fill(bg)
    doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY)
      .text(a.name, xs[0] + 4, y + 5, { width: cols[0] })
    doc.fontSize(9).font("Helvetica").fillColor(DARK)
      .text(a.subtitle, xs[1] + 4, y + 5, { width: cols[1] })
    doc.font("Helvetica-Bold").fillColor(NAVY)
      .text(String(a.pages), xs[2] + 4, y + 5, { width: cols[2], align: "center" })
      .text(String(a.tables), xs[3] + 4, y + 5, { width: cols[3], align: "center" })
    doc.font("Helvetica").fillColor(GRAY).fontSize(7)
      .text("Next.js · Supabase", xs[4] + 4, y + 5, { width: 40 })
    doc.y += 22
  })

  // Total row
  const y = doc.y
  doc.rect(ML, y, CW, 22).fill(NAVY)
  doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold")
    .text("TOTAL", xs[0] + 4, y + 6, { width: 80 })
  doc.fillColor(GOLD)
    .text("95", xs[2] + 4, y + 6, { width: cols[2], align: "center" })
    .text("50+", xs[3] + 4, y + 6, { width: cols[3], align: "center" })
  doc.y += 26
}

// ──────────────────────────────────────────────────────────────────────────────
// APP SECTION
// ──────────────────────────────────────────────────────────────────────────────
function drawApp(doc, app, pageNum) {
  doc.addPage()
  header(doc)
  doc.y = 50

  // Left accent bar + title
  doc.rect(ML, doc.y, 5, 52).fill(app.color)
  doc.fontSize(10).fillColor(GRAY).font("Helvetica")
    .text(`Application ${app.num}`, ML + 12, doc.y + 2, { width: CW })
  doc.fontSize(22).fillColor(NAVY).font("Helvetica-Bold")
    .text(app.name, ML + 12, doc.y + 16)
  doc.fontSize(11).fillColor(GRAY).font("Helvetica-Oblique")
    .text(app.subtitle, ML + 12, doc.y + 44)
  doc.y += 58

  // Gold underline
  doc.moveTo(ML, doc.y).lineTo(W - MR, doc.y).lineWidth(2).stroke(GOLD)
  doc.y += 12

  // Badges
  doc.rect(ML, doc.y, 110, 20).fill(NAVY)
  doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold")
    .text(`${app.pages} pages`, ML + 4, doc.y + 5, { width: 102, align: "center" })
  doc.rect(ML + 116, doc.y, 120, 20).fill(LIGHT)
  doc.rect(ML + 116, doc.y, 120, 20).stroke(SILVER)
  doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold")
    .text(`${app.tables} tables SQL`, ML + 120, doc.y + 5, { width: 112, align: "center" })
  doc.y += 30

  // Description
  doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold")
    .text("Description", ML, doc.y)
  doc.y += 14
  doc.fontSize(9.5).fillColor(DARK).font("Helvetica")
    .text(app.description, ML, doc.y, { width: CW, lineGap: 3 })
  doc.y += 16

  // Features
  doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold")
    .text("Fonctionnalités détaillées", ML, doc.y)
  doc.y += 12

  for (const cat of app.features) {
    ensureSpace(doc, 36)
    sectionBand(doc, cat.cat, NAVY)
    for (const item of cat.items) {
      ensureSpace(doc, 14)
      const y = doc.y
      doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
        .text("▸", ML + 4, y, { width: 14 })
      doc.fontSize(9).fillColor(DARK).font("Helvetica")
        .text(item, ML + 18, y, { width: CW - 18, lineGap: 1 })
      doc.y += 2
    }
    doc.y += 6
  }

  // DB Tables
  ensureSpace(doc, 44)
  doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold")
    .text("Tables de base de données (Supabase / PostgreSQL)", ML, doc.y)
  doc.y += 14

  // Table header
  doc.rect(ML, doc.y, CW, 20).fill(NAVY)
  doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold")
    .text("Table", ML + 6, doc.y + 5, { width: 160 })
    .text("Description", ML + 170, doc.y + 5, { width: CW - 170 })
  doc.y += 22

  app.db_tables.forEach(([name, desc], i) => {
    ensureSpace(doc, 18)
    const y = doc.y
    doc.rect(ML, y, CW, 17).fill(i % 2 === 0 ? LIGHT : WHITE)
    doc.fontSize(8.5).fillColor(NAVY).font("Helvetica-Bold")
      .text(name, ML + 6, y + 4, { width: 160 })
    doc.fontSize(8.5).fillColor(DARK).font("Helvetica")
      .text(desc, ML + 170, y + 4, { width: CW - 174 })
    doc.y += 18
  })

  doc.y += 10
  return doc.page
}

// ──────────────────────────────────────────────────────────────────────────────
// TECH STACK PAGE
// ──────────────────────────────────────────────────────────────────────────────
function drawStack(doc) {
  doc.addPage()
  header(doc)
  doc.y = 50

  doc.fontSize(18).fillColor(NAVY).font("Helvetica-Bold")
    .text("Stack technique & architecture", ML, doc.y)
  doc.y += 4
  doc.moveTo(ML, doc.y).lineTo(W - MR, doc.y).lineWidth(2).stroke(GOLD)
  doc.y += 20

  const stack = [
    ["Framework",        "Next.js 16.2.9 (App Router) — React 19 — TypeScript strict"],
    ["Styling",          "Tailwind CSS v4 — design system CNRA (navy #1A3A6B, or #C9A84C)"],
    ["Base de données",  "Supabase (PostgreSQL 15) — RLS activée sur toutes les tables"],
    ["Authentification", "Supabase Auth — @supabase/ssr — createBrowserClient"],
    ["Visualisation",    "Recharts (BarChart, PieChart, LineChart, RadarChart) — SVG natif"],
    ["Icônes",           "Lucide React"],
    ["PDF & QR",         "jsPDF + jspdf-autotable — bibliothèque qrcode (PNG)"],
    ["Export",           "xlsx (XLSX/CSV) — Web Crypto API SHA-256 native navigateur"],
    ["Déploiement",      "Vercel (Next.js) + Supabase Cloud (syqyzxwyejzqtuhxxdxh)"],
    ["Sécurité",         "HMAC-SHA256 (webhooks) — RLS anon + service_role — tokens UUID hex"],
  ]

  stack.forEach(([k, v], i) => {
    const y = doc.y
    doc.rect(ML, y, 140, 20).fill(LIGHT)
    doc.rect(ML + 140, y, CW - 140, 20).fill(i % 2 === 0 ? WHITE : "#F9FAFB")
    doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold")
      .text(k, ML + 6, y + 5, { width: 130 })
    doc.fontSize(9).fillColor(DARK).font("Helvetica")
      .text(v, ML + 148, y + 5, { width: CW - 152 })
    doc.y += 22
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// GENERATE
// ──────────────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "CNRA_Documentation_Fonctionnelle.pdf")
const doc = new PDFDocument({ size: [W, H], margin: 0, info: {
  Title: "Documentation Fonctionnelle Complète — Plateforme CNRA",
  Author: "Processingenierie SURL",
  Subject: "Applications numériques CNRA Sénégal",
  Keywords: "CNRA, médias, audiovisuel, Sénégal, régulation",
} })

const stream = fs.createWriteStream(outPath)
doc.pipe(stream)

// ── Cover
drawCover(doc)

// ── Summary
drawSummary(doc)
footer(doc, 2)

// ── Apps
APPS.forEach((app, i) => {
  drawApp(doc, app, 3 + i)
  footer(doc, 3 + i)
})

// ── Stack
drawStack(doc)
footer(doc, 3 + APPS.length)

doc.end()
stream.on("finish", () => {
  const size = fs.statSync(outPath).size
  console.log("PDF OK:", outPath)
  console.log("SIZE:", (size / 1024).toFixed(0), "KB")
})
stream.on("error", e => { console.error(e); process.exit(1) })
