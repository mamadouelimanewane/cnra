import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  titre: string
  valeur: string | number
  sousTitre?: string
  icon: LucideIcon
  couleurIcon?: string
  bgIcon?: string
  tendance?: { valeur: number; label: string }
  className?: string
}

export function StatCard({
  titre, valeur, sousTitre, icon: Icon,
  couleurIcon = "text-blue-600", bgIcon = "bg-blue-50",
  tendance, className,
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{titre}</p>
          <p className="text-3xl font-bold text-gray-900">{valeur}</p>
          {sousTitre && (
            <p className="text-xs text-gray-500 mt-1 truncate">{sousTitre}</p>
          )}
          {tendance && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              tendance.valeur >= 0 ? "text-green-600" : "text-red-500"
            )}>
              <span>{tendance.valeur >= 0 ? "▲" : "▼"}</span>
              <span>{Math.abs(tendance.valeur)}% {tendance.label}</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl shrink-0 ml-3", bgIcon)}>
          <Icon className={cn("w-5 h-5", couleurIcon)} />
        </div>
      </div>
    </div>
  )
}
