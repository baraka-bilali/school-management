"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/cards"

type School = { id: number; name: string; code: string; address?: string | null; createdAt: string }

export default function SuperAdminHome() {
  const router = useRouter()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", address: "" })

  useEffect(() => {
    // Client-side role check for UX, server middleware enforces access
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role !== 'SUPER_ADMIN') {
          router.replace('/login')
        }
      } catch {}
    }
  }, [router])

  const loadSchools = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/super-admin/schools')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setSchools(data.schools)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchools()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    try {
      const res = await fetch('/api/super-admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setForm({ name: '', code: '', address: '' })
      await loadSchools()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Espace Super Admin</h1>
        <p className="text-gray-600 mt-2">Gérez les écoles et les comptes supérieurs.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Créer une école</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <Input value={form.name} onChange={(e)=>setForm(prev=>({ ...prev, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <Input value={form.code} onChange={(e)=>setForm(prev=>({ ...prev, code: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <Input value={form.address} onChange={(e)=>setForm(prev=>({ ...prev, address: e.target.value }))} />
              </div>
              {error && <div className="text-sm text-red-600">{error}</div>}
              <Button type="submit" disabled={creating}>{creating ? 'Création...' : 'Créer'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Écoles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-500">Chargement...</div>
            ) : schools.length === 0 ? (
              <div className="text-gray-500">Aucune école</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {schools.map((s)=> (
                  <li key={s.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-sm text-gray-500">Code: {s.code}{s.address ? ` • ${s.address}` : ''}</div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
