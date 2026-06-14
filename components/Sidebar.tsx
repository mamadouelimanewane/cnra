"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Database, Tv, Radio, Globe, Users, BarChart2, ClipboardCheck, ChevronLeft, ChevronRight, Building2, BookOpen } from "lucide-react"
import { useState } from "react"

const groups = [
  {
    label: "Vue d'ensemble",
    items: [
      { name: "Tableau de bord", href: "/dashboard", icon: BarChart2 },
      { name: "Paysage médiatique", href: "/paysage", icon: Database },
    ],
  },
  {
    label: "Médias",
    items: [
      { name: "Télévisions", href: "/medias/television", icon: Tv },
      { name: "Radios", href: "/medias/radio", icon: Radio },
      { name: "En ligne", href: "/medias/en_ligne", icon: Globe },
      { name: "Groupes médias", href: "/groupes", icon: Building2 },
    ],
  },
  {
    label: "Acteurs",
    items: [
      { name: "Journalistes", href: "/journalistes", icon: Users },
      { name: "Programmes", href: "/programmes", icon: BookOpen },
    ],
  },
  {
    label: "Régulation",
    items: [
      { name: "Audits & Contrôles", href: "/audits", icon: ClipboardCheck },
      { name: "Audiences", href: "/audiences", icon: BarChart2 },
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
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
          <Database className="size-5 text-[#C9A84C]" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-black text-sm text-white leading-tight">CNRA</p>
            <p className="text-[10px] text-[#C9A84C] font-bold leading-tight tracking-wide">MEDIABASE</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1 rounded hover:bg-white/10 transition-colors">
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Nav */}
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
                    isActive ? "bg-[#C9A84C]/20 text-[#C9A84C]" : "text-blue-200 hover:bg-white/10 hover:text-white"
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
          <div className="bg-[#C9A84C]/10 rounded-xl p-3">
            <p className="text-xs text-[#C9A84C] font-bold mb-1">CNRA MediaBase v1.0</p>
            <p className="text-[10px] text-blue-400 leading-relaxed">Base de données officielle du paysage médiatique sénégalais</p>
          </div>
        </div>
      )}
    </aside>
  )
}
