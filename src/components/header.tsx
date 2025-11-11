"use client"

import { Bell, Menu, School } from "lucide-react"

interface HeaderProps {
  onSidebarToggle: () => void
  role?: string | null
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  COMPTABLE: 'Comptable',
  DIRECTEUR_DISCIPLINE: 'Discipline',
  DIRECTEUR_ETUDES: 'Études',
  PROFESSEUR: 'Professeur',
  ELEVE: 'Élève'
}

export default function Header({ onSidebarToggle, role }: HeaderProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onSidebarToggle}
            className="text-gray-500 hover:text-gray-600 mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <School className="w-4 h-4 text-indigo-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">School Management</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <img 
                src="https://randomuser.me/api/portraits/men/1.jpg" 
                alt="User" 
                className="w-8 h-8 rounded-full" 
              />
              <span className="hidden md:flex flex-col text-gray-700 leading-tight">
                <span className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                  {role ? ROLE_LABEL[role] ?? role : '—'}
                </span>
                <span className="text-sm">{role ? ROLE_LABEL[role] ?? role : 'Invité'}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
