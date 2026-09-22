/**
 * Catalogue officiel CTEB (Éducation de Base) — 7ème / 8ème.
 * Source : bulletin 7ème CTEB (max période → examen×2 → semestre×4 → annuel×8).
 * Maxima généraux : période 400 · examen 800 · semestre 1600 · annuel 3200.
 *
 * Structure pédagogique pour le bulletin ; chaque branche = 1 Subject
 * assignable à un enseignant (CourseAssignment), contrairement au primaire.
 */

import { deriveCtebMaxima } from "@/lib/grading/cteb-maxima"

export type CtebBranchCatalog = {
  /** Code stable Subject.code (unique par école) */
  code: string
  name: string
  maxPeriode: number
}

export type CtebGroupCatalog = {
  name: string
  branches: CtebBranchCatalog[]
}

export type CtebDomainCatalog = {
  name: string
  groups?: CtebGroupCatalog[]
  branches?: CtebBranchCatalog[]
}

export type CtebDegreeCatalog = {
  code: "CTEB_7" | "CTEB_8"
  name: string
  levels: string[]
  domains: CtebDomainCatalog[]
}

/** Même grille officielle pour 7ème et 8ème (à ajuster si un bulletin 8ème diffère). */
const CTEB_DOMAINS: CtebDomainCatalog[] = [
  {
    name: "Domaine de Sciences",
    groups: [
      {
        name: "Mathématiques",
        branches: [
          { code: "CTEB-ALG", name: "Algèbre", maxPeriode: 40 },
          { code: "CTEB-ARI", name: "Arithmétique", maxPeriode: 10 },
          { code: "CTEB-GEO", name: "Géométrie", maxPeriode: 20 },
          { code: "CTEB-STA", name: "Statistique", maxPeriode: 10 },
        ],
      },
      {
        name: "Sciences de la Vie et de la Terre",
        branches: [
          { code: "CTEB-ANA", name: "Anatomie", maxPeriode: 10 },
          { code: "CTEB-BOT", name: "Botanique", maxPeriode: 10 },
          { code: "CTEB-ZOO", name: "Zoologie", maxPeriode: 10 },
        ],
      },
      {
        name: "Sciences Physiques, Technologie et TIC",
        branches: [
          { code: "CTEB-PHY", name: "Sciences Physiques", maxPeriode: 10 },
          { code: "CTEB-TEC", name: "Technologie", maxPeriode: 10 },
          { code: "CTEB-TIC", name: "Techn d'Info & Com", maxPeriode: 10 },
        ],
      },
    ],
  },
  {
    name: "Domaine des Langues",
    branches: [
      { code: "CTEB-ANG", name: "Anglais", maxPeriode: 30 },
      { code: "CTEB-FRA", name: "Français", maxPeriode: 70 },
    ],
  },
  {
    name: "Domaine de l'Univers Social et Environnement",
    branches: [
      { code: "CTEB-REL", name: "Religion", maxPeriode: 20 },
      { code: "CTEB-EVI", name: "Education à la vie", maxPeriode: 20 },
      { code: "CTEB-CIV", name: "Educ. Civ. & Morale", maxPeriode: 20 },
      { code: "CTEB-GEG", name: "Géographie", maxPeriode: 20 },
      { code: "CTEB-HIS", name: "Histoire", maxPeriode: 20 },
    ],
  },
  {
    name: "Domaine des Arts",
    branches: [
      { code: "CTEB-DES", name: "Dessin", maxPeriode: 20 },
      { code: "CTEB-MUS", name: "Musique", maxPeriode: 20 },
    ],
  },
  {
    name: "Domaine du Développement Personnel",
    branches: [{ code: "CTEB-EPS", name: "Education physique", maxPeriode: 20 }],
  },
]

export const CTEB_DEGREE_CATALOG: CtebDegreeCatalog[] = [
  {
    code: "CTEB_7",
    name: "7ème année CTEB",
    levels: ["7ème"],
    domains: CTEB_DOMAINS,
  },
  {
    code: "CTEB_8",
    name: "8ème année CTEB",
    levels: ["8ème"],
    domains: CTEB_DOMAINS,
  },
]

export function sumCtebMaxPeriode(degree: CtebDegreeCatalog): number {
  let total = 0
  for (const domain of degree.domains) {
    for (const g of domain.groups ?? []) {
      for (const b of g.branches) total += b.maxPeriode
    }
    for (const b of domain.branches ?? []) total += b.maxPeriode
  }
  return total
}

export function flattenCtebBranches(degree: CtebDegreeCatalog) {
  const out: Array<{
    code: string
    name: string
    maxPeriode: number
    domainName: string
    groupName: string | null
    maxima: ReturnType<typeof deriveCtebMaxima>
  }> = []
  for (const domain of degree.domains) {
    for (const g of domain.groups ?? []) {
      for (const b of g.branches) {
        out.push({
          code: b.code,
          name: b.name,
          maxPeriode: b.maxPeriode,
          domainName: domain.name,
          groupName: g.name,
          maxima: deriveCtebMaxima(b.maxPeriode),
        })
      }
    }
    for (const b of domain.branches ?? []) {
      out.push({
        code: b.code,
        name: b.name,
        maxPeriode: b.maxPeriode,
        domainName: domain.name,
        groupName: null,
        maxima: deriveCtebMaxima(b.maxPeriode),
      })
    }
  }
  return out
}
