"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Vote,
  Users,
  Radio,
  Mic2,
  Bell,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tableau de bord",   href: "/dashboard",      icon: LayoutDashboard },
  { name: "Campagnes",         href: "/campagnes",      icon: Vote },
  { name: "Interventions",     href: "/interventions",  icon: Mic2 },
  { name: "Partis politiques", href: "/partis",         icon: Users },
  { name: "Médias",            href: "/medias",         icon: Radio },
  { name: "Alertes",           href: "/alertes",        icon: Bell },
  { name: "Rapports",          href: "/rapports",       icon: FileText },
  { name: "Vue publique",      href: "/public/observatoire", icon: Eye },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-[#1A3A6B] text-white transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 shrink-0">
          <Vote className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">CNRA</p>
            <p className="text-[11px] text-blue-200 font-medium leading-tight">ElectroWatch</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
          title={collapsed ? "Développer" : "Réduire"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("shrink-0", collapsed ? "w-5 h-5 mx-auto" : "w-4 h-4")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={handleLogout}
          title={collapsed ? "Déconnexion" : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className={cn("shrink-0", collapsed ? "w-5 h-5 mx-auto" : "w-4 h-4")} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
