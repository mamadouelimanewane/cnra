const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, TableOfContents, LevelFormat,
  PageBreak, ExternalHyperlink
} = require("docx")
const fs = require("fs")
const path = require("path")

// ──────────────────────────────────────────────────────────────────────────────
// DATA
// ──────────────────────────────────────────────────────────────────────────────
const APPS = [
  {
    num: "1",
    name: "MediaBase",
    subtitle: "Base de données des médias audiovisuels",
    description:
      "MediaBase est le référentiel central de tous les opérateurs de médias audiovisuels sous régulation du CNRA. Il centralise les licences, les actionnaires, les sanctions et les données structurelles du paysage médiatique sénégalais. C'est la source de vérité unique pour les agents de régulation.",
    color: "1A3A6B",
    pages: 25,
    tables: 14,
    features: [
      { cat: "Tableau de bord", items: [
        "KPIs globaux en temps réel (médias actifs, licences, sanctions en cours)",
        "Graphiques de répartition par type de média (TV, radio, en ligne)",
        "Alertes de renouvellement imminentes de licences",
        "Carte géographique de couverture nationale",
      ]},
      { cat: "Gestion des licences", items: [
        "Liste complète des licences audiovisuelles avec filtres multi-critères",
        "Fiche détaillée par licence (conditions, zones de couverture, fréquences)",
        "Génération PDF officielle de la licence avec en-tête CNRA, cachet et QR code",
        "QR code de vérification d'authenticité (route API /api/licences/[id]/qr)",
        "Suivi des alertes de renouvellement (J-90, J-30, J-0)",
        "Workflow de renouvellement avec historique des demandes",
      ]},
      { cat: "Répertoire des médias", items: [
        "Annuaire complet des médias par type (télévision, radio, en ligne)",
        "Fiche complète d'un média (actionnaires, grille de programmes, audiences)",
        "Graphe SVG interactif des liens capitalistiques entre médias et actionnaires",
        "Carte SVG géographique des médias avec filtres par type et région",
        "Analyse de concentration HHI (indice Herfindahl-Hirschman) par marché",
        "Vue panoramique du paysage audiovisuel sénégalais",
      ]},
      { cat: "Annuaire des professionnels", items: [
        "Répertoire des journalistes accrédités (photo, spécialité, médias)",
        "Annuaire général des professionnels des médias",
        "Historique de carrière et mutations inter-médias",
        "Accréditations spéciales (Présidence, Assemblée nationale, armées)",
      ]},
      { cat: "Groupes médiatiques", items: [
        "Fiche des groupes médiatiques et holdings",
        "Cartographie des participations croisées",
        "Suivi des mutations de propriété avec horodatage et parties",
        "Détection automatique des concentrations excessives",
      ]},
      { cat: "Discipline et sanctions", items: [
        "Registre des sanctions disciplinaires prononcées",
        "Suivi de l'exécution des sanctions (payées, en cours, contestées)",
        "Historique complet par média avec montants et motifs",
        "Génération d'états des lieux pour rapports officiels",
      ]},
      { cat: "Audiences et programmes", items: [
        "Statistiques d'audience par média et par tranche horaire",
        "Grilles de programmes déclarées par les opérateurs",
        "Audits de conformité des programmes aux cahiers des charges",
      ]},
      { cat: "Données & intégrations", items: [
        "Import de documents par OCR simulé (4 étapes : scan → revue → import)",
        "Export multi-format : CSV (UTF-8 BOM), XLSX, JSON — 6 tables exportables",
        "Gestion des webhooks avec HMAC-SHA256 et test en un clic",
        "API publique documentée avec 4 endpoints REST et clés API CRUD",
        "Génération de 5 modèles de rapports officiels téléchargeables en HTML",
      ]},
    ],
    db_tables: [
      "groupes_media — Holdings et groupes de presse",
      "journalistes — Annuaire des journalistes accrédités",
      "programmes — Grilles de programmes déclarées",
      "audits_media — Audits de conformité",
      "stats_audience — Statistiques d'audience",
      "licences — Licences audiovisuelles (conditions, zones, fréquences)",
      "mutations_media — Historique des mutations de propriété",
      "accreditations_speciales — Accréditations présidentielles et institutionnelles",
      "historique_carriere — Parcours des journalistes",
      "sanctions_disciplinaires — Sanctions avec montants et statuts",
      "liens_capitalistiques — Participations croisées entre entités",
      "webhook_configs — Webhooks HMAC configurés par les clients",
      "api_keys — Clés API publique avec quotas",
      "alertes_renouvellement — Alertes automatiques de renouvellement",
    ],
  },
  {
    num: "2",
    name: "MediaWatch",
    subtitle: "Monitoring, pluralisme & temps de parole",
    description:
      "MediaWatch est la plateforme de veille en temps réel des contenus diffusés par les médias audiovisuels. Elle combine l'analyse NLP (transcription, sentiment, entités nommées), le monitoring du pluralisme, la détection d'incidents de signal et les outils de régulation juridique. C'est l'outil opérationnel quotidien des analystes du CNRA.",
    color: "166534",
    pages: 27,
    tables: 19,
    features: [
      { cat: "Tableau de bord veille", items: [
        "Vue synthétique du monitoring en cours (médias, alertes, score global)",
        "KPIs temps réel : émissions transcrites, incidents, score pluralisme moyen",
        "Graphique d'évolution du pluralisme sur 30 jours",
        "Liste des 5 dernières alertes avec niveaux de sévérité",
      ]},
      { cat: "Transcription & NLP", items: [
        "Transcription automatique STT en 3 langues : français, wolof (wo), pulaar/fula (ff)",
        "Simulation du flux de transcription (en_cours → terminé) avec score de confiance",
        "Analyse de sentiment par segment et par locuteur (-1.0 à +1.0)",
        "Détection des émotions associées (joie, colère, peur, surprise, tristesse)",
        "Extraction des entités nommées (NER) : PERSONNE, ORG, LIEU, ÉVÉNEMENT, DATE, PARTI",
        "Nuage de bulles des entités les plus mentionnées avec score de sentiment associé",
      ]},
      { cat: "Score de pluralisme", items: [
        "Score global sur 100 avec jauge circulaire SVG (couleur seuil CNRA ≥ 60)",
        "4 dimensions : politique, genre, régional, linguistique",
        "RadarChart multi-dimensionnel par média",
        "Interprétation automatique : Bon (≥75), Moyen (≥50), Insuffisant (<50)",
        "Heatmap hebdomadaire des thématiques (interpolation RGB navy→rouge)",
        "Diagramme Sankey SVG des flux d'opinions (acteurs → médias → audiences)",
        "Comparaison temporelle ordinaire vs période électorale",
        "Indicateur de campagne électorale active avec badge d'alerte",
      ]},
      { cat: "Monitoring des incidents", items: [
        "Grille de statut des 6 chaînes en direct avec viewers simulés",
        "Détection d'incidents : coupure signal, silence suspect, interruption, bruit, freeze",
        "Horodatage et durée des incidents avec hash SHA-256 de la preuve",
        "Alertes de monitoring avec niveaux de sévérité et assignation",
      ]},
      { cat: "Streaming & réseaux sociaux", items: [
        "Connecteurs streaming : YouTube Live, Facebook Live, RTS Direct, M3U8, RTMP",
        "Test de connexion avec mise à jour automatique du statut et viewers",
        "Fluctuation simulée des viewers toutes les 4 secondes",
        "Veille réseaux sociaux : X/Twitter, Facebook, Instagram, TikTok",
        "Fil de mentions avec filtres plateforme et sentiment",
        "LineChart évolution des sentiments sur 7 jours",
        "PieChart de répartition par plateforme",
      ]},
      { cat: "Outils de régulation", items: [
        "Workflow mise en demeure 5 étapes : brouillon → validation → signée → envoyée → AR",
        "Template pré-rempli conforme aux textes réglementaires CNRA",
        "Aperçu du document avec en-tête officiel et référence automatique",
        "Archivage légal des preuves avec hash SHA-256 (Web Crypto API native)",
        "Registre des preuves avec chaîne de custody et référence dossier",
        "Saisines judiciaires avec génération automatique des pièces jointes",
        "Workflow de transmission au tribunal compétent",
      ]},
      { cat: "Partenaires & publication", items: [
        "Portail partenaires : accréditation OSC, partis politiques, ambassades",
        "Niveaux d'accès : lecture / lecture+écriture / admin",
        "Tokens API auto-générés avec affichage masqué et copie en un clic",
        "Widget public intégrable (3 formats : compact 480×80, carte 320×220, complet 600×400)",
        "Code iframe à copier pour intégration sur sites externes",
        "Assistant IA d'analyse en langage naturel avec mini-graphiques intégrés",
        "Suggestions de requêtes prédéfinies et feedback 👍/👎 par message",
      ]},
    ],
    db_tables: [
      "monitoring_sessions — Sessions de veille actives",
      "temps_parole — Mesures de temps de parole par locuteur",
      "alertes_monitoring — Alertes déclenchées avec niveaux de sévérité",
      "observations_contenu — Observations manuelles des analystes",
      "rapports_veille — Rapports générés automatiquement",
      "transcriptions — Textes transcrits avec langue et score de confiance",
      "analyses_sentiment — Scores sentiment par segment (-1.0 à +1.0)",
      "entites_nommees — Entités NER extraites avec type et mention_count",
      "incidents_signal — Incidents techniques (coupure, silence, freeze)",
      "scores_pluralisme — Scores hebdomadaires par média et par dimension",
      "heatmap_themes — Densité thématique par jour × heure",
      "flux_opinions — Flux source → cible pour diagramme Sankey",
      "preuves_legales — Preuves avec hash SHA-256 immuable",
      "periodes_electorales — Définition des périodes avec dates limites",
      "connecteurs_streaming — Flux live configurés (YouTube, M3U8, RTMP…)",
      "mentions_reseaux_sociaux — Mentions collectées sur les 4 plateformes",
      "partenaires — Partenaires accrédités avec token et niveau d'accès",
      "saisines_judiciaires — Dossiers judiciaires avec pièces jointes",
      "mises_en_demeure — Workflow complet avec 5 statuts",
    ],
  },
  {
    num: "3",
    name: "CitoyenCNRA",
    subtitle: "Portail public de participation citoyenne",
    description:
      "CitoyenCNRA est la vitrine publique du CNRA destinée aux citoyens sénégalais. Elle permet à tout citoyen de signaler une infraction médiatique, consulter les décisions du CNRA, signer des pétitions et se former à l'éducation aux médias. L'application est accessible sans authentification.",
    color: "7c3aed",
    pages: 8,
    tables: 5,
    features: [
      { cat: "Accueil & navigation", items: [
        "Page d'accueil avec hero section et accès aux 6 services en un clic",
        "Statistiques en direct du monitoring électoral (si campagne en cours)",
        "Section mission du CNRA avec chiffres clés",
        "Call-to-action signalement et pétitions",
        "Navbar responsive avec logo CNRA officiel",
        "Footer avec liens institutionnels",
      ]},
      { cat: "Formulaire de signalement", items: [
        "Formulaire guidé en 5 étapes : Type → Description → Preuves → Contact → Envoi",
        "4 types d'infraction : déséquilibre temps de parole, contenu partisan, temps non déclaré, autre",
        "Numéro de dossier automatique au format CNRA-000001 (séquence PostgreSQL)",
        "Option de signalement anonyme avec masquage des coordonnées",
        "Upload de pièces justificatives (PNG, JPG, MP4, PDF, max 10 Mo)",
        "Récapitulatif avant envoi avec case d'attestation légale",
        "Confirmation avec numéro de dossier à conserver",
      ]},
      { cat: "Observatoire du pluralisme", items: [
        "Données officielles de monitoring en temps réel depuis ElectroWatch",
        "Bandeau campagne électorale active avec dates et indicateurs",
        "BarChart temps de parole par parti (minutes, coloré par couleur officielle du parti)",
        "PieChart répartition globale en pourcentage",
        "Tableau détaillé : parti, sigle, temps total, interventions, part (%)",
        "Barre de progression par parti",
      ]},
      { cat: "Pétitions citoyennes", items: [
        "Liste des pétitions actives avec filtres (toutes / actives / acceptées)",
        "KPIs : pétitions actives, total signatures, pétitions acceptées",
        "Barre de progression vers l'objectif avec pourcentage atteint",
        "Signature en un clic avec anti-doublon par hash IP (SHA-256)",
        "Formulaire de création de pétition soumis au CNRA pour validation",
        "Badge « Acceptée par le CNRA » sur les pétitions abouties",
      ]},
      { cat: "Décisions & sanctions", items: [
        "Registre public des décisions CNRA (sanctions, avertissements, mises en demeure, rapports)",
        "Filtres par type de décision et recherche plein texte",
        "Affichage du montant des sanctions financières",
        "Statut d'exécution (Notifiée, Exécutée, Réponse reçue, Publiée)",
        "Téléchargement des décisions en PDF",
      ]},
      { cat: "Médias agréés", items: [
        "Annuaire public des médias audiovisuels agréés par le CNRA",
        "Filtres par type (télévision, radio, en ligne) et recherche par nom",
        "KPIs : nombre de TV, radios, médias en ligne, médias actifs",
        "Carte visuelle par média avec type, région, langue et statut",
      ]},
      { cat: "Éducation aux médias", items: [
        "3 fiches pédagogiques (débutant / intermédiaire) avec modal de lecture",
        "Thèmes : pluralisme médiatique, contenu partisan, temps de parole électoral",
        "Quiz interactif 4 questions avec correction immédiate et explication",
        "Barre de progression et score final avec recommandations personnalisées",
      ]},
    ],
    db_tables: [
      "signalements — Signalements citoyens avec numéro dossier auto et statuts",
      "petitions — Pétitions avec objectif, compteur signatures et workflow de validation",
      "signatures_petition — Anti-doublon par hash IP, trigger auto-incrément du compteur",
      "consultations_portail — Analytics RGPD-friendly (section visitée, sans IP)",
      "abonnements_alertes — Newsletter opt-in avec token de désinscription sécurisé",
    ],
  },
  {
    num: "4",
    name: "ElectroWatch",
    subtitle: "Observatoire électoral des médias",
    description:
      "ElectroWatch est le système de monitoring en temps réel du temps de parole politique pendant les campagnes électorales. Il permet aux agents CNRA de saisir les interventions des partis dans les médias, de détecter automatiquement les déséquilibres, de déclencher des alertes et de gérer les sanctions. Il dispose d'une page publique d'observatoire accessible à tous.",
    color: "C9A84C",
    pages: 16,
    tables: 12,
    features: [
      { cat: "Authentification", items: [
        "Page de connexion sécurisée pour les agents CNRA",
        "Gestion des sessions avec Supabase Auth",
        "Profils agents avec rôles (analyste, superviseur, directeur)",
      ]},
      { cat: "Tableau de bord", items: [
        "Vue synthétique de la campagne électorale en cours",
        "KPIs : total interventions, temps cumulé, médias couverts, partis monitorés",
        "Graphique temps de parole par parti en temps réel",
        "Classement des médias les plus actifs",
        "Dernières alertes de déséquilibre avec niveaux de priorité",
      ]},
      { cat: "Gestion des campagnes", items: [
        "Création et paramétrage des campagnes électorales (présidentielle, législative, locale)",
        "Définition de la période, des seuils d'alerte et des partis participants",
        "Activation / clôture des campagnes avec archivage",
        "Historique de toutes les campagnes passées",
      ]},
      { cat: "Saisie des interventions", items: [
        "Formulaire de saisie rapide : média, parti, locuteur, durée, type d'intervention",
        "Validation en temps réel des données saisies",
        "Import CSV des interventions par lot",
        "Vérification des doublons et des incohérences",
        "Historique des saisies par agent avec horodatage",
      ]},
      { cat: "Alertes de déséquilibre", items: [
        "Détection automatique des écarts de temps de parole (seuil configurable)",
        "Niveaux d'alerte : information, avertissement, critique",
        "Assignation des alertes aux agents pour traitement",
        "Workflow de résolution (nouvelle → en cours → résolue → classée)",
        "Envoi de notifications email automatiques (API notifications)",
      ]},
      { cat: "Régulation & sanctions", items: [
        "Génération de mises en demeure depuis les alertes",
        "Workflow de validation interne avant envoi",
        "Prononcé de sanctions avec montants et motifs",
        "Suivi de l'exécution et des contestations",
        "Signalements citoyens reçus et leur traitement",
      ]},
      { cat: "Rapports officiels", items: [
        "Génération de rapports hebdomadaires et de fin de campagne",
        "Rapport par média et par parti avec graphiques",
        "Rapport comparatif inter-médias",
        "Export PDF et partage sécurisé",
      ]},
      { cat: "Vues stratégiques", items: [
        "Vue Directeur : synthèse exécutive avec indicateurs clés et tendances",
        "Salle de crise : tableau de bord temps réel pour situations d'urgence",
        "Assistant IA : analyse des données en langage naturel",
        "Observatoire public : page accessible sans authentification avec données agrégées",
        "Formulaire de signalement public intégré au portail",
      ]},
    ],
    db_tables: [
      "partis — Partis politiques avec sigles, couleurs et représentants",
      "medias — Médias sous surveillance électorale",
      "campagnes — Campagnes électorales avec seuils et périodes",
      "interventions — Temps de parole saisis par les agents",
      "alertes — Alertes de déséquilibre avec statuts et assignations",
      "rapports — Rapports générés avec métadonnées",
      "profils — Comptes agents CNRA avec rôles",
      "mises_en_demeure — Documents de mise en demeure liés aux alertes",
      "sanctions — Sanctions prononcées avec montants et exécution",
      "signalements — Signalements citoyens reçus via portail public",
      "notifications_log — Journal des notifications email envoyées",
      "contacts_cnra — Contacts institutionnels du CNRA",
    ],
  },
  {
    num: "5",
    name: "AntiDeep",
    subtitle: "Détection de deepfakes & campagnes de désinformation",
    description:
      "AntiDeep est la plateforme de détection et de suivi des contenus falsifiés (deepfakes, images manipulées, fausses informations) et des campagnes de désinformation coordonnées ciblant le paysage médiatique sénégalais. Elle s'appuie sur des modèles d'IA pour analyser les contenus soumis et générer des alertes automatiques.",
    color: "7c3aed",
    pages: 10,
    tables: 5,
    features: [
      { cat: "Tableau de bord détection", items: [
        "KPIs : contenus analysés, deepfakes confirmés, campagnes actives, sources suspectes",
        "PieChart de répartition des verdicts (deepfake confirmé, manipulation, suspect, authentique)",
        "BarChart des contenus par type (vidéo, image, audio, texte)",
        "Liste des 5 dernières alertes critiques avec statuts",
      ]},
      { cat: "Moteur de détection IA", items: [
        "Analyse IA des contenus soumis avec score de confiance (0-100%)",
        "Détection de 5 types d'altération : deepfake vidéo, synthèse vocale, manipulation image, fausse transcription, montage audio",
        "Verdict en 5 niveaux : deepfake confirmé, manipulation confirmée, suspect, indéterminé, authentique",
        "Extraction des indicateurs techniques ayant motivé le verdict",
        "Affichage de la progression de l'analyse avec étapes détaillées",
      ]},
      { cat: "Soumission de contenus", items: [
        "Formulaire de soumission : URL, upload fichier ou texte brut",
        "Sélection du type de contenu et de la source présumée",
        "Priorité de traitement (normale / urgente)",
        "Notification du résultat par email",
      ]},
      { cat: "Registre des contenus", items: [
        "Liste complète des contenus analysés avec verdicts et dates",
        "Filtres par type, verdict, période et source",
        "Fiche détaillée par contenu avec historique des analyses",
        "Export des données pour transmission aux autorités",
      ]},
      { cat: "Sources suspectes", items: [
        "Cartographie des sources identifiées comme producteurs de faux contenus",
        "Score de crédibilité par source (0-100)",
        "Liens vers les contenus produits par chaque source",
        "Suivi de l'activité et des mises à jour",
      ]},
      { cat: "Signatures de deepfakes", items: [
        "Base de données des signatures techniques des deepfakes détectés",
        "Empreintes permettant la détection rapide de variantes",
        "Comparaison avec les nouvelles soumissions",
        "Partage des signatures avec partenaires (FACT-CHECK SN, RSF)",
      ]},
      { cat: "Campagnes de désinformation", items: [
        "Identification et suivi des campagnes coordonnées",
        "Carte des acteurs impliqués et des médias ciblés",
        "Chronologie des publications liées à une campagne",
        "Évaluation de l'impact et de la portée estimée",
      ]},
      { cat: "Alertes & rapports", items: [
        "Alertes automatiques sur nouveaux deepfakes confirmés",
        "Niveaux de sévérité : faible, moyenne, élevée, critique",
        "Rapports d'analyse complets exportables en PDF",
        "Statistiques mensuelles et trimestrielles de détection",
      ]},
    ],
    db_tables: [
      "contenus_analyses — Contenus soumis avec verdict, score et type",
      "campagnes_desinfo — Campagnes de désinformation identifiées et suivies",
      "sources_suspectes — Sources productrices de faux contenus avec score de crédibilité",
      "signatures_deepfake — Empreintes techniques pour détection rapide de variantes",
      "alertes_antideep — Alertes générées avec niveaux de sévérité et statuts",
    ],
  },
  {
    num: "6",
    name: "EduMedia",
    subtitle: "Formation et éducation aux médias",
    description:
      "EduMedia est la plateforme de formation professionnelle et d'éducation aux médias du CNRA. Elle s'adresse aux journalistes, aux établissements scolaires et aux formateurs. Elle propose des modules pédagogiques structurés, des sessions de formation certifiantes, des quiz d'évaluation et la délivrance de certificats officiels.",
    color: "166534",
    pages: 9,
    tables: 6,
    features: [
      { cat: "Tableau de bord", items: [
        "KPIs : modules actifs, formations planifiées, participants certifiés, établissements",
        "Graphiques d'activité (inscriptions par mois, taux de complétion)",
        "Prochaines sessions de formation planifiées",
        "Derniers certificats délivrés",
      ]},
      { cat: "Modules pédagogiques", items: [
        "Catalogue de modules structurés par niveau (débutant, intermédiaire, avancé)",
        "Thèmes couverts : pluralisme, éthique journalistique, fact-checking, réseaux sociaux, deepfakes",
        "Contenu textuel, vidéo et ressources téléchargeables par module",
        "Prérequis et compétences acquises par module",
        "Durée estimée et nombre de participants max",
      ]},
      { cat: "Sessions de formation", items: [
        "Calendrier des formations (présentiel, distanciel, hybride)",
        "Inscription des participants avec confirmation automatique",
        "Gestion des listes de présence et des émargements",
        "Suivi des statuts : planifiée → en cours → terminée → certifiée",
        "Évaluation des formateurs et des sessions",
      ]},
      { cat: "Quiz & évaluation", items: [
        "Quiz associés à chaque module avec banque de questions",
        "Score minimum requis pour obtenir le certificat (configurable)",
        "Correction automatique avec explications détaillées",
        "Historique des tentatives par participant",
        "Statistiques de réussite par module et par session",
      ]},
      { cat: "Ressources documentaires", items: [
        "Bibliothèque de ressources : guides, textes législatifs, études de cas",
        "Upload et gestion des documents par les formateurs",
        "Filtres par thème, langue (français, wolof) et niveau",
        "Téléchargement sécurisé avec compteur de consultations",
      ]},
      { cat: "Certificats officiels", items: [
        "Génération automatique de certificats PDF avec en-tête CNRA",
        "Numéro de certificat unique et vérifiable en ligne",
        "QR code de vérification d'authenticité",
        "Registre public des certifications délivrées",
        "Durée de validité et conditions de renouvellement",
      ]},
      { cat: "Établissements partenaires", items: [
        "Répertoire des établissements scolaires et universités partenaires",
        "Convention de partenariat et conditions d'accès aux formations",
        "Statistiques de participation par établissement",
        "Référent pédagogique et contacts par établissement",
      ]},
      { cat: "Rapports de formation", items: [
        "Rapport annuel de formation (participants, modules, certifications)",
        "Rapport par établissement et par région",
        "Taux de complétion et de réussite aux évaluations",
        "Export CSV/PDF pour transmission au ministère",
      ]},
    ],
    db_tables: [
      "etablissements — Établissements scolaires et universités partenaires",
      "ressources — Bibliothèque documentaire (guides, textes, études de cas)",
      "modules_formation — Modules pédagogiques avec niveau et prérequis",
      "formations — Sessions planifiées avec dates, mode et participants",
      "quiz — Questions et réponses avec scores de passage",
      "certificats — Certificats délivrés avec numéro unique et QR code",
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────────────────────────────────────────
const NAVY  = "1A3A6B"
const GOLD  = "C9A84C"
const WHITE = "FFFFFF"
const LIGHT = "F4F6FA"
const GRAY  = "6B7280"
const DARK  = "111827"

function border(color = "D1D5DB", size = 4) {
  return { style: BorderStyle.SINGLE, size, color }
}
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
const CELL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }

function cell(children, opts = {}) {
  return new TableCell({
    children,
    borders: opts.borders ?? CELL_BORDERS,
    shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    verticalAlign: opts.vAlign ?? VerticalAlign.TOP,
    margins: opts.margins ?? { top: 100, bottom: 100, left: 120, right: 120 },
    columnSpan: opts.span,
    rowSpan: opts.rowSpan,
  })
}

function txt(text, opts = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italic,
    color: opts.color ?? DARK,
    size: opts.size ?? 22,
    font: "Arial",
    break: opts.break,
  })
}

