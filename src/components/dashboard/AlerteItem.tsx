import { cn, getNiveauAlerteColor } from "@/lib/utils"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import type { Alerte } from "@/types"

const ICONES = {
  critique: AlertCircle,
  avertissement: AlertTriangle,
  info: Info,
}

interface AlerteItemProps {
  alerte: Alerte
  compact?: boolean
}

export function AlerteItem({ alerte, compact }: AlerteItemProps) {
  const Icon = ICONES[alerte.niveau] ?? Info
  const colorClass = getNiveauAlerteColor(alerte.niveau)

  if (compact) {
    return (
      <div className={cn("flex items-start gap-2 p-2.5 rounded-lg border text-xs", colorClass)}>
        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium truncate">{alerte.message}</p>
          {alerte.media && (
            <p className="opacity-75 truncate">{alerte.media.nom}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-xl border", colorClass)}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{alerte.message}</p>
        {alerte.details && <p className="text-xs mt-1 opacity-80">{alerte.details}</p>}
        <div className="flex gap-3 mt-2 text-xs opacity-70">
          {alerte.media && <span>📡 {alerte.media.nom}</span>}
          {alerte.parti && <span>🏛 {alerte.parti.nom}</span>}
          <span>🕒 {new Date(alerte.created_at).toLocaleString("fr-SN")}</span>
        </div>
      </div>
    </div>
  )
}
