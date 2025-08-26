"use client"

import { useEffect, useState } from "react"

export default function TestAPIPage() {
  const [metaData, setMetaData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/meta')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setMetaData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setMetaData(null)
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test des API Routes</h1>
      
      {loading && (
        <div className="text-blue-600">Chargement en cours...</div>
      )}
      
      {error && (
        <div className="text-red-600 bg-red-50 p-4 rounded-md">
          <strong>Erreur :</strong> {error}
        </div>
      )}
      
      {metaData && (
        <div className="bg-green-50 p-4 rounded-md">
          <h2 className="text-lg font-semibold text-green-800 mb-2">✅ API /api/admin/meta fonctionne !</h2>
          <div className="text-sm text-green-700">
            <p><strong>Classes :</strong> {metaData.classes?.length || 0}</p>
            <p><strong>Années académiques :</strong> {metaData.years?.length || 0}</p>
            <p><strong>Année courante ID :</strong> {metaData.currentYearId || 'Aucune'}</p>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Routes à tester :</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><code>/api/admin/meta</code> - Métadonnées (classes, années)</li>
          <li><code>/api/admin/students</code> - Gestion des étudiants</li>
          <li><code>/api/admin/teachers</code> - Gestion des enseignants</li>
          <li><code>/api/admin/classes</code> - Gestion des classes</li>
        </ul>
      </div>
    </div>
  )
}
