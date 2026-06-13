"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("Identifiants invalides. Veuillez vérifier votre email et mot de passe.")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A3A6B] via-[#1e4080] to-[#0f2347] flex">
      {/* Panel gauche — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-sm">EW</span>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">CNRA ElectroWatch</p>
              <p className="text-blue-300 text-xs">Observatoire Électoral des Médias</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            Monitoring du<br />
            <span className="text-blue-300">pluralisme politique</span><br />
            dans les médias
          </h2>
          <p className="text-blue-200 text-base leading-relaxed max-w-sm">
            Plateforme officielle du CNRA pour garantir l'équité du temps de parole
            entre les partis politiques durant les campagnes électorales.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { label: "Monitoring temps réel", desc: "Surveillance continue de tous les médias" },
            { label: "Alertes automatiques", desc: "Détection des déséquilibres instantanée" },
            { label: "Rapports officiels", desc: "Génération automatique des avis CNRA" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-blue-300">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel droit — formulaire */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            {/* En-tête mobile */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#1A3A6B] flex items-center justify-center">
                <span className="text-white font-black text-sm">EW</span>
              </div>
              <div>
                <p className="font-bold text-gray-800">CNRA ElectroWatch</p>
                <p className="text-gray-400 text-xs">Observatoire Électoral</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h1>
            <p className="text-gray-500 text-sm mb-8">Accès réservé aux agents CNRA autorisés</p>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="agent@cnra.sn"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1A3A6B] hover:bg-[#1e4080] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connexion en cours…
                  </span>
                ) : "Se connecter"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <a href="/public/observatoire" className="text-sm text-[#1A3A6B] hover:underline font-medium">
                → Accéder à l'observatoire public
              </a>
            </div>
          </div>

          <p className="text-center text-blue-200/60 text-xs mt-6">
            © 2026 CNRA — Conseil National de Régulation de l'Audiovisuel du Sénégal
          </p>
        </div>
      </div>
    </div>
  )
}
