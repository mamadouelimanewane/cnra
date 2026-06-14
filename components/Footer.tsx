import Link from "next/link"
import { Shield, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#0f2347] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Identité */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="size-5 text-[#C9A84C]" />
              </div>
              <div>
                <p className="font-black text-lg leading-none">CNRA Citoyen</p>
                <p className="text-[#C9A84C] text-xs">Portail officiel de participation</p>
              </div>
            </div>
            <p className="text-blue-300 text-sm leading-relaxed max-w-sm">
              Le Conseil National de Régulation de l&apos;Audiovisuel est l&apos;autorité indépendante
              chargée de garantir le pluralisme et l&apos;équité dans les médias sénégalais.
            </p>
            <div className="flex gap-3 mt-5">
              {["facebook", "twitter", "youtube"].map(r => (
                <div key={r} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors">
                  <span className="text-xs text-white/60 uppercase font-bold">{r[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Liens */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-4">Navigation</p>
            <ul className="space-y-2.5">
              {[
                ["Accueil", "/"],
                ["Observatoire", "/observatoire"],
                ["Signaler", "/signaler"],
                ["Pétitions", "/petitions"],
                ["Décisions", "/decisions"],
                ["Médias agréés", "/medias"],
                ["Éducation", "/education"],
              ].map(([l, h]) => (
                <li key={h}><Link href={h} className="text-sm text-blue-300 hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-4">Contact</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-blue-300">
                <MapPin className="size-4 shrink-0 mt-0.5 text-[#C9A84C]" />
                Dakar, Sénégal
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-300">
                <Phone className="size-4 shrink-0 text-[#C9A84C]" />
                +221 33 XXX XX XX
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-300">
                <Mail className="size-4 shrink-0 text-[#C9A84C]" />
                contact@cnra.sn
              </li>
            </ul>
            <div className="mt-5 p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-blue-300 leading-relaxed">
                Permanence signalements :<br />
                <span className="text-white font-semibold">Lun–Ven · 8h–17h</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-blue-400">© {new Date().getFullYear()} CNRA — Tous droits réservés · République du Sénégal</p>
          <div className="flex gap-4 text-xs text-blue-400">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/accessibilite" className="hover:text-white transition-colors">Accessibilité</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
