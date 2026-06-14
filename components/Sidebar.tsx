"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Shield, Search, AlertOctagon, BarChart2, FileSearch, Database, Radio, ChevronLeft, ChevronRight, Zap, Globe, BookOpen } from "lucide-react"
import { useState } from "react"

const groups = [
  {
    label: "Vue d'ensemble",
    items: [
      { name: "Tableau de bord", href: "/dashboard", icon: BarChart2 },
      { name: "Détection live", href: "/detection", icon: Zap },
    ],
  },
  {
    label: "Analyse",
    items: [
      { name: "Soumettre un contenu", href: "/soumettre", icon: Search },
      { name: "Contenus analysés", href: "/contenus", icon: FileSearch },
      { name: "Campagnes détectées", href: "/campagnes", icon: Radio },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { name: "Sources suspectes", href: "/sources", icon: Globe },
      { name: "Base de signatures", href: "/signatures", icon: Database },
    ],
  },
  {
    label: "Régulation",
    items: [
      { name: "Alertes & Signalements", href: "/alertes", icon: AlertOctagon },
      { name: "Rapports", href: "/rapports", icon: BookOpen },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-gray-950 text-white transition-all duration-300 shrink-0 border-r border-white/5",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
          <Shield className="size-5 text-purple-400" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-black text-sm text-white leading-tight">CNRA</p>
            <p className="text-[10px] text-purple-400 font-bold leading-tight tracking-wide">ANTIDEEP</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 rounded hover:bg-white/10 transition-colors">
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mx-4 mt-3 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs text-purple-400 font-bold">IA DÉTECTION ACTIVE</span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {groups.map(g => (
          <div key={g.label} className="mb-4">
            {!collapsed && (
              <p className="text-[10px] font-bold text-purple-500/70 uppercase tracking-widest px-3 mb-1">{g.label}</p>
            )}
            {g.items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link key={item.href} href={item.href} title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
                    isActive ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
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
          <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
            <p className="text-xs text-purple-400 font-bold mb-1">CNRA AntiDeep v1.0</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">Détection IA des deepfakes et désinformation audiovisuelle</p>
          </div>
        </div>
      )}
    </aside>
  )
}
