# Système de Gestion Scolaire

Un système complet de gestion scolaire développé avec Next.js, Prisma et MySQL, spécialement conçu pour le contexte éducatif de la RDC.

## 🚀 Fonctionnalités

### 👥 Gestion des Utilisateurs

- **Élèves** : Création, modification, recherche et filtrage
- **Enseignants** : Gestion complète avec spécialités et contacts
- **Administrateurs** : Accès complet au système
- Génération automatique d'emails et mots de passe sécurisés

### 🏫 Gestion des Classes

- Format RDC : Niveau + Section + Lettre + Filière
- **Niveaux** : 1ère à 6ème
- **Sections** : Primaire, Secondaire, Supérieur
- **Divisions** : Lettres A, B, C, D, E, F
- **Filières** : Scientifique, Littéraire, Technique, Commerciale, Économique

### 📚 Gestion Académique

- Années académiques avec période courante
- Inscriptions des élèves aux classes
- Suivi des présences (en développement)
- Gestion des matières (en développement)

## 🛠️ Technologies

- **Frontend** : Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : MySQL avec Prisma ORM
- **Authentification** : JWT avec bcrypt
- **UI Components** : Shadcn/ui, Lucide React

## 📋 Prérequis

- Node.js 18+
- MySQL 8.0+
- npm ou yarn

## 🚀 Installation

1. **Cloner le projet**

   ```bash
   git clone <repository-url>
   cd school-management
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configuration de la base de données**

   ```bash
   # Créer un fichier .env.local
   DATABASE_URL="mysql://user:password@localhost:3306/school_db"
   SCHOOL_EMAIL_DOMAIN="school.local"
   ```

4. **Générer le client Prisma**

   ```bash
   npx prisma generate
   ```

5. **Synchroniser la base de données**

   ```bash
   npx prisma db push
   ```

6. **Initialiser avec des données de test**

   ```bash
   npm run prisma:seed
   ```

7. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

## 📁 Structure du Projet

```
src/
├── app/                    # App Router Next.js
│   ├── admin/             # Pages d'administration
│   │   ├── page.tsx       # Dashboard principal
│   │   ├── users/         # Gestion des utilisateurs
│   │   └── classes/       # Gestion des classes
│   ├── api/               # API Routes
│   │   └── admin/         # Endpoints d'administration
│   ├── login/             # Page de connexion
│   └── register/          # Page d'inscription
├── components/             # Composants réutilisables
│   ├── ui/                # Composants UI de base
│   ├── layout.tsx         # Layout principal
│   ├── sidebar.tsx        # Navigation latérale
│   └── dashboard.tsx      # Composant dashboard
└── lib/                   # Utilitaires et configurations
    ├── prisma.ts          # Client Prisma
    └── generateCredentials.ts # Génération d'identifiants
```

## 🔐 Authentification

- **Admin** : `admin@school.local` / `admin123`
- Les nouveaux utilisateurs reçoivent des identifiants générés automatiquement
- Mots de passe hashés avec bcrypt

## 📊 Format des Classes RDC

Le système respecte le format éducatif de la RDC :

- **Primaire** : 1ère A Primaire, 2ème A Primaire, etc.
- **Secondaire** : 1ère A Secondaire Scientifique, 2ème B Secondaire Littéraire, etc.
- **Supérieur** : 1ère A Supérieur Technique, 2ème A Supérieur Technique, etc.

## 🚧 Développement

### Scripts disponibles

```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run start            # Serveur de production
npm run lint             # Vérification du code
npm run prisma:generate  # Générer le client Prisma
npm run prisma:migrate   # Exécuter les migrations
npm run prisma:studio    # Interface Prisma Studio
npm run prisma:seed      # Initialiser la base de données
```

### Ajout de nouvelles fonctionnalités

1. Créer les modèles dans `prisma/schema.prisma`
2. Générer les migrations : `npx prisma migrate dev`
3. Créer les API routes dans `src/app/api/`
4. Développer l'interface utilisateur
5. Tester et valider

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

**Développé avec ❤️ pour l'éducation en RDC**
