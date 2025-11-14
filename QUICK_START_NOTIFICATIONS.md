# 🚀 Guide Rapide - Système de Notifications

## 🎯 Test Rapide

### 1. Préparer une école pour le test

```bash
# Mettre l'expiration à 5 jours pour l'école ID 8
node set-expiration-test.mjs 8 5
```

### 2. Lancer l'application

```bash
npm run dev
```

### 3. Se connecter en Super Admin

- Ouvrir http://localhost:3000
- Se connecter avec les credentials Super Admin
- Aller dans l'onglet **"Schools"**

### 4. Générer les notifications

- Cliquer sur le bouton **"Vérifier Notifications"**
- Une alerte apparaîtra : "✅ X notification(s) créée(s)"

### 5. Voir les notifications

- Regarder la cloche dans le header en haut à droite
- Un badge rouge avec le nombre de notifications apparaît
- La cloche pulse et le badge rebondit
- Cliquer sur la cloche pour ouvrir le panneau

### 6. Interagir avec les notifications

- **Marquer comme lu** : Cliquer sur ✓
- **Supprimer** : Cliquer sur ✗
- **Tout marquer lu** : Cliquer sur "Tout marquer lu"

## 🧪 Scénarios de Test

### Test 1 : Expiration dans 15 jours
```bash
node set-expiration-test.mjs 8 15
```
Résultat attendu : Notification bleue "expire dans 15 jours"

### Test 2 : Expiration dans 5 jours
```bash
node set-expiration-test.mjs 8 5
```
Résultat attendu : Notification jaune "expire dans 5 jours"

### Test 3 : Expiration dans 1 jour
```bash
node set-expiration-test.mjs 8 1
```
Résultat attendu : Notification orange "Attention ! expire dans 1 jour"

### Test 4 : Abonnement expiré
```bash
node set-expiration-test.mjs 8 0
```
Résultat attendu : 
- Notification rouge "a expiré"
- État de l'école devient "SUSPENDU"
- Message de suspension automatique

## 🎨 Code Couleur des Notifications

- 🔵 **Bleu** : 10-15 jours restants (Normal)
- 🟡 **Jaune** : 5 jours restants (Attention)
- 🟠 **Orange** : 1-2 jours restants (Urgent)
- 🔴 **Rouge** : Expiré (Critique)

## 📊 Vérifier les Résultats

### Dans l'interface
1. Badge sur la cloche : Montre le nombre de notifications non lues
2. Panneau de notifications : Liste complète avec filtres
3. Page école : Compte à rebours mis à jour

### Dans la base de données
```sql
-- Voir toutes les notifications
SELECT * FROM Notification ORDER BY createdAt DESC;

-- Compter les notifications par type
SELECT type, COUNT(*) as count 
FROM Notification 
GROUP BY type;

-- Voir les notifications non lues
SELECT * FROM Notification WHERE isRead = false;
```

## ⚙️ Configuration pour Production

### 1. Variables d'environnement

Dans `.env` :
```env
JWT_SECRET=your-production-secret
CRON_SECRET=your-cron-production-secret
```

### 2. Configurer un Cron Job

#### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/notifications/check",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### Alternative: Service externe (cron-job.org)
- URL: `https://votre-domaine.com/api/notifications/check`
- Méthode: GET
- Header: `Authorization: Bearer your-cron-secret`
- Fréquence: Tous les jours à 00:00

### 3. Tester le Cron Job

```bash
curl -X GET http://localhost:3000/api/notifications/check \
  -H "Authorization: Bearer your-cron-secret"
```

## 🐛 Dépannage

### Problème : Aucune notification générée

**Solution 1** : Vérifier la date d'expiration
```bash
node test-notifications.mjs
```

**Solution 2** : Vérifier que l'école est active
```sql
SELECT id, nomEtablissement, etatCompte, dateFinAbonnement 
FROM School 
WHERE id = 8;
```

**Solution 3** : Supprimer les notifications existantes
```sql
DELETE FROM Notification WHERE schoolId = 8;
```

### Problème : Badge ne s'affiche pas

**Solution** : Vérifier que l'utilisateur est connecté
- Ouvrir la console développeur (F12)
- Vérifier la requête `/api/notifications/count`
- Si erreur 401 : Se reconnecter

### Problème : Le client Prisma ne reconnaît pas le modèle

**Solution** :
```bash
# Arrêter le serveur
# Supprimer le cache
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "node_modules\.prisma" -Recurse -Force

# Régénérer
npx prisma generate

# Relancer
npm run dev
```

## 📱 Capture d'écran

### Badge avec notifications
```
🔔 [3]
```

### Panneau ouvert
```
┌─────────────────────────────────────────┐
│ 🔔 Notifications            [3]  ✓ Tout│
├─────────────────────────────────────────┤
│ 🔴 ⚠️ L'abonnement de l'école          │
│    "Don Bosco" a expiré...              │
│    Il y a 2h | Expiré              ✓ ✗│
├─────────────────────────────────────────┤
│ 🟡 🕐 L'abonnement de l'école          │
│    "Saint Joseph" expire dans 5 jours   │
│    Il y a 1j | 5j restants         ✓ ✗│
└─────────────────────────────────────────┘
```

## 🎉 Fonctionnalités Avancées

### Notification en temps réel
Le composant vérifie automatiquement toutes les **5 minutes** s'il y a de nouvelles notifications.

### Prévention des doublons
Le système ne crée pas plusieurs notifications du même type dans les 24h.

### Suspension automatique
Les comptes expirés sont automatiquement suspendus lors de la vérification.

### Messages contextuels
- Super Admin : Voit le nom de l'école concernée
- Admin d'école : Voit un message personnalisé pour son école

## 📞 Support

En cas de problème, vérifier :
1. Les logs du serveur (`npm run dev`)
2. La console du navigateur (F12)
3. Les erreurs Prisma (base de données)
4. La documentation complète : `README_NOTIFICATIONS.md`
