"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Database, Hash, Cpu, Calendar } from "lucide-react"

type Signature = {
  id: string
  hash_contenu: string
  type_signature: string
  technique: string | null
  outil_detecte: string | null
  date_ajout: string | null
  actif: boolean
  description: string | null
  created_at: string
}

export default function SignaturesPage() {
  const supabaseRef = useRef(createClient())
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = supabaseRef.current
    async function load() {
      const { data } = await supabase.from("signatures_deepfake").select("*").order("date_ajout", { ascending: false })
      setSignatures(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const TYPE_ICON: Record<string, string> = { video: "📹", audio: "🎵", image: "🖼️" }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Database className="size-6 text-purple-400" /> Base de signatures IA
        </h1>
        <p className="text-sm text-gray-400 mt-1">{signatures.length} signatures de deepfakes référencées</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {["video", "audio", "image"].map(type => (
          <div key={type} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-1">{TYPE_ICON[type]}</p>
            <p className="text-xl font-black text-white">{signatures.filter(s => s.type_signature === type).length}</p>
            <p className="text-xs text-gray-400 capitalize">{type}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)
        ) : signatures.map(sig => (
          <div key={sig.id} className={`bg-white/5 border rounded-2xl p-5 ${sig.actif ? "border-white/10" : "border-white/5 opacity-50"}`}>
            <div className="flex items-start gap-4">
              <div className="text-2xl shrink-0">{TYPE_ICON[sig.type_signature]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {sig.technique && (
                    <span className="flex items-center gap-1 text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                      <Cpu className="size-3" /> {sig.technique}
                    </span>
                  )}
                  {sig.outil_detecte && (
                    <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg">
                      {sig.outil_detecte}
                    </span>
                  )}
                  {!sig.actif && <span className="text-xs text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded-lg">Inactif</span>}
                </div>
                {sig.description && <p className="text-sm text-gray-400 leading-relaxed mb-2">{sig.description}</p>}
                <div className="flex items-center gap-1.5">
                  <Hash className="size-3 text-gray-600" />
                  <code className="text-[10px] text-gray-600 font-mono truncate">{sig.hash_contenu}</code>
                </div>
              </div>
              {sig.date_ajout && (
                <div className="shrink-0 text-right text-xs text-gray-500">
                  <Calendar className="size-3 inline mr-1" />
                  {new Date(sig.date_ajout).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
