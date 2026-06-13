import { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { MediasClient } from "./MediasClient"

export const metadata: Metadata = { title: "Médias" }

export default function MediasPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titre="Médias régulés" />
      <div className="flex-1 overflow-y-auto p-6">
        <MediasClient />
      </div>
    </div>
  )
}
