import { Metadata } from "next"
import { Header } from "@/components/layout/Header"
import { PartisClient } from "./PartisClient"

export const metadata: Metadata = { title: "Partis politiques" }

export default function PartisPage() {
  return (
    <div className="flex flex-col h-full">
      <Header titre="Partis politiques" />
      <div className="flex-1 overflow-y-auto p-6">
        <PartisClient />
      </div>
    </div>
  )
}
