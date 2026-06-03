#!/bin/bash
# ============================================================
#  Fuel Manager OCP — Script d'installation automatique
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "  ⛽  Fuel Manager OCP — Installation"
echo "======================================${NC}"

# 1. Vérification des prérequis
echo -e "\n${BLUE}[1/5] Vérification des prérequis...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trouvé. Installer Node.js 18+ depuis https://nodejs.org${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ requis (version actuelle: $(node -v))${NC}"
    exit 1
fi
echo -e "  ✅ Node.js $(node -v)"

if ! command -v psql &> /dev/null && ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}  ⚠️  PostgreSQL ou Docker requis pour la base de données${NC}"
fi

# 2. Configuration backend
echo -e "\n${BLUE}[2/5] Installation backend...${NC}"
cd backend
npm install --silent
echo -e "  ✅ Dépendances installées"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "  ${YELLOW}⚠️  Fichier .env créé depuis .env.example"
    echo -e "     → Editez backend/.env avec vos paramètres PostgreSQL${NC}"
fi

# 3. Configuration frontend
echo -e "\n${BLUE}[3/5] Installation frontend...${NC}"
cd ../frontend
npm install --silent
echo -e "  ✅ Dépendances installées"

if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo -e "  ✅ Fichier .env.local créé"
fi

# 4. Base de données (si PostgreSQL accessible)
echo -e "\n${BLUE}[4/5] Base de données...${NC}"
cd ../backend
if npx prisma db push --skip-generate 2>/dev/null; then
    echo -e "  ✅ Schéma appliqué"
    if npx ts-node prisma/seed.ts 2>/dev/null; then
        echo -e "  ✅ Données de démonstration insérées"
    else
        echo -e "  ${YELLOW}⚠️  Seed échoué (données démo non insérées)${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  Base de données non accessible"
    echo -e "     → Configurez DATABASE_URL dans backend/.env puis relancez :${NC}"
    echo -e "     cd backend && npx prisma migrate dev && npx prisma db seed"
fi

# 5. Instructions de démarrage
echo -e "\n${GREEN}[5/5] Installation terminée ! 🎉${NC}"
echo ""
echo -e "${BLUE}Pour démarrer l'application :${NC}"
echo ""
echo "  # Terminal 1 — Backend"
echo "  cd backend && npm run dev"
echo ""
echo "  # Terminal 2 — Frontend"
echo "  cd frontend && npm run dev"
echo ""
echo -e "${BLUE}Accès :${NC}"
echo "  🌐 Frontend : http://localhost:3000"
echo "  🔌 API      : http://localhost:3001/api"
echo "  🗄️  Prisma   : cd backend && npx prisma studio"
echo ""
echo -e "${BLUE}Comptes de démo :${NC}"
echo "  admin@ocp.ma      / Admin@2024      (Administrateur)"
echo "  manager@ocp.ma    / Manager@2024    (Manager)"
echo "  operateur@ocp.ma  / Operateur@2024  (Opérateur)"
echo ""
