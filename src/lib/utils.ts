import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuree(secondes: number): string {
  const h = Math.floor(secondes / 3600)
  const m = Math.floor((secondes % 3600) / 60)
  const s = secondes % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`
  if (m > 0) return `${m}min ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}

export function formatPourcentage(val: number, decimales = 1): string {
  return `${val.toFixed(decimales)}%`
}

export function secondesEnHHMMSS(secondes: number): string {
  const h = Math.floor(secondes / 3600)
  const m = Math.floor((secondes % 3600) / 60)
  const s = secondes % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

export function calculerDureeEntre(heureDebut: string, heureFin: string): number {
  const [dh, dm, ds] = heureDebut.split(':').map(Number)
  const [fh, fm, fs] = heureFin.split(':').map(Number)
  return (fh * 3600 + fm * 60 + (fs || 0)) - (dh * 3600 + dm * 60 + (ds || 0))
}

export function getNiveauAlerteColor(niveau: string) {
  switch (niveau) {
    case 'critique': return 'text-red-600 bg-red-50 border-red-200'
    case 'avertissement': return 'text-amber-600 bg-amber-50 border-amber-200'
    default: return 'text-blue-600 bg-blue-50 border-blue-200'
  }
}

export function getStatutCampagneBadge(statut: string) {
  switch (statut) {
    case 'en_cours': return { label: 'En cours', class: 'bg-green-100 text-green-800' }
    case 'a_venir': return { label: 'À venir', class: 'bg-blue-100 text-blue-800' }
    case 'terminee': return { label: 'Terminée', class: 'bg-gray-100 text-gray-600' }
    default: return { label: statut, class: 'bg-gray-100 text-gray-600' }
  }
}
