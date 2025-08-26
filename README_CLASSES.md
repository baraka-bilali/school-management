# Gestion des Classes et Filières - Format RDC

## 🎯 **Vue d'ensemble**

Le système de gestion des classes a été mis à jour pour respecter le format éducatif de la République Démocratique du Congo (RDC).

## 📋 **Format des Classes**

Chaque classe suit la structure : **Niveau + Division + Section + Filière**

### **Exemples :**

- `1ère A Primaire` (Niveau 1ère, Division A, Section Primaire)
- `2ème B Secondaire Scientifique` (Niveau 2ème, Division B, Section Secondaire, Filière Scientifique)
- `3ème C Secondaire Technique` (Niveau 3ème, Division C, Section Secondaire, Filière Technique)

## 🏗️ **Structure des Données**

### **Champs obligatoires :**

- **Niveau** : 1ère, 2ème, 3ème, 4ème, 5ème, 6ème
- **Section** : Primaire, Secondaire, Supérieur
- **Division** : A, B, C, D, E, F (lettres alphabétiques)

### **Champs optionnels :**

- **Filière** : Applicable uniquement aux sections Secondaire et Supérieur
  - Scientifique, Littéraire, Économique, Technique, Professionnelle
  - Commerciale, Agronomique, Médicale, Pédagogique

## 🚀 **Fonctionnalités**

### **1. Création de Classes**

- Formulaire avec validation automatique
- Génération automatique du nom selon le format RDC
- Vérification des doublons (même combinaison niveau/section/division)
- Aperçu en temps réel du nom généré

### **2. Modification de Classes**

- Édition de tous les champs
- Régénération automatique du nom
- Validation des contraintes

### **3. Suppression de Classes**

- Vérification qu'aucun élève n'est inscrit
- Protection contre la suppression accidentelle

### **4. Affichage**

- Tableau organisé par section, niveau, puis division
- Colonnes : Nom, Niveau, Section, Division, Filière, Date de création
- Actions : Modifier, Supprimer

## 🔧 **Installation et Configuration**

### **1. Mettre à jour la base de données**

```bash
# Après avoir modifié le schéma Prisma
npx prisma generate
npx prisma db push
```

### **2. Vérifier les variables d'environnement**

Assurez-vous que votre fichier `.env` contient :

```env
DATABASE_URL="mysql://..."
```

## 📱 **Interface Utilisateur**

### **Page d'accès :**

- URL : `/admin/classes`
- Navigation : Sidebar → Classes & Filières

### **Boutons d'action :**

- **Créer une classe** : Ouvre le modal de création
- **Modifier** : Ouvre le modal d'édition avec données pré-remplies
- **Supprimer** : Affiche la confirmation de suppression

## ⚠️ **Contraintes et Validations**

### **Règles métier :**

1. **Unicité** : Impossible d'avoir 2 classes avec la même combinaison niveau/section/division
2. **Filière** : Seulement applicable aux sections Secondaire et Supérieur
3. **Suppression** : Impossible si des élèves sont inscrits
4. **Nom automatique** : Généré selon le format RDC standard

### **Validation des données :**

- Tous les champs obligatoires doivent être remplis
- Le bouton de soumission est désactivé si la validation échoue
- Messages d'erreur clairs pour l'utilisateur

## 🎨 **Design et UX**

### **Interface :**

- Design Tabler-like cohérent avec le reste de l'application
- Modals responsifs et accessibles
- Aperçu en temps réel du nom de la classe
- États de chargement et gestion d'erreurs

### **Responsive :**

- S'adapte aux différentes tailles d'écran
- Tableau avec défilement horizontal sur petits écrans
- Boutons et formulaires optimisés pour mobile

## 🔄 **Workflow Typique**

1. **Créer une classe :**

   - Cliquer sur "Créer une classe"
   - Sélectionner Niveau, Section, Division
   - Choisir une Filière (si applicable)
   - Vérifier l'aperçu du nom
   - Valider

2. **Modifier une classe :**

   - Cliquer sur "Modifier" dans la ligne
   - Modifier les champs souhaités
   - Vérifier l'aperçu du nouveau nom
   - Valider

3. **Supprimer une classe :**
   - Cliquer sur "Supprimer"
   - Confirmer la suppression
   - Vérifier qu'aucun élève n'est inscrit

## 🐛 **Dépannage**

### **Erreurs courantes :**

1. **"Une classe avec ce nom existe déjà"** → Vérifier la combinaison niveau/section/division
2. **"Impossible de supprimer"** → Vérifier qu'aucun élève n'est inscrit
3. **Erreurs de base de données** → Vérifier la connexion et exécuter `npx prisma generate`

### **Logs :**

- Vérifier la console du navigateur pour les erreurs côté client
- Vérifier les logs du serveur pour les erreurs côté serveur

## 📈 **Évolutions Futures**

### **Fonctionnalités envisagées :**

- Import/export en masse des classes
- Gestion des horaires par classe
- Association automatique des matières par filière
- Statistiques d'effectifs par classe
- Gestion des salles de classe

---

**Note :** Ce système respecte les standards éducatifs de la RDC et peut être adapté selon les besoins spécifiques de votre établissement.


