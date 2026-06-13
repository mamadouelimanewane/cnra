import { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { RapportsClient } from "./RapportsClient"

export const metadata: Metadata = { title: "Rapports" }

export default function RapportsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titre="Rapports officiels" />
      <div className="flex-1 overflow-y-auto p-6">
        <RapportsClient />
      </div>
    </div>
  )
}
