import { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { CampagnesClient } from "./CampagnesClient"

export const metadata: Metadata = { title: "Campagnes" }

export default function CampagnesPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titre="Campagnes électorales" />
      <div className="flex-1 overflow-y-auto p-6">
        <CampagnesClient />
      </div>
    </div>
  )
}
