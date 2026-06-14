import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k"
  return String(n)
}

export function getRiskColor(score: number): string {
  if (score >= 80) return "#dc2626"
  if (score >= 60) return "#ea580c"
  if (score >= 40) return "#d97706"
  return "#16a34a"
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return "Critique"
  if (score >= 60) return "Élevé"
  if (score >= 40) return "Modéré"
  return "Faible"
}
