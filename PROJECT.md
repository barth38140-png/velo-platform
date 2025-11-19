# Velo Platform - Full Stack Bike Repair Marketplace

A complete web application connecting bike owners with local repair technicians using geolocation, real-time messaging, and repair request management.

## Project Structure

```
velo-platform/
├── backend/                    # Express.js API server
│   ├── config/                # Configuration (database)
│   ├── controllers/           # Business logic
│   ├── models/                # Database queries
│   ├── routes/                # API endpoints
│   ├── middlewares/           # Auth & validation
│   ├── sql/                   # Database schema
│   ├── package.json
│   └── index.js              # Main server entry
├── frontend/                   # React + Vite MVP
│   ├── src/
│   │   ├── pages/            # Auth, Dashboard
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API calls
│   │   ├── context/          # React context (Auth)
│   │   ├── styles/           # CSS styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── docker-compose.yml         # PostgreSQL + pgAdmin setup
```

## Backend Features

### Authentication
- User registration with email validation
- JWT-based login
- Password hashing with bcryptjs
- Protected endpoints with middleware

### Core Features
- **Repair Requests**: Clients create repair requests with location and bike details
- **Geolocation**: Find nearby repairers using Haversine distance formula
- **Repairer Profiles**: Repairers set skills, bio, service radius, and availability
- **Messaging**: Real-time chat between clients and repairers
- **Repair Offers**: Repairers submit price/duration proposals for requests
- **Socket.io**: Real-time message push notifications
- **Input Validation**: express-validator on all critical endpoints

### API Endpoints

#### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get current user profile

#### Repairs
- `POST /api/repairs` - Create repair request
- `GET /api/repairs` - Get user's repairs
- `GET /api/repairs/pending-requests` - Get pending repairs (repairers)
- `GET /api/repairs/detail/:id` - Get repair details
- `PATCH /api/repairs/:id/status` - Update repair status

#### Repairer Profiles
- `POST /api/repairers/profile` - Create repairer profile
- `GET /api/repairers/:id` - Get repairer profile
- `GET /api/repairers/all` - List all repairers

#### Locations
- `POST /api/locations` - Update location
- `GET /api/locations/:userId` - Get user location
- `GET /api/locations/nearby-repairers` - Find nearby repairers

#### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get user's conversations
- `GET /api/messages/:userId` - Get messages with user

#### Repair Offers
- `POST /api/repair-offers` - Submit repair offer
- `GET /api/repair-offers/my-offers` - Get repairer's offers
- `GET /api/repair-offers/:repairId/offers` - Get offers for repair
- `PATCH /api/repair-offers/:id/status` - Accept/reject offer

## Frontend Features

### Pages
- **Login**: Email/password authentication
- **Register**: User registration with role selection (client/repairer)
- **Dashboard**: Main app with repair management, profile, and navigation

### Services
- **API Service**: Axios wrapper with JWT token injection
- **Auth Context**: User state management
- **Protected Routes**: Route guard for authenticated users

## Setup Instructions

### Backend Setup

1. **Install PostgreSQL** (if not already installed)
   - Download from https://www.postgresql.org/download/

2. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

3. **Initialize database**
   ```bash
   # PowerShell (Windows)
   .\init-db-safe2.ps1
   # Or Bash (Linux/Mac)
   chmod +x init-db.sh
   ./init-db.sh
   ```

4. **Install dependencies and start server**
   ```bash
   npm install
   npm run dev
   ```

Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit if needed (defaults work for local dev)
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:3000`

## Testing

### Run API Tests (Backend)
```bash
cd backend
# Start server in one terminal
npm run dev

# In another terminal, run tests
powershell -ExecutionPolicy Bypass -File test-api-safe.ps1
```

### Manual Testing
1. Open http://localhost:3000
2. Register as client or repairer
3. Complete profile setup
4. Create repair request (client) or view pending repairs (repairer)
5. Send/receive messages
6. Accept/reject repair offers

## Database Schema

### Main Tables
- **users**: Account info, auth
- **repairer_profiles**: Skills, rating, availability
- **repair_requests**: Request details, status, location
- **repair_offers**: Repairer proposals with pricing
- **messages**: Chat messages with read status
- **locations**: Real-time location tracking

## Technologies

### Backend
- Node.js + Express
- PostgreSQL
- JWT (jsonwebtoken)
- Bcryptjs
- Socket.io
- express-validator

### Frontend
- React 19
- React Router DOM
- Vite
- Axios
- Socket.io Client
- CSS3

## Next Steps

- [ ] Add map integration (Leaflet/Mapbox)
- [ ] Implement payment processing
- [ ] Add review/rating system
- [ ] Push notifications (FCM/APNs)
- [ ] Mobile app (React Native)
- [ ] Advanced search filters
- [ ] Image upload for repairs
- [ ] Automated status transitions
- [ ] Email notifications

## License

ISC