function para(runs, opts = {}) {
  return new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    alignment: opts.align ?? AlignmentType.LEFT,
    heading: opts.heading,
    spacing: { before: opts.before ?? 60, after: opts.after ?? 60, line: opts.line ?? 276 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    numbering: opts.numbering,
    pageBreakBefore: opts.pageBreak,
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// BUILDING BLOCKS
// ──────────────────────────────────────────────────────────────────────────────
function coverPage() {
  return [
    // Blue band top
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
      rows: [
        new TableRow({ children: [
          cell([
            para([txt("CONSEIL NATIONAL DE RÉGULATION DE L'AUDIOVISUEL", { bold: true, color: WHITE, size: 20 })], { align: AlignmentType.CENTER, before: 200, after: 80 }),
            para([txt("République du Sénégal • CNRA", { color: "C9D8F0", size: 18 })], { align: AlignmentType.CENTER, after: 200 }),
          ], { bg: NAVY, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }, margins: { top: 300, bottom: 300, left: 400, right: 400 } }),
        ]}),
      ],
    }),

    para([], { before: 600, after: 0 }),

    para([txt("Plateforme Numérique CNRA", { color: NAVY, size: 26, bold: true })], { align: AlignmentType.CENTER, before: 200, after: 100 }),
    para([txt("Documentation Fonctionnelle Complète", { color: GOLD, size: 38, bold: true })], { align: AlignmentType.CENTER, before: 0, after: 80 }),

    // Gold divider
    new Table({
      width: { size: 3000, type: WidthType.DXA },
      columnWidths: [3000],
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
      float: { horizontalAnchor: "margin", absoluteHorizontalPosition: 3180 },
      rows: [new TableRow({ children: [
        cell([para([txt(" ")], { before: 0, after: 0 })], { bg: GOLD, borders: { top: NO_BORDER, bottom: border(GOLD, 8), left: NO_BORDER, right: NO_BORDER }, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
      ]})],
    }),

    para([], { before: 120, after: 0 }),
    para([txt("6 applications · 95 pages · 50+ tables Supabase", { color: GRAY, size: 22 })], { align: AlignmentType.CENTER, before: 200, after: 600 }),

    // Stats cards in a table
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 2340, 2340],
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
      rows: [
        new TableRow({ children: [
          ...[
            { val: "6", lbl: "Applications" },
            { val: "95", lbl: "Pages" },
            { val: "50+", lbl: "Tables SQL" },
            { val: "130+", lbl: "Fonctionnalités" },
          ].map(s => cell([
            para([txt(s.val, { bold: true, color: NAVY, size: 52 })], { align: AlignmentType.CENTER, before: 120, after: 40 }),
            para([txt(s.lbl, { color: GRAY, size: 18 })], { align: AlignmentType.CENTER, after: 120 }),
          ], { bg: LIGHT, borders: { top: border(LIGHT), bottom: border(LIGHT), left: border(LIGHT), right: border(LIGHT) }, margins: { top: 80, bottom: 80, left: 80, right: 80 } })),
        ]}),
      ],
    }),

    para([], { before: 600, after: 0 }),
    para([txt("Processingenierie SURL  •  Juin 2026", { color: GRAY, size: 18 })], { align: AlignmentType.CENTER, before: 400 }),
    para([txt("Document confidentiel — Usage interne CNRA", { color: GRAY, size: 16, italic: true })], { align: AlignmentType.CENTER }),
    para([new PageBreak()], { before: 0, after: 0 }),
  ]
}

