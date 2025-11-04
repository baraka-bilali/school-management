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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSidebarToggle={toggleSidebar} />
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
