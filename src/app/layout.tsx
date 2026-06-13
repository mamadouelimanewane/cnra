import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: {
    default: "CNRA ElectroWatch — Observatoire Électoral des Médias",
    template: "%s | CNRA ElectroWatch",
  },
  description:
    "Plateforme officielle du CNRA pour le monitoring du pluralisme politique dans les médias audiovisuels sénégalais.",
  keywords: ["CNRA", "Sénégal", "élections", "médias", "pluralisme", "régulation audiovisuelle"],
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased min-h-screen bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}
