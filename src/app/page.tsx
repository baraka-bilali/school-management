import Link from "next/link"
import type { Metadata } from "next"
import AuthHomeRedirect from "@/components/auth-home-redirect"
import LoginAmbientBackground from "@/components/login-ambient-background"
import KelasiLogo from "@/components/kelasi-logo"
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Kelasi 360 — Gestion scolaire pour les écoles en RDC",
  description:
    "Kelasi 360 (Kelasi) : logiciel de gestion scolaire pour les établissements en RDC. Élèves, notes, bulletins, frais scolaires, parents et passages — tout en un.",
  alternates: {
    canonical: "https://kelasi360.com/",
  },
  openGraph: {
    title: "Kelasi 360 — La plateforme scolaire de référence",
    description:
      "Découvrez Kelasi 360, la solution de gestion scolaire conçue pour les écoles en République Démocratique du Congo.",
    url: "https://kelasi360.com/",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://kelasi360.com/#organization",
      name: "Kelasi 360",
      alternateName: ["Kelasi", "Kelasi360"],
      url: "https://kelasi360.com",
      logo: "https://kelasi360.com/Kelasi360-logo.png",
      description:
        "Kelasi 360 est une plateforme de gestion scolaire 360° pour les établissements en RDC.",
      foundingLocation: {
        "@type": "Country",
        name: "République Démocratique du Congo",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+243-980-139-630",
          contactType: "customer support",
          availableLanguage: ["French"],
        },
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://kelasi360.com/#software",
      name: "Kelasi 360",
      alternateName: "Kelasi",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "School Management System",
      operatingSystem: "Web",
      url: "https://kelasi360.com",
      image: "https://kelasi360.com/Kelasi360-logo.png",
      description:
        "Logiciel de gestion scolaire Kelasi 360 : administration, notes, frais, communication parents et passages.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Abonnement scolaire — contactez le support pour démarrer",
      },
      publisher: { "@id": "https://kelasi360.com/#organization" },
      inLanguage: "fr",
    },
    {
      "@type": "WebSite",
      "@id": "https://kelasi360.com/#website",
      url: "https://kelasi360.com",
      name: "Kelasi 360",
      alternateName: "Kelasi",
      publisher: { "@id": "https://kelasi360.com/#organization" },
      inLanguage: "fr",
    },
  ],
}

const pillars = [
  {
    icon: GraduationCap,
    title: "Élèves & classes",
    text: "Identité permanente, inscriptions annuelles et passages de classe.",
  },
  {
    icon: BookOpen,
    title: "Notes & bulletins",
    text: "Suivi pédagogique clair pour enseignants, direction et parents.",
  },
  {
    icon: Wallet,
    title: "Frais & trésorerie",
    text: "Paiements, reçus et vision financière de l'établissement.",
  },
  {
    icon: Users,
    title: "Parents connectés",
    text: "Espace parent pour suivre la scolarité et les communications.",
  },
]

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthHomeRedirect />

      <main className="login-shell relative isolate overflow-hidden bg-[#eef2f9] text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <LoginAmbientBackground isDark />

        <div className="relative z-10 mx-auto flex min-h-[inherit] w-full max-w-5xl flex-col px-6 py-10 sm:py-14">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <KelasiLogo
                variant="light"
                priority
                className="h-12 w-12 object-contain sm:h-14 sm:w-14"
              />
              <div>
                <p className="text-lg font-bold tracking-tight sm:text-xl">Kelasi 360</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestion scolaire</p>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
            >
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          <section className="flex flex-1 flex-col justify-center py-12 sm:py-16">
            <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Plateforme scolaire Made for RDC
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Kelasi 360
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-300 sm:text-xl">
              La plateforme de gestion scolaire qui centralise élèves, notes, frais et
              communication parents — pour que chaque école gagne en clarté.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
              >
                Accéder à Kelasi
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/243980139630"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-gray-200 transition hover:bg-white/10"
              >
                Parler au support
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              Aussi appelé <strong className="font-semibold text-gray-200">Kelasi</strong> —
              kelasi360.com
            </p>
          </section>

          <section className="grid gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-[2px]"
              >
                <div className="mb-3 inline-flex rounded-xl bg-indigo-500/15 p-2 text-indigo-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white">{title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{text}</p>
              </article>
            ))}
          </section>

          <footer className="border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            <p>
              © {new Date().getFullYear()}{" "}
              <span className="font-medium text-gray-300">Kelasi 360</span> — créé par{" "}
              <a
                href="https://digicreateam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200"
              >
                digicreateam
              </a>
            </p>
          </footer>
        </div>
      </main>
    </>
  )
}
