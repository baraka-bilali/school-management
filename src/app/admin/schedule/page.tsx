"use client"

import Layout from "@/components/layout"
import { Calendar, Clock, BookOpen, Users, Coffee } from "lucide-react"

export default function SchedulePage() {
  const features = [
    {
      icon: BookOpen,
      title: "Matières & Codes",
      description: "Chaque cours dispose d'un code abrégé (ex. MATH, FR, PHY) et d'un coefficient.",
    },
    {
      icon: Users,
      title: "Attribution professeurs",
      description: "Chaque cours est associé à un professeur responsable pour la classe.",
    },
    {
      icon: Clock,
      title: "Durée hebdomadaire",
      description: "Définissez les heures allouées par semaine et le plafond quotidien à ne pas dépasser.",
    },
    {
      icon: Coffee,
      title: "Pauses & Récréations",
      description: "Gérez les deux vacations (matin / après-midi), les récréations et la pause déjeuner.",
    },
    {
      icon: Calendar,
      title: "Grille horaire",
      description: "Visualisez et éditez le planning hebdomadaire classe par classe.",
    },
  ]

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
              <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Horaires</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-14">
            Système complet de gestion des emplois du temps — en cours de développement.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{feature.title}</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Coming soon banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white text-center shadow-lg">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h2 className="text-xl font-bold mb-1">Module en cours de construction</h2>
          <p className="text-indigo-100 text-sm">
            La grille horaire interactive, l&apos;édition par classe et la détection des conflits seront
            disponibles prochainement.
          </p>
        </div>
      </div>
    </Layout>
  )
}
