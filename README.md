# CNRA ElectroWatch

**Observatoire Électoral des Médias — Conseil National de Régulation de l'Audiovisuel du Sénégal**

Plateforme de monitoring du pluralisme politique dans les médias audiovisuels sénégalais.

## Stack

- **Frontend** : Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui
- **Backend** : Supabase (PostgreSQL · Auth · Realtime)
- **Charts** : Recharts · **PDF** : jsPDF

## Installation

```bash
git clone https://github.com/mamadouelimanewane/cnra.git
cd cnra
npm install
cp .env.local.example .env.local   # remplir les clés Supabase
npm run dev
```

## Configuration Supabase

1. Exécuter `supabase/migrations/001_initial_schema.sql` dans l'éditeur SQL Supabase
2. Remplir `.env.local` avec vos clés (Project Settings > API)

## Structure

```
src/app/(auth)/login/           → Connexion agents CNRA
src/app/(dashboard)/dashboard/  → Tableau de bord KPIs
src/app/(dashboard)/campagnes/  → Gestion campagnes
src/app/(dashboard)/interventions/ → Saisie temps de parole
src/app/(dashboard)/partis/     → Partis politiques
src/app/(dashboard)/medias/     → Médias régulés
src/app/(dashboard)/alertes/    → Alertes déséquilibre
src/app/(dashboard)/rapports/   → Export PDF officiel
src/app/public/observatoire/    → Vue publique citoyenne
supabase/migrations/            → Schéma PostgreSQL + RLS
```

---
© 2026 CNRA — République du Sénégal
