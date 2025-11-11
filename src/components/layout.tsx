"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Header from "./header"
import Sidebar from "./sidebar"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true) // Par défaut ouvert sur desktop
  const [isMobile, setIsMobile] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Sur mobile, le sidebar est fermé par défaut
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch role from server cookie or fallback to localStorage
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setRole(data.user?.role || null)
          return
        }
      } catch {}
      // Fallback decode client token if available
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setRole(payload.role)
        }
      } catch {}
    }
    fetchRole()
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
  <Header onSidebarToggle={toggleSidebar} role={role} />
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
      />
      
      {/* Main Content */}
      <main className={`
        pt-16 transition-all duration-300 ease-in-out
        ${isMobile 
          ? 'ml-0' 
          : sidebarOpen ? 'ml-64' : 'ml-16'
        }
      `}>
        <div className="p-6">
          <RouteTransition>
            {children}
          </RouteTransition>
        </div>
      </main>
    </div>
  )
}

function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // quick out/in to trigger transition on pathname change
    setVisible(false)
    const id = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(id)
  }, [pathname])

  return (
    <div className={`transition-all duration-300 ease-out transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      {children}
    </div>
  )
}
