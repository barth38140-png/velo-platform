# 🔧 Guide de Dépannage - Vélo Platform Backend

## ❌ Problèmes courants et solutions

### 1. Erreur de connexion PostgreSQL

**Erreur** :
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Causes possibles** :
- PostgreSQL n'est pas démarré
- Paramètres d'accès incorrects dans `.env`
- Port 5432 occupé par une autre application

**Solutions** :
```bash
# Windows - Démarrer PostgreSQL
net start PostgreSQL14  # Remplacer par votre version

# Linux/Mac
sudo systemctl start postgresql

# Vérifier la connexion
psql -U postgres -h localhost

# Si port occupé, vérifier quel processus
netstat -ano | findstr :5432  # Windows
lsof -i :5432  # Linux/Mac
```

---

### 2. Erreur d'authentification PostgreSQL

**Erreur** :
```
password authentication failed for user "postgres"
```

**Solution** :
```bash
# Vérifier les paramètres dans .env
echo "DB_PASSWORD=your_correct_password" > .env

# Réinitialiser le mot de passe PostgreSQL
psql -U postgres
ALTER USER postgres WITH PASSWORD 'new_password';
```

---

### 3. Base de données n'existe pas

**Erreur** :
```
FATAL: database "velo_platform" does not exist
```

**Solution** :
```bash
# Windows
.\init-db.ps1

# Linux/Mac
bash init-db.sh

# Ou manuellement
createdb -U postgres velo_platform
psql -U postgres -d velo_platform -f sql/init.sql
```

---

### 4. Erreur de dépendances npm manquantes

**Erreur** :
```
Cannot find module 'express'
```

**Solution** :
```bash
npm install
npm list  # Vérifier les versions
```

---

### 5. Port 5000 déjà utilisé

**Erreur** :
```
Error: listen EADDRINUSE :::5000
```

**Solution** :
```bash
# Windows - Tuer le processus sur le port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Ou utiliser un autre port
echo "PORT=5001" >> .env
npm run dev
```

---

### 6. Erreur JWT invalide

**Erreur** :
```
Invalid or expired token
```

**Causes** :
- Token expiré (après 7 jours)
- JWT_SECRET changé depuis la génération du token
- Token mal formaté dans le header

**Solution** :
```bash
# Récupérer un nouveau token
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"votre@email.com","password":"votre_motdepasse"}'

# Utiliser le format correct dans le header
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 7. Erreur CORS

**Erreur** :
```
Access to XMLHttpRequest from origin has been blocked by CORS policy
```

**Solution** :
```javascript
// Dans index.js, les CORS sont déjà configurés
app.use(cors());

// En production, restreindre les origines
app.use(cors({
  origin: 'https://example.com',
  credentials: true
}));
```

---

### 8. Problème de géolocalisation

**Problème** : Aucun réparateur trouvé

**Causes possibles** :
- Réparateur n'a pas de localisation
- Réparateur est marqué comme non disponible (`is_available = false`)
- Rayon de recherche trop petit
- Coordonnées GPS incorrectes

**Solutions** :
```bash
# Mettre à jour la localisation
curl -X POST http://localhost:5000/api/locations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 48.8566,
    "longitude": 2.3522,
    "address": "Paris, France"
  }'

# Vérifier disponibilité
psql -U postgres -d velo_platform
SELECT * FROM repairer_profiles WHERE is_available = true;

# Activer la disponibilité
curl -X PATCH http://localhost:5000/api/repairers/availability \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_available": true}'
```

---

### 9. Erreur de validation des données

**Erreur** :
```
email and password are required
```

**Solution** :
- Vérifier que tous les champs obligatoires sont envoyés
- Vérifier le type des données (string, number, etc.)
- Consulter la documentation API

```bash
# Exemple correct
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Jean Dupont",
    "role": "client"
  }'
```

---

### 10. Erreur de schéma de base de données

**Erreur** :
```
relation "users" does not exist
```

**Cause** : Les tables n'ont pas été créées

**Solution** :
```bash
# Réinitialiser la BD
dropdb -U postgres velo_platform
createdb -U postgres velo_platform
psql -U postgres -d velo_platform -f sql/init.sql
```

---

## 📊 Vérifier l'état du système

### Vérifier que le serveur tourne

```bash
# Windows
curl http://localhost:5000/health

# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/health"
```

### Vérifier la connexion PostgreSQL

```bash
# Depuis le terminal
psql -U postgres -d velo_platform -c "SELECT COUNT(*) FROM users;"

# Avec Docker
docker exec -it velo_platform_db psql -U postgres -d velo_platform -c "SELECT COUNT(*) FROM users;"
```

### Vérifier les logs

```bash
# Voir les logs du serveur (en développement)
npm run dev
# Les logs s'affichent dans le terminal

# En production, utiliser pm2
pm2 logs velo-platform
```

---

## 🐛 Debug avancé

### Activer les logs détaillés

```javascript
// Dans index.js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

### Inspecter les variables d'environnement

```bash
# PowerShell
Get-Content .env | ForEach-Object { Write-Host $_ }

# Bash
cat .env
```

### Tester une requête avec détails

```bash
# Avec curl et verbose
curl -v -X GET http://localhost:5000/health

# PowerShell avec verbose
$VerbosePreference = "Continue"
Invoke-WebRequest -Uri "http://localhost:5000/health"
```

---

## 📞 Besoin d'aide ?

1. Vérifier la documentation : `API_DOCUMENTATION.md`
2. Consulter les logs du serveur
3. Vérifier la connexion PostgreSQL
4. Valider les paramètres `.env`
5. Réinitialiser la BD si nécessaire

---

**Dernière mise à jour** : 2025-11-15
