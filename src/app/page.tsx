"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards"
import { Icons } from "@/lib/icones"

export default function DashboardPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${open ? "translate-x-0" : "-translate-x-64"} transition-transform duration-300 md:translate-x-0`}>
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col md:ml-64">
        <Header toggleSidebar={() => setOpen(!open)} />

        <main className="p-6 grid gap-6 md:grid-cols-3">
          {/* Card Utilisateurs */}
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Utilisateurs</CardTitle>
              <Icons.users className="w-5 h-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1,250</p>
              <p className="text-sm text-gray-500">+20% ce mois</p>
            </CardContent>
          </Card>

          {/* Card Ventes */}
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Ventes</CardTitle>
              <Icons.sales className="w-5 h-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">3,400 $</p>
              <p className="text-sm text-gray-500">+15% ce mois</p>
            </CardContent>
          </Card>

          {/* Card Messages */}
          <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Messages</CardTitle>
              <Icons.messages className="w-5 h-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">85</p>
              <p className="text-sm text-gray-500">+5 nouveaux</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
