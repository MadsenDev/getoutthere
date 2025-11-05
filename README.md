# Get Out There - Social Comfort Challenge App

> A calm, introvert-friendly app that helps people build social confidence through tiny daily challenges, private reflection, and a gentle progress loop.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- MySQL 8.0+

### Setup

1. **Install dependencies**

   ```bash
   pnpm install:all
   # Or manually:
   cd server && pnpm install
   cd ../web && pnpm install
   ```

2. **Configure environment**

   Create `server/.env` from `server/.env.example`:

   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Initialize database**

   ```bash
   pnpm db:sync
   pnpm db:seed
   ```

4. **Start development servers**

   ```bash
   # Terminal 1: Backend API
   pnpm dev:api

   # Terminal 2: Frontend
   pnpm dev:web
   ```

5. **Open the app**

   - Frontend: http://localhost:5173
   - API: http://localhost:3001

## 📚 Documentation

Full documentation is available in the `/docs` folder:

- `1 - README.md` - Project overview
- `2 - ARCHITECTURE.md` - System architecture
- `3 - DB_SCHEMA.md` - Database schema
- `4 - API.md` - API reference
- `5 - REALTIME.md` - Socket.IO setup
- `6 - SECURITY.md` - Security guidelines
- `7 - FRONTEND_GUIDE.md` - Frontend structure
- `8 - CHALLENGES_CATALOG.md` - Challenge catalog
- `9 - DEPLOYMENT.md` - Deployment guide
- `10 - ROADMAP.md` - Development roadmap

## 🧩 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Express + Node.js + TypeScript
- **Database**: MySQL + Sequelize ORM
- **Realtime**: Socket.IO
- **Task Scheduling**: node-cron

## 📝 License

ISC

