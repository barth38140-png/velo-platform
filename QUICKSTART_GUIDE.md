# Velo Platform - Quick Start Guide

## 🚀 Start Everything in 2 Minutes

### Prerequisites
- Node.js 18+
- PostgreSQL running
- PowerShell (Windows) or Bash (Linux/Mac)

### Option 1: Automated Setup (Windows)

```powershell
# Run from project root
.\QUICKSTART.ps1
```

### Option 2: Manual Setup

#### 1. Initialize Database
```bash
cd backend
.\init-db-safe2.ps1
```

#### 2. Start Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

#### 3. Start Frontend (new terminal)
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

#### 4. Open Browser
Navigate to `http://localhost:3000`

## 📝 First Test Run

### Create Test Accounts

**Client Account:**
- Email: `client@example.com`
- Password: `SecurePass123!`
- Name: `Jean Dupont`
- Role: Client

**Repairer Account:**
- Email: `repairer@example.com`
- Password: `SecurePass123!`
- Name: `Pierre Reparateur`
- Role: Repairer

### Test Workflow

1. **Register as Client** → Login → Dashboard
2. **Create a repair request** with location
3. **Open new browser/incognito** → Register as Repairer
4. **Repairer submits an offer** on the repair
5. **Client accepts the offer** → Repair assigned
6. **Both can message** through the platform

## 🧪 Test API with Script

```bash
cd backend
.\test-api-safe.ps1
```

This runs 15 automated tests covering all major features.

## 📚 API Documentation

See `backend/API_DOCUMENTATION.md` for full endpoint reference.

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL
psql -U postgres -c "SELECT 1"

# Reinitialize DB
cd backend
.\init-db-safe2.ps1
```

### Frontend connection errors
- Verify backend is running on port 5000
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)

### Port already in use
```powershell
# Find process on port 5000
netstat -ano | Select-String ":5000"

# Kill process (replace PID)
Stop-Process -Id <PID> -Force
```

## 📂 Key Files

- **Backend Entry**: `backend/index.js`
- **Frontend Entry**: `frontend/src/App.jsx`
- **Database Setup**: `backend/sql/init.sql`
- **API Config**: `backend/config/db.js`
- **Frontend API**: `frontend/src/services/api.js`

## ✅ What's Included

✓ Full auth system (JWT + bcrypt)
✓ Repair requests CRUD
✓ GPS location tracking
✓ Repairer search (by distance)
✓ Repair offers system
✓ Real-time messaging (Socket.io)
✓ Input validation
✓ Protected routes
✓ PostgreSQL database
✓ React dashboard

## 🔗 Links

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health
- API Test: Run `.\test-api-safe.ps1`

## 📖 More Info

- Full documentation: `README_COMPLET.md`
- Backend improvements: `backend/IMPROVEMENTS_SUMMARY.md`
- Checklist: `CHECKLIST.md`
- Executive summary: `EXECUTIVE_SUMMARY.md`

---

**Happy testing! 🚴** If issues arise, check the troubleshooting section or review error logs in the terminal.
