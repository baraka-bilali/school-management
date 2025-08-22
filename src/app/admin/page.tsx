"use client"

import Layout from "@/components/layout"
import Dashboard from "@/components/dashboard"

export default function AdminPage() {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Espace Administration</h1>
        <Dashboard />
      </div>
    </Layout>
  )
}
