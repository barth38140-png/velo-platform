# README - Scripts de développement Velo Platform
# Gestion automatisée du backend et frontend

## 🚀 Démarrage rapide

### Lancer tout (Backend + Frontend)
```powershell
cd C:\Users\BarthPC\velo-platform
.\start-dev.ps1
```

### Lancer seulement le backend
```powershell
.\start-dev.ps1 -Backend
```

### Lancer seulement le frontend
```powershell
.\start-dev.ps1 -Frontend
```

## 🛑 Arrêter les serveurs

### Arrêter via le script
```powershell
.\stop-dev.ps1
```

### Arrêter manuellement
- Fermer les fenêtres PowerShell des serveurs
- Ou appuyer sur `Ctrl+C` dans chaque fenêtre

## 📡 URLs d'accès

Une fois les serveurs lancés :

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📋 Logs en temps réel

Les logs de chaque serveur s'affichent dans des fenêtres PowerShell séparées :

- **Backend logs** (Pino): horodatage, requêtes HTTP, erreurs DB
- **Frontend logs** (Vite): hot reload, webpack notices, erreurs React
- **Erreurs**: visibles immédiatement en rouge

## ⚙️ Configuration

### Variables d'environnement
Voir les fichiers `.env` :
- `backend/.env`
- `frontend/.env` (optionnel, généralement vide)

### Ports
- Backend: `5000` (configurable via `PORT` en `.env`)
- Frontend: `5173` (configurable via Vite en `vite.config.js`)
- PostgreSQL: `5432` (si Docker Compose utilisé)

## 🔧 Dépannage

### Erreur: "PowerShell script execution disabled"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port déjà en utilisation
Trouver le processus sur le port (exemple port 5000):
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### npm: command not found
Vérifier que Node.js et npm sont installés:
```powershell
node --version
npm --version
```

## 📚 Alternatives

### Option Docker Compose
```powershell
docker-compose up
```
Lance backend + frontend + PostgreSQL dans des conteneurs.

### Option deux terminaux manuels
```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

## 💡 Astuces

- **Rechargement à chaud (HMR)**: Modifiez les fichiers, les changements se reflètent immédiatement
- **Arrêt propre**: Les scripts ferment les serveurs sans forcer si possible
- **Logs colorés**: Les outputs Pino et Vite sont auto-formatés avec couleurs
