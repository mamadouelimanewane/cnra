import { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { AlertesClient } from "./AlertesClient"

export const metadata: Metadata = { title: "Alertes" }

export default function AlertesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titre="Alertes de déséquilibre" />
      <div className="flex-1 overflow-y-auto p-6">
        <AlertesClient />
      </div>
    </div>
  )
}
