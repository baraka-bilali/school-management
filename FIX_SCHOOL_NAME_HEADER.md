# ✅ Affichage du Nom de l'École dans le Header - CORRIGÉ

## 🎯 Objectif
Afficher le nom de l'école de l'administrateur connecté dans le header au lieu du texte générique "École".

---

## 🔧 Modifications Apportées

### 1. **Token JWT - Ajout du schoolId** ✅
**Fichier:** `src/app/api/auth/login/route.ts`

**Avant:**
```typescript
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  JWT_SECRET,
  { expiresIn: "1h" }
);
```

**Après:**
```typescript
const token = jwt.sign(
  { 
    id: user.id, 
    email: user.email, 
    role: user.role,
    schoolId: user.schoolId,  // ✅ AJOUTÉ
    name: user.name           // ✅ AJOUTÉ
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);
```

**Impact:** Le token contient maintenant l'ID de l'école, permettant à l'API `/api/admin/school` de récupérer le nom de l'école.

---

### 2. **Header Component - Amélioration de l'affichage** ✅
**Fichier:** `src/components/header.tsx`

**Changements:**

1. **Texte par défaut amélioré:**
   ```typescript
   // AVANT
   {schoolName || "School Management"}
   
   // APRÈS
   {schoolName || "Chargement..."}
   ```

2. **Fallback plus approprié:**
   ```typescript
   // AVANT
   setSchoolName("École")
   
   // APRÈS
   setSchoolName("Établissement")
   ```

3. **Validation du nom:**
   ```typescript
   if (data.nom && data.nom.trim() !== "") {
     setSchoolName(data.nom)
   } else {
     setSchoolName("Établissement")
   }
   ```

4. **Logging pour debugging:**
   ```typescript
   if (!payload.schoolId && payload.role === "ADMIN") {
     console.warn("⚠️ Le token ne contient pas de schoolId. Veuillez vous reconnecter.")
   }
   ```

---

## 🔄 Flux de Fonctionnement

```
1. Admin se connecte → /api/auth/login
2. Token JWT créé avec { id, email, role, schoolId, name }
3. Token stocké dans cookie + localStorage
4. Header charge → Lit le token → Appelle /api/admin/school
5. API vérifie schoolId dans token
6. API récupère School.nomEtablissement depuis la DB
7. Header affiche le nom de l'école
```

---

## 📊 API School - Fonctionnement

**Endpoint:** `GET /api/admin/school`

**Processus:**
1. Lit le token depuis les cookies
2. Vérifie le `schoolId` dans le token JWT
3. Cherche l'école dans la base de données
4. Retourne:
   ```json
   {
     "id": 1,
     "nom": "Institut Excellence",
     "adresse": "123 Rue de l'École",
     "telephone": "+243 XXX XXX XXX",
     "email": "contact@ecole.cd"
   }
   ```

---

## 🚨 Actions Requises

### Pour l'Administrateur Connecté

**Si le nom de l'école ne s'affiche pas, vous devez vous reconnecter:**

1. **Déconnexion:**
   - Cliquer sur le profil (coin supérieur droit)
   - Cliquer sur "Déconnexion"

2. **Reconnexion:**
   - Saisir votre email
   - Saisir votre mot de passe
   - Se connecter

3. **Vérification:**
   - Le header devrait maintenant afficher le nom de votre école
   - Exemple: "Institut Excellence" au lieu de "École" ou "Établissement"

**Raison:** Les anciens tokens ne contenaient pas le `schoolId`. La reconnexion génère un nouveau token avec toutes les informations nécessaires.

---

## 🐛 Debugging

### Si le nom ne s'affiche toujours pas après reconnexion:

1. **Ouvrir la console du navigateur (F12)**
2. **Vérifier les logs:**
   ```
   Payload du token: { id, email, role, schoolId, name }
   Réponse API école: 200
   Données école: { id, nom, adresse, ... }
   ```

3. **Cas d'erreur possibles:**

   **❌ Token sans schoolId:**
   ```
   ⚠️ Le token ne contient pas de schoolId. Veuillez vous reconnecter.
   ```
   **Solution:** Se reconnecter

   **❌ API retourne 401:**
   ```
   Réponse API école: 401
   Erreur API école: "Non autorisé"
   ```
   **Solution:** Vérifier que le token est valide, se reconnecter si nécessaire

   **❌ API retourne 404:**
   ```
   Réponse API école: 404
   Erreur API école: "Aucune école associée"
   ```
   **Solution:** L'utilisateur n'a pas de `schoolId` en base de données. Contacter le super admin.

   **❌ École introuvable:**
   ```
   Réponse API école: 404
   Erreur API école: "École introuvable"
   ```
   **Solution:** Le `schoolId` de l'utilisateur ne correspond à aucune école. Contacter le super admin.

---

## 🗄️ Vérification en Base de Données

### Vérifier le schoolId d'un utilisateur:

```sql
SELECT id, name, email, role, schoolId 
FROM User 
WHERE email = 'admin@ecole.cd';
```

**Résultat attendu:**
```
+----+---------------+------------------+-------+----------+
| id | name          | email            | role  | schoolId |
+----+---------------+------------------+-------+----------+
|  2 | Admin User    | admin@ecole.cd   | ADMIN |    1     |
+----+---------------+------------------+-------+----------+
```

### Vérifier le nom de l'école:

```sql
SELECT id, nomEtablissement, ville, province 
FROM School 
WHERE id = 1;
```

**Résultat attendu:**
```
+----+--------------------+----------+----------+
| id | nomEtablissement   | ville    | province |
+----+--------------------+----------+----------+
|  1 | Institut Excellence| Kinshasa | Kinshasa |
+----+--------------------+----------+----------+
```

---

## ✅ Résultat Final

**Avant:**
```
[🏫 École] ← Texte générique
```

**Après:**
```
[🏫 Institut Excellence] ← Nom réel de l'école
```

---

## 📝 Notes Importantes

1. **Compatibilité:** Tous les nouveaux utilisateurs créés auront automatiquement le `schoolId` dans leur token

2. **Migration:** Les anciens utilisateurs doivent se reconnecter une fois pour obtenir le nouveau token

3. **Sécurité:** Le `schoolId` est validé côté serveur, un utilisateur ne peut pas accéder aux données d'une autre école

4. **Super Admin:** Les super admins n'ont pas de `schoolId` (normal), ils ne verront donc pas de nom d'école dans le header

---

## 🎉 Confirmation de Succès

Vous saurez que tout fonctionne correctement quand:
- ✅ Le header affiche le nom de votre école au lieu de "École"
- ✅ La console ne montre aucune erreur
- ✅ Les logs montrent: `Données école: { id, nom, ... }`
- ✅ Le nom s'affiche immédiatement au chargement de la page

---

**Date de correction:** 15 novembre 2025
**Fichiers modifiés:** 2 (login/route.ts, header.tsx)
**Tests requis:** Reconnexion obligatoire pour les utilisateurs existants
