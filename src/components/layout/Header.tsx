"use client"

import { Bell, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface HeaderProps {
  titre?: string
}

export function Header({ titre }: HeaderProps) {
  const [alertesCount, setAlertesCount] = useState(0)
  const [dateHeure, setDateHeure] = useState(new Date())

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("alertes")
      .select("id", { count: "exact", head: true })
      .eq("statut", "non_lue")
      .then(({ count }) => setAlertesCount(count ?? 0))

    const interval = setInterval(() => setDateHeure(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const dateFormatee = dateHeure.toLocaleDateString("fr-SN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
      {/* Titre page */}
      <div className="flex-1">
        {titre && (
          <h1 className="text-base font-semibold text-gray-800">{titre}</h1>
        )}
        <p className="text-xs text-gray-400 capitalize">{dateFormatee}</p>
      </div>

      {/* Recherche */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Rechercher..."
          className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Alertes */}
      <a href="/alertes" className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
        <Bell className="w-5 h-5 text-gray-500" />
        {alertesCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {alertesCount > 99 ? "99+" : alertesCount}
          </span>
        )}
      </a>

      {/* Badge CNRA */}
      <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-gray-200">
        <div className="w-7 h-7 rounded-full bg-[#1A3A6B] flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">CN</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">Agent CNRA</p>
          <p className="text-[10px] text-gray-400">Connecté</p>
        </div>
      </div>
    </header>
  )
}
