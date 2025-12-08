# Dealbox MVP

Local Restaurant Discount Platform built with Next.js 14 + Prisma + PostgreSQL.

## Overview

Dealbox is a 3-sided platform connecting customers, restaurant partners, and administrators. Customers can discover local restaurant deals and generate single-use coupons, restaurants can validate and redeem coupons, and admins can manage the platform.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Custom session-based authentication with HttpOnly cookies

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/naimprince010-ship-it/dealandme.git
cd dealandme
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database connection string:
```
DATABASE_URL="postgresql://dealbox:dealbox123@localhost:5432/dealbox"
```

4. Start PostgreSQL with Docker:
```bash
docker run --name dealbox-postgres -e POSTGRES_USER=dealbox -e POSTGRES_PASSWORD=dealbox123 -e POSTGRES_DB=dealbox -p 5432:5432 -d postgres:15
```

5. Run database migrations:
```bash
npx prisma db push
```

6. Seed the database:
```bash
npm run db:seed
```

7. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Test Credentials

| Role | Username/Phone | Password |
|------|----------------|----------|
| Customer | Any 10-digit phone | OTP: `123456` |
| Restaurant | `spicegarden` | `restaurant123` |
| Restaurant | `pizzaparadise` | `restaurant123` |
| Restaurant | `cafemocha` | `restaurant123` |
| Admin | `admin` | `admin123` |

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── admin/         # Admin pages
│   ├── restaurant/    # Restaurant partner pages
│   ├── login/         # Customer login
│   └── restaurants/   # Customer restaurant browsing
├── lib/
│   ├── auth.ts        # Auth utilities
│   └── prisma.ts      # Prisma client
└── middleware.ts      # Route protection
prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Seed script
```

## Database Schema

- **users** - Customers (identified by phone number)
- **restaurants** - Restaurant partners
- **offers** - One active offer per restaurant
- **coupons** - Single-use coupons with 3-hour expiry
- **admins** - Admin users
- **sessions** - Authentication sessions

## Development Workflow

- `main` - Stable production-ready code
- `dev` - Active development branch
- `feature/*` - Feature branches for milestones

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## License

MIT
