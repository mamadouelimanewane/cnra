import { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { InterventionsClient } from "./InterventionsClient"

export const metadata: Metadata = { title: "Interventions" }

export default function InterventionsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titre="Interventions" />
      <div className="flex-1 overflow-y-auto p-6">
        <InterventionsClient />
      </div>
    </div>
  )
}
