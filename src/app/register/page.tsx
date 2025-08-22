"use client"

import { useState } from "react"
import Link from "next/link"
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
            <School className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">School Management</h1>
          <p className="text-sm text-gray-500 mt-1">Créez votre compte</p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Votre nom complet"
                    className="pl-10"
                    required
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <Input
                    type="email"
                    name="email"
                    placeholder="vous@exemple.com"
                    className="pl-10"
                    required
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                    value={form.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  name="role"
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.role}
                  onChange={handleChange}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {success && <div className="text-green-600 text-sm">{success}</div>}
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? "Inscription..." : "S'inscrire"}
              </Button>
            </form>
            <div className="text-center text-sm text-gray-600 mt-6">
              Déjà un compte ?
              <Link href="/login" className="ml-1 text-indigo-600 hover:text-indigo-800">Se connecter</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
