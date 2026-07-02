# Kelasi 360

**Kelasi 360** est une plateforme SaaS de gestion scolaire multi-tenant, développée avec Next.js, Prisma et PostgreSQL. Elle est conçue pour les établissements scolaires en **République Démocratique du Congo (RDC)** : classes au format national, frais en USD/CDF, abonnements par école, etc.

> **Pour les agents IA / développeurs** : ce README décrit l'état réel du dépôt (routes, rôles, modules complets vs stubs). Lisez les sections [Architecture](#architecture), [Rôles et accès](#rôles-et-accès) et [État des modules](#état-des-modules) avant toute modification.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [État des modules](#état-des-modules)
- [Technologies](#technologies)
- [Prérequis et installation](#prérequis-et-installation)
- [Variables d'environnement](#variables-denvironnement)
- [Architecture](#architecture)
- [Rôles et accès](#rôles-et-accès)
- [Routes pages](#routes-pages)
- [API Routes](#api-routes)
- [Base de données](#base-de-données)
- [Branding](#branding)
- [Scripts npm](#scripts-npm)
- [Comptes de test](#comptes-de-test)
- [Documentation complémentaire](#documentation-complémentaire)
- [Développement](#développement)

---

## Fonctionnalités

### Plateforme (Super Admin)

- Gestion multi-écoles (création, édition, suspension, suppression)
- Wizard de création d'école (infos légales RDC, direction, abonnement)
- Gestion des administrateurs par école (CRUD, reset mot de passe)
- Tableau de bord plateforme : KPIs, graphiques d'abonnements
- Paramètres globaux : devise (USD/CDF), taux de change
- Notifications d'expiration d'abonnement (seuils 15/10/5/2/1 jour)
- Export et impression des listes d'écoles

### Administration d'école (`/admin`)

| Module | Description |
|--------|-------------|
| **Dashboard** | Statistiques élèves, enseignants, paiements ; graphiques mensuels (Recharts) |
| **Utilisateurs** | CRUD élèves et enseignants, recherche, pagination, génération d'identifiants |
| **Fiche élève** | Parents/tuteurs, infos médicales, photo, QR code, inscriptions |
| **Classes** | Format RDC : niveau + section + lettre + filière |
| **Frais scolaires** | Types, tarifications, échéances, paiements, soldes, reçus |
| **Trésorerie** | Salaires enseignants, dépenses, balance globale |
| **Abonnement** | Consultation du statut et contact support Kelasi 360 |
| **Notifications** | Alertes liées à l'abonnement de l'école |
| **Paramètres** | Devise, taux USD/CDF, années scolaires |

### Espace élève (`/student`)

- Dashboard avec infos classe et année scolaire
- Notifications (lecture, marquage lu)
- Horaires, notes, frais, paramètres : **placeholders** (à venir)

### Format des classes RDC

- **Niveaux** : 1ère à 6ème
- **Sections** : Primaire, Secondaire, Supérieur
- **Divisions** : Lettres A–F (optionnelles selon contexte)
- **Filières** : Scientifique, Littéraire, Technique, Commerciale, Économique

Exemples : `1ère A Primaire`, `2ème B Secondaire Littéraire`, `1ère A Supérieur Technique`

### Module frais scolaires (détail)

1. **Types de frais** — scolarité, inscription, etc.
2. **Tarifications** — montants par type / classe / année
3. **Échéances** — dates limites de paiement
4. **Paiements** — enregistrement, annulation, reçus HTML
5. **Soldes** — vue par élève (soldé / partiel / impayé)

Modes de paiement : `CASH`, `VIREMENT`, `MOBILE_MONEY`, `CHEQUE`, `AUTRE`

### Module trésorerie (détail)

- Revenus issus des paiements de frais scolaires
- Paiements enseignants : salaire, prime, bonus, avance
- Dépenses : fournitures, équipement, maintenance, transport, etc.
- Balance = revenus − salaires − dépenses

---

## État des modules

| Module | Route | État |
|--------|-------|------|
| Super Admin | `/super-admin` | ✅ Complet |
| Dashboard admin | `/admin` | ✅ Complet |
| Utilisateurs | `/admin/users` | ✅ Complet |
| Fiche élève | `/admin/students/[id]` | ✅ Complet |
| Classes | `/admin/classes` | ✅ Complet |
| Frais scolaires | `/admin/fees` | ✅ Complet |
| Trésorerie | `/admin/treasury` | ✅ Complet |
| Abonnement | `/admin/subscription` | ✅ Complet |
| Notifications admin | `/admin/notifications` | ✅ Complet |
| Paramètres | `/admin/settings` | ✅ Complet |
| Dashboard élève | `/student` | ✅ Partiel |
| Notifications élève | `/student/notifications` | ✅ Complet |
| Horaires | `/admin/schedule`, `/student/schedule` | 🚧 Schéma Prisma prêt, UI/API absents |
| Notes | `/admin/grades`, `/student/grades` | 🚧 Stub |
| Présences | `/admin/attendance` | 🚧 Stub (hors sidebar) |
| Matières | `/admin/subjects` | 🚧 Stub (hors sidebar) |
| Portail professeur | — | ❌ Rôle `PROFESSEUR` sans interface |
| Portail parent | — | ❌ Données sur `Student` uniquement |

**Abonnement expiré** : toutes les routes `/admin/*` sont verrouillées sauf `/admin/subscription` et `/admin/settings`.

---

## Technologies

| Couche | Stack |
|--------|-------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Base de données | **PostgreSQL** + Prisma ORM 6 (cible : Supabase) |
| Auth | JWT custom (`jose` + `jsonwebtoken`) + `bcryptjs` |
| UI | Composants maison, Radix Slot, Lucide React, Sonner |
| Graphiques | Recharts |
| Validation | Zod |
| Cache | Mémoire in-process (`src/lib/cache.ts`, TTL 5 min) |

> `next-auth` est listé dans `package.json` mais **n'est pas utilisé** dans le code.

---

## Prérequis et installation

- Node.js 18+
- PostgreSQL 14+ (ou compte Supabase)
- npm

```bash
# 1. Cloner et installer
git clone <repository-url>
cd school-management
npm install

# 2. Configurer l'environnement (voir section ci-dessous)
cp .env.example .env.local   # créer ce fichier si absent

# 3. Base de données
npx prisma generate
# Option A — Supabase : exécuter prisma/init_supabase.sql dans le SQL Editor
# Option B — Local : npx prisma db push

# 4. Données de test
npm run prisma:seed

# 5. Lancer
npm run dev
```

Application disponible sur [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
# PostgreSQL (Supabase ou local)
DATABASE_URL="postgresql://user:password@host:5432/school_db?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/school_db"

# Sécurité — obligatoire en production
JWT_SECRET="votre-cle-secrete-longue-et-aleatoire"

# Domaine pour les emails générés automatiquement
SCHOOL_EMAIL_DOMAIN="school.local"

# Protection du cron de vérification des abonnements (optionnel)
CRON_SECRET="votre-secret-cron"
```

| Variable | Obligatoire | Défaut | Usage |
|----------|-------------|--------|-------|
| `DATABASE_URL` | Oui | — | Connexion Prisma (souvent via pooler) |
| `DIRECT_URL` | Oui (Supabase) | — | Connexion directe pour migrations |
| `JWT_SECRET` | Fortement recommandé | `"secret_key"` | Signature des tokens |
| `SCHOOL_EMAIL_DOMAIN` | Non | `"school.local"` | Emails auto (élèves, admins) |
| `CRON_SECRET` | Non | `"your-cron-secret"` | `/api/notifications/check` |

---

## Architecture

```
school-management/
├── middleware.ts              # Protection JWT par rôle
├── prisma/
│   ├── schema.prisma          # Schéma PostgreSQL (22 modèles)
│   ├── seed.ts                # Données de test
│   ├── seed_super_admin.sql   # Super admin SQL (Supabase)
│   └── init_supabase.sql      # Script d'initialisation complet
├── public/
│   ├── Kelasi360-light.png    # Logo fond clair (K/360 noirs)
│   └── Kelasi360-dark.png     # Logo fond sombre (K/360 blancs, transparent)
└── src/
    ├── app/                   # Pages et API (App Router)
    ├── components/            # Layout, sidebar, header, UI
    └── lib/                   # Prisma, auth, frais, cache, utils
```

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `middleware.ts` | Redirection et protection par rôle JWT |
| `src/lib/prisma.ts` | Client Prisma singleton |
| `src/lib/auth-fetch.ts` | Fetch client avec redirection 401 |
| `src/lib/generateCredentials.ts` | Génération emails / mots de passe |
| `src/lib/fees/*` | Services et validation du module frais |
| `src/components/layout.tsx` | Layout principal (header + sidebar) |
| `src/components/sidebar.tsx` | Navigation selon rôle admin/élève |

### Multi-tenant

Chaque école (`School`) est isolée par `schoolId` présent dans le JWT. Les API admin filtrent systématiquement par école courante.

---

## Rôles et accès

| Rôle | Zone | Redirection après login |
|------|------|-------------------------|
| `SUPER_ADMIN` | `/super-admin/*` | `/super-admin/login` puis dashboard |
| `ADMIN` | `/admin/*` | `/admin` |
| `COMPTABLE` | `/admin/*` | `/admin` |
| `DIRECTEUR_DISCIPLINE` | `/admin/*` | `/admin` |
| `DIRECTEUR_ETUDES` | `/admin/*` | `/admin` |
| `ELEVE` | `/student/*` | `/student` |
| `PROFESSEUR` | ❌ Aucun portail | Non géré — retour `/login` |

### Flux d'authentification

1. `POST /api/auth/login` → vérification bcrypt → JWT
2. Token en cookie HttpOnly `token` (1 h) + copie `localStorage`
3. `middleware.ts` vérifie le JWT via `jose`
4. Mots de passe temporaires → modal de changement obligatoire (`/api/auth/change-password`)
5. `/register` est bloqué (redirection vers `/login`)

---

## Routes pages

### Publiques

| Route | Fichier |
|-------|---------|
| `/` | Redirection selon rôle |
| `/login` | Connexion école (admin, élève, staff) |
| `/super-admin/login` | Connexion super admin |

### Super Admin (`src/app/super-admin/`)

| Route | Description |
|-------|-------------|
| `/super-admin` | Dashboard plateforme (monolithique) |
| `/super-admin/schools/[id]` | Détail école |
| `/super-admin/schools/[id]/subscription` | Abonnement école |

### Admin (`src/app/admin/`)

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/users` | Élèves et enseignants |
| `/admin/students/[id]` | Fiche élève |
| `/admin/classes` | Classes |
| `/admin/fees` | Frais scolaires |
| `/admin/treasury` | Trésorerie |
| `/admin/subscription` | Abonnement |
| `/admin/notifications` | Notifications |
| `/admin/settings` | Paramètres |
| `/admin/schedule` | Horaires (en cours) |
| `/admin/grades` | Notes (stub) |
| `/admin/attendance` | Présences (stub) |
| `/admin/subjects` | Matières (stub) |

### Élève (`src/app/student/`)

| Route | Description |
|-------|-------------|
| `/student` | Dashboard |
| `/student/notifications` | Notifications |
| `/student/schedule` | Placeholder |
| `/student/grades` | Placeholder |
| `/student/fees` | Placeholder |
| `/student/settings` | Placeholder |

---

## API Routes

### Auth — `/api/auth/`

| Endpoint | Méthodes |
|----------|----------|
| `/login` | POST |
| `/logout` | POST |
| `/me` | GET |
| `/register` | POST (SUPER_ADMIN uniquement) |
| `/change-password` | POST |

### Admin — `/api/admin/`

| Groupe | Endpoints principaux |
|--------|---------------------|
| Général | `dashboard-stats`, `meta`, `school`, `settings`, `academic-years` |
| Classes | `classes`, `classes/[id]` |
| Utilisateurs | `students`, `students/[id]`, `teachers`, `teachers/[id]` |
| Frais | `fees/stats`, `fees/types`, `fees/tarifications`, `fees/echeances`, `fees/paiements`, `fees/balance`, `fees/enrollments`, `fees/students` |
| Trésorerie | `fees/treasury`, `fees/treasury/teacher-payments`, `fees/treasury/expenses` |

### Super Admin — `/api/super-admin/`

| Endpoint | Méthodes |
|----------|----------|
| `schools` | GET, POST |
| `schools/[id]` | GET, PUT, PATCH, DELETE |
| `schools/[id]/details` | GET |
| `schools/[id]/subscription` | PUT |
| `admins` | GET, POST |
| `admins/[id]` | PATCH, DELETE |
| `admins/[id]/reset-password` | POST |
| `settings` | GET, PUT |

### Élève — `/api/student/`

| Endpoint | Méthodes |
|----------|----------|
| `me` | GET |
| `notifications` | GET |
| `notifications/[id]/read` | POST |
| `notifications/read-all` | POST |

### Notifications — `/api/notifications/`

| Endpoint | Usage |
|----------|-------|
| `GET/POST /` | Liste / création |
| `[id]` PATCH/DELETE | Lecture / suppression |
| `count` | Compteur non lues |
| `check` | Cron expiration abonnements (`CRON_SECRET`) |

---

## Base de données

**Fichier** : `prisma/schema.prisma` — provider **PostgreSQL**

### Modèles principaux

`User`, `School`, `Student`, `Teacher`, `Class`, `AcademicYear`, `Enrollment`, `Notification`

### Module frais

`TypeFrais`, `Tarification`, `Echeance`, `Paiement`, `PaiementModification`, `ReceiptCounter`

### Module trésorerie

`TeacherPayment`, `SchoolExpense`

### Module horaires (schéma prêt)

`Subject`, `CourseAssignment`, `ScheduleSlot`, `ScheduleBreak`

### Enums importants

- `User_role` : ADMIN, ELEVE, COMPTABLE, PROFESSEUR, DIRECTEUR_DISCIPLINE, DIRECTEUR_ETUDES, SUPER_ADMIN
- `EnrollmentStatus` : ACTIVE, INACTIVE, GRADUATED, DROPPED_OUT, EXPELLED
- `ModePaiement` : CASH, VIREMENT, MOBILE_MONEY, CHEQUE, AUTRE

> Pas de dossier `prisma/migrations/` — initialisation via `init_supabase.sql` et scripts SQL à la racine.

---

## Branding

| Élément | Valeur |
|---------|--------|
| Nom plateforme | **Kelasi 360** |
| Logo fond clair | `public/Kelasi360-light.png` |
| Logo fond sombre | `public/Kelasi360-dark.png` |
| Composant | `src/components/kelasi-logo.tsx` (`variant`: `light` / `dark` / `auto`) |
| Metadata | `src/app/layout.tsx` |
| Pages login | `src/app/login/page.tsx`, `src/app/super-admin/login/page.tsx` |
| Support | `support@kelasi360.com` |
| Super admin seed | `superadmin@kelasi360.com` |

---

## Scripts npm

```bash
npm run dev              # Serveur de développement
npm run build            # prisma generate + build production
npm run start            # Serveur production
npm run lint             # ESLint
npm run prisma:generate  # Générer le client Prisma
npm run prisma:migrate   # Migrations Prisma
npm run prisma:studio    # Interface Prisma Studio
npm run prisma:seed      # Données de test
```

---

## Comptes de test

Après `npm run prisma:seed` :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin@school.local` | `admin123` | ADMIN |
| `super@school.local` | `admin123` | SUPER_ADMIN |

Super admin SQL (`prisma/seed_super_admin.sql`) :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `superadmin@kelasi360.com` | `SuperAdmin@2026` | SUPER_ADMIN |

---

## Documentation complémentaire

Fichiers Markdown à la racine du dépôt :

| Fichier | Sujet |
|---------|-------|
| `README_CLASSES.md` | Format et gestion des classes |
| `README_NOTIFICATIONS.md` | Système de notifications |
| `QUICK_START_NOTIFICATIONS.md` | Démarrage rapide notifications |
| `OPTIMIZATION_REPORT.md` | Rapport d'optimisations |
| `CACHE_IMPLEMENTATION_COMPLETE.md` | Cache mémoire |

---

## Développement

### Ajouter une fonctionnalité

1. Modèles dans `prisma/schema.prisma` → `npx prisma generate`
2. API dans `src/app/api/`
3. Page UI dans `src/app/`
4. Lien sidebar si nécessaire (`src/components/sidebar.tsx`)
5. Vérifier les permissions par rôle dans les routes API

### Points d'attention

- Toujours filtrer par `schoolId` pour les routes admin
- Le rôle `PROFESSEUR` n'a pas encore de portail — à créer sous `/teacher` si besoin
- Les parents n'ont pas de compte ; leurs données sont sur le modèle `Student`
- `school_settings` est géré en SQL brut (devise, taux, année courante)

---

**Kelasi 360** — Développé avec ❤️ pour l'éducation en RDC.
