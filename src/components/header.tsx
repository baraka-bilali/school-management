"use client"

import { Icons } from "@/lib/icones"
import { Button } from "@/components/ui/button"

export default function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  return (
    <header className="flex justify-between items-center bg-white shadow p-4">
      {/* Bouton menu mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Icons.menu className="w-6 h-6" />
      </Button>

      <h1 className="text-lg font-semibold">Tableau de bord</h1>

      <Icons.bell className="w-6 h-6 text-gray-600" />
    </header>
  )
}
