"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Eye, BarChart2, AlertTriangle, Clock, Tv, FileText, TrendingUp, Users, ChevronLeft, ChevronRight, Zap, Radio, Globe } from "lucide-react"
import { useState } from "react"

const groups = [
  {
    label: "Vue d'ensemble",
    items: [
      { name: "Tableau de bord", href: "/dashboard", icon: BarChart2 },
      { name: "Temps réel", href: "/realtime", icon: Zap },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { name: "Temps de parole", href: "/temps-parole", icon: Clock },
      { name: "Suivi médias", href: "/medias", icon: Tv },
      { name: "Acteurs politiques", href: "/acteurs", icon: Users },
    ],
  },
  {
    label: "Analyse",
    items: [
      { name: "Biais éditoriaux", href: "/biais", icon: TrendingUp },
      { name: "Thématiques", href: "/thematiques", icon: Eye },
      { name: "Comparatif", href: "/comparatif", icon: Radio },
    ],
  },
  {
    label: "Régulation",
    items: [
      { name: "Alertes", href: "/alertes", icon: AlertTriangle },
      { name: "Rapports", href: "/rapports", icon: FileText },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-[#0f1f3d] text-white transition-all duration-300 shrink-0 border-r border-white/5",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
          <Eye className="size-5 text-red-400" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-black text-sm text-white leading-tight">CNRA</p>
            <p className="text-[10px] text-red-400 font-bold leading-tight tracking-wide">MEDIAWATCH</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 rounded hover:bg-white/10 transition-colors">
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Live indicator */}
      {!collapsed && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-bold">SURVEILLANCE ACTIVE</span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {groups.map(g => (
          <div key={g.label} className="mb-4">
            {!collapsed && (
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest px-3 mb-1">{g.label}</p>
            )}
            {g.items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link key={item.href} href={item.href} title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
                    isActive ? "bg-red-500/20 text-red-400" : "text-blue-200 hover:bg-white/10 hover:text-white"
                  )}>
                  <item.icon className={cn("shrink-0", collapsed ? "size-5 mx-auto" : "size-4")} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
            <p className="text-xs text-red-400 font-bold mb-1">CNRA MediaWatch v1.0</p>
            <p className="text-[10px] text-blue-400 leading-relaxed">Veille permanente du paysage audiovisuel sénégalais</p>
          </div>
        </div>
      )}
    </aside>
  )
}
