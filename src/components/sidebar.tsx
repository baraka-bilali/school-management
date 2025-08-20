import { Icons } from "@/lib/icones"

export default function Sidebar() {
  return (
    <aside className="bg-gray-800 text-white w-64 p-4 hidden md:block">
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <ul className="space-y-4">
        <li className="flex items-center gap-2">
          <Icons.home className="w-5 h-5" /> Accueil
        </li>
        <li className="flex items-center gap-2">
          <Icons.users className="w-5 h-5" /> Utilisateurs
        </li>
        <li className="flex items-center gap-2">
          <Icons.stats className="w-5 h-5" /> Statistiques
        </li>
        <li className="flex items-center gap-2">
          <Icons.reports className="w-5 h-5" /> Rapports
        </li>
        <li className="flex items-center gap-2">
          <Icons.settings className="w-5 h-5" /> Paramètres
        </li>
      </ul>
    </aside>
  )
}
