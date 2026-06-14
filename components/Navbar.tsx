"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, Shield } from "lucide-react"

const nav = [
  { label: "Accueil",        href: "/" },
  { label: "Observatoire",   href: "/observatoire" },
  { label: "Signaler",       href: "/signaler" },
  { label: "Pétitions",      href: "/petitions" },
  { label: "Décisions CNRA", href: "/decisions" },
  { label: "Médias agréés",  href: "/medias" },
  { label: "Éducation",      href: "/education" },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-[#1A3A6B] shadow-lg sticky top-0 z-50">
      {/* Bandeau officiel */}
      <div className="bg-[#0f2347] py-1 px-4 text-center">
        <p className="text-[11px] text-blue-300 tracking-wide">
          🇸🇳 République du Sénégal — Conseil National de Régulation de l&apos;Audiovisuel
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Shield className="size-5 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">CNRA</p>
              <p className="text-[#C9A84C] text-[11px] font-semibold leading-none tracking-wide">CITOYEN</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map(item => (
              <Link key={item.href} href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/signaler"
              className="bg-[#C9A84C] hover:bg-[#b8973d] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              Signaler une infraction
            </Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="lg:hidden text-white p-2">
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#0f2347] border-t border-white/10">
          <nav className="px-4 py-3 space-y-1">
            {nav.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10"
                }`}>
                {item.label}
              </Link>
            ))}
            <Link href="/signaler" onClick={() => setOpen(false)}
              className="block mt-2 bg-[#C9A84C] text-white text-sm font-bold px-4 py-2.5 rounded-lg text-center">
              Signaler une infraction
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
