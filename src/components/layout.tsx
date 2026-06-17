"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Header from "./header"
import Sidebar from "./sidebar"
import { supabaseBrowser } from "@/lib/supabase-client"
import { showSystemNotification } from "@/lib/system-notifications"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [subscriptionExpired, setSubscriptionExpired] = useState(false)
  const [studentIsPremium, setStudentIsPremium] = useState(false)
  const [unreadCommuniques, setUnreadCommuniques] = useState(0)
  const [studentSchoolId, setStudentSchoolId] = useState<number | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }

    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem("theme") as "light" | "dark" | null
      if (currentTheme) {
        setTheme(currentTheme)
        document.documentElement.classList.toggle("dark", currentTheme === "dark")
      }
    }

    window.addEventListener("storage", handleThemeChange)
    window.addEventListener("themeChange", handleThemeChange)

    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Re-fetch count when a communiqué is read (badge decrements)
    const handleCommuniqueRead = async () => {
      try {
        const countRes = await fetch('/api/student/communiques/count', { credentials: 'include' })
        if (countRes.ok) {
          const countData = await countRes.json()
          setUnreadCommuniques(countData.unread || 0)
        }
      } catch {}
    }
    window.addEventListener('communiqueRead', handleCommuniqueRead)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('storage', handleThemeChange)
      window.removeEventListener('themeChange', handleThemeChange)
      window.removeEventListener('communiqueRead', handleCommuniqueRead)
    }
  }, [])

  // Fetch role + subscription status
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          const userRole = data.user?.role || null
          setRole(userRole)
          if (userRole === "SUPER_ADMIN") {
            router.replace("/super-admin")
            return
          }
          if (data.subscription) {
            setSubscriptionExpired(data.subscription.expired === true)
          }
          if (userRole === "ELEVE") {
            try {
              const studentRes = await fetch('/api/student/me', { credentials: 'include' })
              if (studentRes.ok) {
                const studentData = await studentRes.json()
                setStudentIsPremium(studentData.student?.isPremium === true)
                if (studentData.student?.schoolId) {
                  setStudentSchoolId(studentData.student.schoolId)
                }
              }
            } catch {}
            try {
              const countRes = await fetch('/api/student/communiques/count', { credentials: 'include' })
              if (countRes.ok) {
                const countData = await countRes.json()
                setUnreadCommuniques(countData.unread || 0)
              }
            } catch {}
          }
          return
        }
      } catch {}
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

  // Supabase Realtime: listen for new communiqués for this school
  useEffect(() => {
    if (!studentSchoolId) return

    const channel = supabaseBrowser
      .channel(`communiques:school:${studentSchoolId}`)
      .on("broadcast", { event: "new_communique" }, () => {
        setUnreadCommuniques(prev => prev + 1)
        void showSystemNotification("digiSchool", "Nouveau communiqué publié", { url: "/student/communiques" })
      })
      .subscribe()

    return () => { supabaseBrowser.removeChannel(channel) }
  }, [studentSchoolId])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className={`min-h-screen transition-colors ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <Header onSidebarToggle={toggleSidebar} role={role} />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        subscriptionExpired={subscriptionExpired}
        studentIsPremium={studentIsPremium}
        badgeCounts={{ "/student/communiques": unreadCommuniques }}
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
