import { Metadata } from "next"
import { ObservatoireClient } from "./ObservatoireClient"

export const metadata: Metadata = {
  title: "Observatoire Public — CNRA ElectroWatch",
  description: "Tableau de bord public du monitoring du pluralisme politique dans les médias sénégalais.",
  robots: { index: true, follow: true },
}

export default function ObservatoirePage() {
  return <ObservatoireClient />
}
