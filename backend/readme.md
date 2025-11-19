# 🚲 Vélo Platform — Backend API

Backend Express.js pour une plateforme de mise en relation entre réparateurs de vélos et clients. Authentification sécurisée, gestion des demandes, messagerie et géolocalisation.

---

## 📦 Technologies

- Node.js + Express
- PostgreSQL
- JWT + bcrypt
- dotenv
- PowerShell (scripts d’automatisation)

---

## 📁 Structure

backend/ ├── controllers/ ├── routes/ ├── models/ ├── middleware/ ├── db/ ├── .env ├── index.js



---

## 🔐 Authentification

| Endpoint         | Méthode | Description                     |
|------------------|--------|----------------------------------|
| `/auth/register` | POST   | Crée un nouvel utilisateur       |
| `/auth/login`    | POST   | Renvoie un token JWT             |

---

## 🔧 Réparations

| Endpoint     | Méthode | Auth | Description                          |
|--------------|--------|------|--------------------------------------|
| `/repairs`   | POST   | ✅   | Crée une demande de réparation       |
| `/repairs`   | GET    | ✅   | Liste les demandes de l’utilisateur  |

---

## 💬 Messages

| Endpoint           | Méthode | Auth | Description                          |
|--------------------|--------|------|--------------------------------------|
| `/messages`        | POST   | ✅   | Envoie un message                    |
| `/messages/:userId`| GET    | ✅   | Récupère la conversation avec userId |

---

## 📍 Localisation

| Endpoint       | Méthode | Auth | Description                          |
|----------------|--------|------|--------------------------------------|
| `/locations`   | POST   | ✅   | Met à jour la position de l’utilisateur |
| `/locations`   | GET    | ✅   | Récupère la position de l’utilisateur |

---

## ⚙️ Installation

```bash
npm install

Créer un fichier .env 
DB_PASSWORD=mot_de_passe_postgres
JWT_SECRET=une_clé_secrète_sûre
PORT=5000



## API_DOC - start/stop

Expected exports from src/index.js:
- **start(port:number)** -> Promise<Server> (resolves when server is listening)
- **stop()** -> Promise<void>
- **app** optional export for route introspection


## API_DOC - endpoints minimal

GET  /health -> { ok: true }  
GET  /api/users -> { ok: true, users: [ { id, username, email } ] }  
GET  /api/bookings -> { ok: true, bookings: [ ... ] }  
POST /api/bookings -> { name,email,bike,slotId } -> 201 { ok:true, booking:{ id,... } }
