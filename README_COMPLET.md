# Velo Platform - Full Stack Bike Repair Marketplace

A complete web application connecting bike owners with repair professionals. Built with Node.js/Express backend, React/Vite frontend, PostgreSQL database, and Socket.io for real-time messaging.

## Project Status: MVP Complete ✓

### Features Implemented

#### Backend (Node.js + Express)
- ✅ User authentication (register/login) with JWT and bcrypt
- ✅ Repair request management (CRUD)
- ✅ Repairer profile management
- ✅ Repair offer system (repairers propose prices)
- ✅ Real-time messaging with Socket.io
- ✅ Location tracking (GPS with Haversine distance calculation)
- ✅ Nearby repairer search
- ✅ Input validation (express-validator)
- ✅ Protected routes with JWT middleware
- ✅ PostgreSQL database with 8 tables

#### Frontend (React + Vite)
- ✅ Authentication pages (Login/Register)
- ✅ Dashboard with tabs (My Repairs, Create Repair, Profile)
- ✅ Context-based state management (Auth)
- ✅ API client service with axios
- ✅ Protected routes
- ✅ Responsive UI with modern CSS
- ✅ Socket.io client setup

## Project Structure

```
velo-platform/
├── backend/
│   ├── config/
│   │   └── db.js                 # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── userController.js     # Auth endpoints
│   │   ├── repairController.js   # Repair CRUD
│   │   ├── locationController.js # GPS & nearby search
│   │   ├── messageController.js  # Messaging
│   │   ├── repairerProfileController.js
│   │   └── repairOfferController.js
│   ├── models/
│   │   ├── repairModel.js        # Repair DB queries
│   │   ├── locationModel.js      # Location queries
│   │   ├── messageModel.js       # Message queries
│   │   └── repairOfferModel.js   # Repair offer queries
│   ├── middlewares/
│   │   ├── auth.js               # JWT authentication
│   │   └── validators.js         # Input validation
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── repairRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── repairerRoutes.js
│   │   └── repairOfferRoutes.js
│   ├── sql/
│   │   └── init.sql              # Database schema
│   ├── index.js                  # Main server entry
│   ├── package.json
│   └── .env                      # Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js            # Axios API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── styles/
│   │   │   ├── Auth.css
│   │   │   └── Dashboard.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- psql CLI tool

### Backend Setup

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

3. **Initialize database**
```bash
# Windows
.\init-db-safe2.ps1

# Linux/Mac
./init-db.sh
```

4. **Start development server**
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment (optional)**
```bash
cp .env.example .env
# Edit if your backend is not on localhost:5000
```

3. **Start development server**
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get current user profile (protected)

### Repair Requests
- `POST /api/repairs` - Create repair request (protected)
- `GET /api/repairs` - Get user's repairs (protected)
- `GET /api/repairs/pending-requests` - Get pending repairs (protected)
- `GET /api/repairs/detail/:id` - Get repair details (protected)
- `PATCH /api/repairs/:id/status` - Update repair status (protected)

### Repairer Profiles
- `POST /api/repairers/profile` - Create repairer profile (protected)
- `GET /api/repairers/:id` - Get repairer profile
- `GET /api/repairers/all` - Get all repairers

### Repair Offers
- `POST /api/repair-offers` - Submit price offer (protected)
- `GET /api/repair-offers/my-offers` - Get user's offers (protected)
- `GET /api/repair-offers/:repairId/offers` - Get offers for repair
- `PATCH /api/repair-offers/:offerId/status` - Accept/reject offer (protected)

### Messaging
- `POST /api/messages` - Send message (protected)
- `GET /api/messages/conversations` - Get user's conversations (protected)
- `GET /api/messages/:userId` - Get conversation with user (protected)

### Location
- `POST /api/locations` - Update user location (protected)
- `GET /api/locations/:userId` - Get user location (protected)
- `GET /api/locations/nearby-repairers?latitude=X&longitude=Y&radius_km=Z` - Find nearby repairers

## Database Schema

### Tables
1. **users** - User accounts with roles (client/repairer)
2. **repairer_profiles** - Extended repairer information
3. **repair_requests** - Repair job requests from clients
4. **repair_offers** - Price offers from repairers
5. **messages** - Direct messaging between users
6. **locations** - GPS locations for users and repairs

## Testing the API

Use the included PowerShell test script:
```bash
# In backend directory
.\test-api-safe.ps1
```

This runs 15 test scenarios covering:
- User registration/login
- Repair request creation
- Location updates
- Repair offer submission
- Messaging
- Repairer profile creation

## Environment Variables

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=velo_platform
JWT_SECRET=your_secret_key
SALT_ROUNDS=10
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Key Technologies

- **Backend**: Node.js, Express, PostgreSQL, JWT, bcryptjs
- **Frontend**: React 19, Vite, React Router, Axios, Socket.io-client
- **Real-time**: Socket.io for live messaging
- **Database**: PostgreSQL with parameterized queries
- **Security**: JWT authentication, bcrypt password hashing, input validation
- **Geo**: Haversine formula for distance calculations

## Development Workflow

1. Backend server: `npm run dev` (with nodemon)
2. Frontend dev: `npm run dev` (with Vite HMR)
3. Make changes - both update automatically
4. Test API with PowerShell scripts or browser/Postman

## Next Steps / Future Features

- [ ] Payment integration (for repair pricing)
- [ ] Rating/review system
- [ ] Email notifications
- [ ] Image upload (repair photos)
- [ ] Advanced search filters
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Invoice generation
- [ ] Admin dashboard
- [ ] Stripe/PayPal integration

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify .env credentials
- Run `.\init-db-safe2.ps1` to initialize database

### Frontend can't reach API
- Ensure backend is running on port 5000
- Check VITE_API_URL in .env
- Browser console should show network requests

### Database connection errors
- Verify PostgreSQL is installed and running
- Check psql command is in PATH
- Confirm database name and credentials in .env

## License

MIT

## Author

Built as a prototype for a bike repair marketplace platform.