function appSection(app) {
  const blocks = []

  // Section title with colored left border simulation via shaded table
  blocks.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [240, 9120],
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
      rows: [new TableRow({ children: [
        cell([para([txt(" ")], { before: 0, after: 0 })], { bg: app.color.toUpperCase(), borders: CELL_BORDERS, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
        cell([
          para([
            txt(`Application ${app.num} — `, { color: GRAY, size: 20 }),
            txt(app.name, { color: NAVY, size: 32, bold: true }),
          ], { before: 60, after: 20 }),
          para([txt(app.subtitle, { color: GRAY, size: 20, italic: true })], { before: 0, after: 60 }),
        ], { borders: CELL_BORDERS, margins: { top: 60, bottom: 60, left: 240, right: 0 } }),
      ]})],
    })
  )

  // Gold underline
  blocks.push(para([txt(" ")], {
    before: 0, after: 0,
  }))
  blocks.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    borders: { top: NO_BORDER, bottom: border(GOLD, 6), left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
    rows: [new TableRow({ children: [cell([para([txt(" ")], { before: 0, after: 0 })], { bg: WHITE, borders: { top: NO_BORDER, bottom: border(GOLD, 6), left: NO_BORDER, right: NO_BORDER } })] })],
  }))

  blocks.push(para([], { before: 160, after: 0 }))

  // Meta badges
  blocks.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [1800, 1800, 5760],
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
      rows: [new TableRow({ children: [
        cell([
          para([txt(`${app.pages} pages`, { bold: true, color: WHITE, size: 20 })], { align: AlignmentType.CENTER, before: 60, after: 60 }),
        ], { bg: NAVY, borders: CELL_BORDERS }),
        cell([
          para([txt(`${app.tables} tables SQL`, { bold: true, color: NAVY, size: 20 })], { align: AlignmentType.CENTER, before: 60, after: 60 }),
        ], { bg: "E8EDF5", borders: { top: border("CBD5E8"), bottom: border("CBD5E8"), left: border("CBD5E8"), right: border("CBD5E8") }, margins: { top: 60, bottom: 60, left: 120, right: 120 } }),
        cell([para([txt(" ")])], { borders: CELL_BORDERS }),
      ]})],
    })
  )

  // Description
  blocks.push(para([txt("Description", { bold: true, color: NAVY, size: 22 })], { before: 240, after: 80 }))
  blocks.push(para([txt(app.description, { color: DARK, size: 21 })], { before: 0, after: 200, line: 300 }))

  // Features
  blocks.push(para([txt("Fonctionnalités détaillées", { bold: true, color: NAVY, size: 22 })], { before: 40, after: 120 }))

  for (const cat of app.features) {
    // Category header
    blocks.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
        rows: [new TableRow({ children: [
          cell([
            para([txt(cat.cat, { bold: true, color: WHITE, size: 20 })], { before: 60, after: 60 }),
          ], { bg: NAVY, borders: CELL_BORDERS }),
        ]})],
      })
    )
    for (const item of cat.items) {
      blocks.push(
        para([
          txt("▸  ", { color: GOLD, bold: true, size: 21 }),
          txt(item, { color: DARK, size: 21 }),
        ], { before: 40, after: 40, indent: 240, line: 288 })
      )
    }
    blocks.push(para([], { before: 80, after: 0 }))
  }

  // DB Tables
  blocks.push(para([txt("Tables de base de données (Supabase / PostgreSQL)", { bold: true, color: NAVY, size: 22 })], { before: 160, after: 120 }))
  const DB_COLS = [3200, 6160]
  const dbRows = [
    new TableRow({
      children: [
        cell([para([txt("Table", { bold: true, color: WHITE, size: 20 })], { before: 60, after: 60 })], { bg: NAVY, borders: CELL_BORDERS, width: DB_COLS[0] }),
        cell([para([txt("Description", { bold: true, color: WHITE, size: 20 })], { before: 60, after: 60 })], { bg: NAVY, borders: CELL_BORDERS, width: DB_COLS[1] }),
      ],
    }),
    ...app.db_tables.map((row, i) => {
      const [name, desc] = row.split(" — ")
      return new TableRow({ children: [
        cell([para([txt(name, { bold: true, color: NAVY, size: 20 })], { before: 60, after: 60 })], {
          bg: i % 2 === 0 ? LIGHT : WHITE,
          borders: { top: border("E5E7EB", 2), bottom: border("E5E7EB", 2), left: NO_BORDER, right: NO_BORDER },
          width: DB_COLS[0],
        }),
        cell([para([txt(desc ?? "", { color: DARK, size: 20 })], { before: 60, after: 60 })], {
          bg: i % 2 === 0 ? LIGHT : WHITE,
          borders: { top: border("E5E7EB", 2), bottom: border("E5E7EB", 2), left: NO_BORDER, right: border("E5E7EB", 2) },
          width: DB_COLS[1],
        }),
      ]})
    }),
  ]

  blocks.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: DB_COLS,
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
    rows: dbRows,
  }))

  blocks.push(para([new PageBreak()], { before: 200, after: 0 }))
  return blocks
}

