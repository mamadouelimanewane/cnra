import { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { DashboardClient } from "./DashboardClient"

export const metadata: Metadata = { title: "Tableau de bord" }

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titre="Tableau de bord" />
      <div className="flex-1 overflow-y-auto p-6">
        <DashboardClient />
      </div>
    </div>
  )
}
