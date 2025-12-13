# Whispr

A platform for course and professor reviews with institutional authentication.

## Overview

Whispr is a comprehensive review platform that allows users to review and rate courses and professors. It features institutional email verification, ensuring that reviews come from actual students. The platform includes social features such as following other users, upvoting/downvoting reviews, and replying to reviews.

## Tech Stack

- **Frontend + API**: Next.js 15 with TypeScript and API Routes
- **Database**: PostgreSQL on Supabase
- **ORM**: Prisma
- **Authentication**: JWT cookies
- **Deployment**: Vercel

## Project Structure

```
whispr/
├── frontend/              # Next.js application (frontend + API)
│   ├── prisma/            # Prisma schema
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   │   ├── api/       # API Routes (backend)
│   │   │   └── ...        # Frontend pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities (auth, db, etc.)
│   │   └── types/         # TypeScript types
│   ├── .env.local         # Environment variables (not committed)
│   └── .env.example       # Environment template
├── init-scripts/          # Database population scripts
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (for database)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/OSDG-IIITH/whispr.git
cd whispr
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Push schema to database (first time only):
```bash
npx dotenv -e .env.local -- npx prisma db push
```

6. Start the development server:
```bash
npm run dev
```

7. Access the application at http://localhost:3000

### Populating the Database

Run the init scripts to populate courses and professors:

```bash
npx dotenv -e .env.local -- npx prisma db execute --file ../init-scripts/02-populate-monsoon-2024-courses.sql
npx dotenv -e .env.local -- npx prisma db execute --file ../init-scripts/03-populate-spring-2025-courses.sql
```

## Environment Variables

```env
# Supabase Database
DATABASE_URL="postgresql://..."   # Pooler connection (port 6543)
DIRECT_URL="postgresql://..."     # Direct connection (port 5432)

# JWT Authentication
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="86400"

# Verification
ALLOWED_EMAIL_DOMAINS="students.iiit.ac.in,research.iiit.ac.in,iiit.ac.in"
```

## Features

- ✅ User registration and authentication
- ✅ Course and professor listings
- ✅ Review creation with ratings
- ✅ Upvote/downvote system
- ✅ Reply to reviews
- ✅ User following
- ✅ Notifications
- ✅ Search functionality
- ✅ Admin panel (ban/unban, reports)
- ✅ Leaderboard

## Deployment

Deploy to Vercel:

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`

## License

MIT License - see [LICENSE](LICENSE) for details.