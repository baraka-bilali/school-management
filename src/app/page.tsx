"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/layout"
import Dashboard from "@/components/dashboard"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.replace("/login")
      return
    }
    // Vérification simple du token (expiration)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      if (!payload || (payload.exp && Date.now() / 1000 > payload.exp)) {
        localStorage.removeItem("token")
        router.replace("/login")
      }
    } catch {
      localStorage.removeItem("token")
      router.replace("/login")
    }
  }, [router])

  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}
