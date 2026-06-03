# ⛽ Fuel Manager OCP — Gestion de Consommation de Fuel

Application web complète de gestion de consommation de fuel pour engins industriels, inspirée de l'identité visuelle OCP.

---

## 🧱 Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Styles | Tailwind CSS + Radix UI |
| Charts | Recharts |
| State | Zustand |
| Backend | Node.js + Express.js + TypeScript |
| Base de données | PostgreSQL + Prisma ORM |
| Excel | SheetJS (xlsx) |
| Auth | JWT + bcryptjs |
| Upload | Multer |

---

## 🚀 Démarrage rapide

### Option 1 — Docker (recommandé)

```bash
# Cloner le projet
git clone <url>
cd fuel-manager

# Démarrer tous les services
docker-compose up -d

# Seeder la base (première fois)
docker exec fuel-backend npm run prisma:seed
```

Accéder à : http://localhost:3000

---

### Option 2 — Manuel

#### Prérequis
- Node.js 18+
- PostgreSQL 14+

#### Backend

```bash
cd backend
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# Initialiser la base de données
npx prisma migrate dev --name init
npx prisma db seed

# Démarrer en développement
npm run dev
```

#### Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local
# Éditer si besoin (par défaut http://localhost:3001)

npm run dev
```

---

## 🔐 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@ocp.ma | Admin@2024 |
| Manager | manager@ocp.ma | Manager@2024 |
| Opérateur | operateur@ocp.ma | Operateur@2024 |

---

## 📁 Structure du projet

```
fuel-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma de base de données
│   │   └── seed.ts             # Données de démonstration
│   ├── src/
│   │   ├── controllers/        # Logique métier
│   │   ├── middleware/         # Auth, erreurs
│   │   ├── routes/             # Définition des routes API
│   │   ├── services/           # Services (Excel, etc.)
│   │   ├── utils/              # Logger
│   │   └── index.ts            # Point d'entrée
│   ├── uploads/                # Fichiers uploadés (auto-créé)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/login/     # Page connexion
│   │   │   └── (app)/          # Pages protégées
│   │   │       ├── dashboard/  # Tableau de bord
│   │   │       ├── engins/     # Gestion engins
│   │   │       ├── consommations/ # Historique
│   │   │       ├── imports/    # Import Excel
│   │   │       ├── rapports/   # Rapports avancés
│   │   │       └── utilisateurs/ # Gestion utilisateurs
│   │   ├── components/
│   │   │   └── layout/         # Sidebar, Header
│   │   ├── lib/
│   │   │   ├── api.ts          # Client API REST
│   │   │   └── utils.ts        # Utilitaires
│   │   └── store/
│   │       └── auth.store.ts   # Store Zustand
│   └── package.json
│
└── docker-compose.yml
```

---

## 📊 API Endpoints

### Auth
```
POST   /api/auth/login
GET    /api/auth/profile
PUT    /api/auth/change-password
POST   /api/auth/register        (ADMIN)
```

### Engins
```
GET    /api/engins
POST   /api/engins
GET    /api/engins/:id
PUT    /api/engins/:id
DELETE /api/engins/:id
GET    /api/engins/:id/stats
```

### Consommations
```
GET    /api/consommations
POST   /api/consommations
GET    /api/consommations/:id
PUT    /api/consommations/:id
DELETE /api/consommations/:id
```

### Imports Excel
```
POST   /api/imports/upload       (multipart/form-data)
GET    /api/imports
DELETE /api/imports/:id
```

### Dashboard
```
GET    /api/dashboard/stats?periode=30
GET    /api/dashboard/alerts
```

### Utilisateurs
```
GET    /api/utilisateurs         (ADMIN/MANAGER)
PUT    /api/utilisateurs/:id     (ADMIN)
DELETE /api/utilisateurs/:id     (ADMIN)
```

---

## 📥 Format fichier Excel

Le fichier Excel doit contenir une première feuille avec les colonnes suivantes (détection automatique par mots-clés) :

| Colonne | Mots-clés détectés |
|---------|-------------------|
| Engin | engin, machine, equipement |
| Compteur | compteur, index, km, heure |
| Gasoil | gasoil, carburant, fuel, litre, litres, consommation |
| Poste | poste, shift, vacation |
| Date | date |

### Logique de calcul

```
heuresMarche = compteurFin - compteurDebut (dernier compteur en BD)
consommationHeure = quantiteGasoil / heuresMarche
```

Les engins sont **créés automatiquement** s'ils n'existent pas.  
Les lignes avec quantité = 0 sont ignorées.  
**Un seul poste par jour est supporté** sans suppression.

---

## 🎨 Design

- **Couleur principale** : Vert émeraude `#00875A` (OCP)
- **Mode sombre** : Supporté nativement
- **Responsive** : Mobile, tablette, desktop

---

## 🔒 Rôles et permissions

| Action | OPERATEUR | MANAGER | ADMIN |
|--------|-----------|---------|-------|
| Voir dashboard | ✅ | ✅ | ✅ |
| Voir engins | ✅ | ✅ | ✅ |
| Créer/modifier engins | ❌ | ✅ | ✅ |
| Supprimer engins | ❌ | ❌ | ✅ |
| Voir consommations | ✅ | ✅ | ✅ |
| Créer consommations | ✅ | ✅ | ✅ |
| Importer Excel | ✅ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ✅ |

---

## 🐳 Variables d'environnement

### Backend (.env)
```env
DATABASE_URL="postgresql://fuel_user:fuel_pass@localhost:5432/fuel_db"
JWT_SECRET="votre-secret-jwt-tres-long-et-securise"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
