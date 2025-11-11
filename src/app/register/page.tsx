"use client"

import { useState } from "react"
// Page rendue inaccessible par middleware: on peut afficher une info ou rediriger côté client.
import { useEffect } from "react"
import { School, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/cards"

const roles = [
  { value: "ELEVE", label: "Élève" },
  { value: "ADMIN", label: "Admin" },
  { value: "COMPTABLE", label: "Comptable" },
  { value: "PROFESSEUR", label: "Professeur" },
  { value: "DIRECTEUR_DISCIPLINE", label: "Directeur Discipline" },
]

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ELEVE" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur inconnue")
      setSuccess("Inscription réussie ! Vous pouvez vous connecter.")
      setForm({ name: "", email: "", password: "", role: "ELEVE" })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    // Redirection côté client au cas où le middleware ne se déclenche pas (fallback)
    window.location.replace('/login')
  },[])
  return null
}
