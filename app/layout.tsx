import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CNRA Citoyen — Portail Officiel",
  description: "Plateforme citoyenne officielle du Conseil National de Régulation de l'Audiovisuel du Sénégal. Transparence, signalements, pétitions et éducation aux médias.",
  openGraph: {
    title: "CNRA Citoyen",
    description: "Portail officiel de participation citoyenne du CNRA Sénégal",
    locale: "fr_SN",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50" style={{ fontFamily: "var(--font-sans)" }}>
        {children}
      </body>
    </html>
  )
}