function summaryTable() {
  const rows = [
    new TableRow({ children: [
      ...[{ t: "Application", w: 1800 }, { t: "Description courte", w: 3560 }, { t: "Pages", w: 800 }, { t: "Tables SQL", w: 900 }, { t: "Stack technique", w: 2300 }]
        .map(h => cell([para([txt(h.t, { bold: true, color: WHITE, size: 20 })], { before: 60, after: 60, align: AlignmentType.CENTER })],
          { bg: NAVY, borders: CELL_BORDERS, width: h.w })),
    ]}),
    ...APPS.map((a, i) => new TableRow({ children: [
      cell([para([txt(a.name, { bold: true, color: NAVY, size: 20 })], { before: 60, after: 60 })], { bg: i%2===0?LIGHT:WHITE, borders: { top: border("E5E7EB",2), bottom: border("E5E7EB",2), left: NO_BORDER, right: NO_BORDER }, width: 1800 }),
      cell([para([txt(a.subtitle, { color: DARK, size: 19 })], { before: 60, after: 60 })], { bg: i%2===0?LIGHT:WHITE, borders: { top: border("E5E7EB",2), bottom: border("E5E7EB",2), left: NO_BORDER, right: NO_BORDER }, width: 3560 }),
      cell([para([txt(String(a.pages), { bold: true, color: NAVY, size: 20 })], { before: 60, after: 60, align: AlignmentType.CENTER })], { bg: i%2===0?LIGHT:WHITE, borders: { top: border("E5E7EB",2), bottom: border("E5E7EB",2), left: NO_BORDER, right: NO_BORDER }, width: 800 }),
      cell([para([txt(String(a.tables), { bold: true, color: NAVY, size: 20 })], { before: 60, after: 60, align: AlignmentType.CENTER })], { bg: i%2===0?LIGHT:WHITE, borders: { top: border("E5E7EB",2), bottom: border("E5E7EB",2), left: NO_BORDER, right: NO_BORDER }, width: 900 }),
      cell([para([txt("Next.js 16 · React 19 · TypeScript · Tailwind · Supabase", { color: GRAY, size: 17 })], { before: 60, after: 60 })], { bg: i%2===0?LIGHT:WHITE, borders: { top: border("E5E7EB",2), bottom: border("E5E7EB",2), left: NO_BORDER, right: NO_BORDER }, width: 2300 }),
    ]})),
    new TableRow({ children: [
      cell([para([txt("TOTAL", { bold: true, color: WHITE, size: 20 })], { before: 60, after: 60 })], { bg: NAVY, borders: CELL_BORDERS, width: 1800 }),
      cell([para([txt("6 applications gouvernementales CNRA Sénégal", { bold: true, color: WHITE, size: 20 })], { before: 60, after: 60 })], { bg: NAVY, borders: CELL_BORDERS, width: 3560 }),
      cell([para([txt("95", { bold: true, color: GOLD, size: 22 })], { before: 60, after: 60, align: AlignmentType.CENTER })], { bg: NAVY, borders: CELL_BORDERS, width: 800 }),
      cell([para([txt("50+", { bold: true, color: GOLD, size: 22 })], { before: 60, after: 60, align: AlignmentType.CENTER })], { bg: NAVY, borders: CELL_BORDERS, width: 900 }),
      cell([para([txt("Déployé sur Vercel + Supabase Cloud", { color: "C9D8F0", size: 17 })], { before: 60, after: 60 })], { bg: NAVY, borders: CELL_BORDERS, width: 2300 }),
    ]}),
  ]

  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1800, 3560, 800, 900, 2300], rows,
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER } })
}

