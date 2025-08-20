"use client"

import { useState, useEffect } from "react"
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
          {children}
        </div>
      </main>
    </div>
  )
}
