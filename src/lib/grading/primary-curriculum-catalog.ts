/**
 * Catalogue officiel des structures primaire (RDC).
 * Source de vérité : maxPeriode uniquement.
 * Formules : examen=2×, trimestre=4×, annuel=12×.
 *
 * ELEMENTAIRE + MOYEN + TERMINAL_5 + TERMINAL_6 : lecture fiable des bulletins officiels.
 */

export type PrimaryBranchCatalog = {
  name: string
  maxPeriode: number
}

export type PrimaryGroupCatalog = {
  name: string
  branches: PrimaryBranchCatalog[]
}

export type PrimaryDomainCatalog = {
  name: string
  groups?: PrimaryGroupCatalog[]
  /** Branches directement sous le domaine (sans groupe) */
  branches?: PrimaryBranchCatalog[]
}

export type PrimaryDegreeCatalog = {
  code: "ELEMENTAIRE" | "MOYEN" | "TERMINAL_5" | "TERMINAL_6"
  name: string
  levels: string[]
  needsReview: boolean
  domains: PrimaryDomainCatalog[]
}

export const PRIMARY_DEGREE_CATALOG: PrimaryDegreeCatalog[] = [
  {
    code: "ELEMENTAIRE",
    name: "Degré Élémentaire (1ère, 2e année)",
    levels: ["1ère", "2ème"],
    needsReview: false,
    domains: [
      {
        name: "Domaine des Langues",
        groups: [
          {
            name: "Langues congolaises",
            branches: [
              { name: "Exp. Orale/L. des Signes", maxPeriode: 20 },
              { name: "Exp. Ecrite/Braille Int.", maxPeriode: 20 },
            ],
          },
          {
            name: "Français",
            branches: [
              { name: "Vocabulaire", maxPeriode: 10 },
              { name: "Exp. Orale/Art & Parole", maxPeriode: 20 },
            ],
          },
        ],
        branches: [
          { name: "Lecture-Écriture en langues congolaises/Lecture labiale", maxPeriode: 30 },
        ],
      },
      {
        name: "Domaine des Mathématiques, Sciences et Technologie",
        groups: [
          {
            name: "Mathématiques",
            branches: [
              { name: "Mesures des grandeurs", maxPeriode: 10 },
              { name: "Formes géométriques", maxPeriode: 10 },
              { name: "Numération", maxPeriode: 20 },
              { name: "Opérations", maxPeriode: 20 },
              { name: "Problèmes", maxPeriode: 20 },
            ],
          },
          {
            name: "Sciences",
            branches: [{ name: "Sciences d'éveil", maxPeriode: 20 }],
          },
          {
            name: "Technologie",
            branches: [{ name: "Technologie", maxPeriode: 10 }],
          },
        ],
      },
      {
        name: "Domaine de l'Univers Social et Environnement",
        branches: [
          { name: "Éducation Civ. & Morale", maxPeriode: 10 },
          { name: "Éducation Santé & Env.", maxPeriode: 10 },
        ],
      },
      {
        name: "Domaine des Arts",
        groups: [
          {
            name: "Éducation Artistique",
            branches: [
              { name: "Arts plastiques", maxPeriode: 10 },
              { name: "Arts dramatiques", maxPeriode: 10 },
            ],
          },
        ],
      },
      {
        name: "Domaine du Développement Personnel",
        branches: [
          { name: "Éd. phys. & Sport/Mobilité", maxPeriode: 10 },
          { name: "Init. Trav. Prod./Act. V.S", maxPeriode: 10 },
          { name: "Religion", maxPeriode: 10 },
        ],
      },
    ],
  },
  {
    /** Bulletin officiel IGE/P.S./005 — Degré Moyen (max période 300 → trim 1200 → an 3600). */
    code: "MOYEN",
    name: "Degré Moyen (3e, 4e année)",
    levels: ["3ème", "4ème"],
    needsReview: false,
    domains: [
      {
        name: "Domaine des Langues",
        groups: [
          {
            name: "Langues congolaises",
            branches: [
              { name: "Exp. Orale & Vocabulaire", maxPeriode: 10 },
              { name: "Grammaire & Conjug.", maxPeriode: 10 },
              { name: "Orth. & Rédaction", maxPeriode: 5 },
            ],
          },
          {
            name: "Français",
            branches: [
              { name: "Expr. orale - Récit. - Voc.", maxPeriode: 10 },
              { name: "Orth. phras. Ecrit. & réd.", maxPeriode: 10 },
              { name: "Gram. - Conj. - Analyse", maxPeriode: 15 },
            ],
          },
        ],
        branches: [
          { name: "Lect-Ecrit en langues congolaises", maxPeriode: 30 },
          { name: "Lect-Ecrit en langue française", maxPeriode: 30 },
        ],
      },
      {
        name: "Domaine des Mathématiques, Sciences et Technologie",
        groups: [
          {
            name: "Mathématiques",
            branches: [
              { name: "Numération", maxPeriode: 10 },
              { name: "Opérations", maxPeriode: 10 },
              { name: "Mesures des Grandeurs", maxPeriode: 10 },
              { name: "Formes Géométriques", maxPeriode: 10 },
              { name: "Problèmes", maxPeriode: 20 },
            ],
          },
          {
            name: "Sciences",
            branches: [{ name: "Zoologie - botanique & Info.", maxPeriode: 10 }],
          },
          {
            name: "Technologie",
            branches: [{ name: "Technologie", maxPeriode: 20 }],
          },
        ],
      },
      {
        name: "Domaine de l'Univers Social et Environnement",
        branches: [
          { name: "Education civ. & morale", maxPeriode: 10 },
          { name: "Education santé & env.", maxPeriode: 10 },
          { name: "Géographie", maxPeriode: 10 },
          { name: "Histoire", maxPeriode: 10 },
        ],
      },
      {
        name: "Domaine des Arts",
        groups: [
          {
            name: "Éducation Artistique",
            branches: [
              { name: "Arts plastiques", maxPeriode: 10 },
              { name: "Arts dramatiques", maxPeriode: 10 },
            ],
          },
        ],
      },
      {
        name: "Domaine du Développement Personnel",
        branches: [
          { name: "Ed. phys. & sportive", maxPeriode: 10 },
          { name: "Init. Trav. Prod.", maxPeriode: 10 },
          { name: "Religion", maxPeriode: 10 },
        ],
      },
    ],
  },
  {
    /** Bulletin officiel — Degré Terminal / Enseignement spécial (5ème) — max période 310 → trim 1240 → an 3720. */
    code: "TERMINAL_5",
    name: "Degré Terminal (5e année)",
    levels: ["5ème"],
    needsReview: false,
    domains: [
      {
        name: "Domaine des Langues",
        groups: [
          {
            name: "Langues congolaises",
            branches: [
              { name: "Grammaire & Conj.", maxPeriode: 10 },
              { name: "Exp. Orale/Voc/L.des signs", maxPeriode: 10 },
              { name: "Orth. & redaction", maxPeriode: 10 },
            ],
          },
          {
            name: "Français",
            branches: [
              { name: "Exp. Orale & Vocabulaire", maxPeriode: 10 },
              { name: "Orthographe", maxPeriode: 10 },
              { name: "Rédaction / Braille int.", maxPeriode: 10 },
              { name: "Gram. Conj. & Analyse", maxPeriode: 20 },
            ],
          },
        ],
        branches: [
          { name: "Lecture-Ecriture en langues congolaise / Lecture labiale", maxPeriode: 20 },
          { name: "Lecture-Ecriture en langues française / Lecture labiale", maxPeriode: 20 },
        ],
      },
      {
        name: "Domaine des Mathématiques, Sciences et Technologie",
        groups: [
          {
            name: "Mathématiques",
            branches: [
              { name: "Numération", maxPeriode: 10 },
              { name: "Opérations", maxPeriode: 10 },
              { name: "Mesures des grandeurs", maxPeriode: 10 },
              { name: "Formes géométriques", maxPeriode: 10 },
              { name: "Problèmes", maxPeriode: 20 },
            ],
          },
          {
            name: "Sciences",
            branches: [
              { name: "Phys. Zoologie – Info.", maxPeriode: 10 },
              { name: "Anatomie - botanique", maxPeriode: 20 },
            ],
          },
          {
            name: "Technologie",
            branches: [{ name: "Technologie", maxPeriode: 10 }],
          },
        ],
      },
      {
        name: "Domaine de l'Univers Social et Environnement",
        branches: [
          { name: "Education Civ. & Morale", maxPeriode: 10 },
          { name: "Education Santé & Env.", maxPeriode: 10 },
          { name: "Géographie", maxPeriode: 10 },
          { name: "Histoire", maxPeriode: 10 },
        ],
      },
      {
        name: "Domaine des Arts",
        groups: [
          {
            name: "Éducation Artistique",
            branches: [
              { name: "Arts plastiques", maxPeriode: 10 },
              { name: "Arts dramatiques", maxPeriode: 10 },
            ],
          },
        ],
      },
      {
        name: "Domaine du Développement Personnel",
        branches: [
          { name: "Ed.phys./Sport/Mobil.", maxPeriode: 10 },
          { name: "Init.Trav.Prod./Act.V.J.", maxPeriode: 10 },
          { name: "Religion", maxPeriode: 10 },
        ],
      },
    ],
  },
  {
    code: "TERMINAL_6",
    name: "Degré Terminal (6e année)",
    levels: ["6ème"],
    needsReview: false,
    domains: [
      {
        name: "Domaine des Langues",
        groups: [
          {
            name: "Langues congolaises",
            branches: [
              { name: "Gram. & Conj.", maxPeriode: 10 },
              { name: "Exp. Orale & Vocab.", maxPeriode: 10 },
              { name: "Orth. & rédaction", maxPeriode: 10 },
            ],
          },
          {
            name: "Français",
            branches: [
              { name: "Exp. Oral & Vocabulaire", maxPeriode: 10 },
              { name: "Orthographe", maxPeriode: 10 },
              { name: "Rédaction", maxPeriode: 10 },
              { name: "Gram. Conj. Analyse", maxPeriode: 20 },
            ],
          },
        ],
        branches: [
          { name: "Lecture-Écriture en langues congolaises", maxPeriode: 20 },
          { name: "Lecture-Écriture en langue française", maxPeriode: 20 },
        ],
      },
      {
        name: "Domaine des Mathématiques, Sciences et Technologie",
        groups: [
          {
            name: "Mathématiques",
            branches: [
              { name: "Numération", maxPeriode: 10 },
              { name: "Opérations", maxPeriode: 10 },
              { name: "Mesures des grandeurs", maxPeriode: 10 },
              { name: "Formes géométriques", maxPeriode: 10 },
              { name: "Problèmes", maxPeriode: 20 },
            ],
          },
          {
            name: "Sciences",
            branches: [
              { name: "Phys.-zoolo.-info.", maxPeriode: 10 },
              { name: "Anatomie-botanique", maxPeriode: 20 },
            ],
          },
          {
            name: "Technologie",
            branches: [{ name: "Technologie", maxPeriode: 10 }],
          },
        ],
      },
      {
        name: "Domaine de l'Univers Social et Environnement",
        branches: [
          { name: "Éd. civ. & morale", maxPeriode: 10 },
          { name: "Éd. santé & env.", maxPeriode: 10 },
          { name: "Géographie", maxPeriode: 10 },
          { name: "Histoire", maxPeriode: 10 },
        ],
      },
      {
        name: "Domaine des Arts",
        groups: [
          {
            name: "Éducation Artistique",
            branches: [
              { name: "Arts Plastiques", maxPeriode: 10 },
              { name: "Arts Dramatiques", maxPeriode: 10 },
            ],
          },
        ],
      },
      {
        name: "Domaine du Développement Personnel",
        branches: [
          { name: "Init. Trav. Prod.", maxPeriode: 10 },
          { name: "Éd. phys. & sports", maxPeriode: 10 },
          { name: "Religion", maxPeriode: 10 },
        ],
      },
    ],
  },
]

/** Somme des maxPeriode d'un degré (Maxima Généraux période). */
export function sumDegreeMaxPeriode(degree: PrimaryDegreeCatalog): number {
  let total = 0
  for (const domain of degree.domains) {
    for (const group of domain.groups ?? []) {
      for (const b of group.branches) total += b.maxPeriode
    }
    for (const b of domain.branches ?? []) total += b.maxPeriode
  }
  return total
}