// ──────────────────────────────────────────────────────────────────────────────
// ASSEMBLE DOC
// ──────────────────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: DARK } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        run: { size: 32, bold: true, color: NAVY, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        run: { size: 26, bold: true, color: NAVY, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{
    reference: "bullets",
    levels: [{ level: 0, format: LevelFormat.BULLET, text: "▸", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 480, hanging: 240 } }, run: { color: GOLD } } }],
  }]},
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Table({
            width: { size: 10080, type: WidthType.DXA },
            columnWidths: [7000, 3080],
            borders: { top: NO_BORDER, bottom: border("E5E7EB", 4), left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
            rows: [new TableRow({ children: [
              cell([para([txt("CNRA Sénégal — Documentation Fonctionnelle", { color: GRAY, size: 16 })], { before: 0, after: 60 })], { borders: { top: NO_BORDER, bottom: border("E5E7EB", 4), left: NO_BORDER, right: NO_BORDER } }),
              cell([para([txt("Plateforme Numérique CNRA · 2026", { color: NAVY, size: 16, bold: true })], { before: 0, after: 60, align: AlignmentType.RIGHT })], { borders: { top: NO_BORDER, bottom: border("E5E7EB", 4), left: NO_BORDER, right: NO_BORDER } }),
            ]})],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Table({
            width: { size: 10080, type: WidthType.DXA },
            columnWidths: [7000, 3080],
            borders: { top: border("E5E7EB", 4), bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
            rows: [new TableRow({ children: [
              cell([para([txt("Document confidentiel — Processingenierie SURL pour CNRA", { color: GRAY, size: 16, italic: true })], { before: 60, after: 0 })], { borders: { top: border("E5E7EB", 4), bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
              cell([para([txt("Page "), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: NAVY, bold: true })], { before: 60, after: 0, align: AlignmentType.RIGHT })], { borders: { top: border("E5E7EB", 4), bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
            ]})],
          }),
        ],
      }),
    },
    children: [
      ...coverPage(),

      // Sommaire
      para([txt("Sommaire des applications", { bold: true, color: NAVY, size: 32 })], { heading: HeadingLevel.HEADING_1, before: 200, after: 240 }),
      summaryTable(),
      para([new PageBreak()], { before: 400, after: 0 }),

      // One section per app
      ...APPS.flatMap(app => appSection(app)),

      // Stack technique
      para([txt("Stack technique & architecture", { bold: true, color: NAVY, size: 32 })], { heading: HeadingLevel.HEADING_1, before: 0, after: 200 }),
      ...[
        ["Framework", "Next.js 16.2.9 (App Router) — React 19 — TypeScript strict"],
        ["Styling", "Tailwind CSS v4 — design system CNRA (navy #1A3A6B, or #C9A84C)"],
        ["Base de données", "Supabase (PostgreSQL 15) — RLS activée sur toutes les tables"],
        ["Authentification", "Supabase Auth — @supabase/ssr — createBrowserClient"],
        ["Visualisation", "Recharts (BarChart, PieChart, LineChart, RadarChart) — SVG natif"],
        ["Icônes", "Lucide React"],
        ["PDF & QR", "jsPDF + jspdf-autotable — bibliothèque qrcode (PNG)"],
        ["Export", "xlsx (XLSX/CSV) — Web Crypto API (SHA-256 natif navigateur)"],
        ["Déploiement", "Vercel (Next.js) + Supabase Cloud — Supabase URL : syqyzxwyejzqtuhxxdxh"],
        ["Sécurité", "HMAC-SHA256 (webhooks) — RLS anon + service_role — tokens UUID hex"],
      ].map(([k, v]) => new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 7160],
        borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER },
        rows: [new TableRow({ children: [
          cell([para([txt(k, { bold: true, color: NAVY, size: 20 })], { before: 60, after: 60 })], { bg: LIGHT, borders: { top: border("E5E7EB",2), bottom: border("E5E7EB",2), left: NO_BORDER, right: NO_BORDER }, width: 2200 }),
          cell([para([txt(v, { color: DARK, size: 20 })], { before: 60, after: 60 })], { bg: WHITE, borders: { top: border("E5E7EB",2), bottom: border("E5E7EB",2), left: NO_BORDER, right: border("E5E7EB",2) }, width: 7160 }),
        ]})],
      })),
    ],
  }],
})

const outDir = path.join(__dirname)
fs.mkdirSync(outDir, { recursive: true })
const docxPath = path.join(outDir, "CNRA_Documentation_Fonctionnelle.docx")

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(docxPath, buf)
  console.log("DOCX OK:", docxPath)
  console.log("SIZE:", (buf.length / 1024).toFixed(0), "KB")
}).catch(e => { console.error(e); process.exit(1) })
