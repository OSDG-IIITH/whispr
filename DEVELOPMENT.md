# Development Guide

This guide is for contributors who want to set up and work on the Whispr codebase.

## Quick Start

```bash
# Clone
git clone https://github.com/OSDG-IIITH/whispr.git
cd whispr/app

# Install
npm install

# Setup
cp .env.example .env.local  # Edit with your Supabase credentials
npx prisma generate
npx dotenv -e .env.local -- npx prisma db push

# Run
npm run dev  # http://localhost:3000
```

## Project Architecture

```
app/src/
├── app/                    # Next.js App Router
│   ├── api/                # Backend API routes
│   │   ├── admin/          # Admin-only endpoints
│   │   ├── courses/        # Course CRUD
│   │   ├── professors/     # Professor CRUD
│   │   ├── reviews/        # Review CRUD + votes
│   │   ├── users/          # User profiles
│   │   └── ...
│   └── [pages]/            # Frontend pages
├── components/
│   ├── admin/              # Admin dashboard components
│   ├── common/             # Shared components (Loader, etc.)
│   ├── courses/            # Course-related UI
│   ├── dashboard/          # Feed, stats
│   ├── layout/             # Navbar, wrappers
│   ├── professors/         # Professor-related UI
│   ├── reviews/            # Review cards, forms
│   └── ui/                 # Generic UI (Modal, Pagination, Select, etc.)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
│   ├── api.ts              # Frontend API client
│   ├── admin-api.ts        # Admin API client
│   ├── auth.ts             # JWT authentication
│   ├── db.ts               # Prisma client
│   └── audit-logger.ts     # Admin action logging
├── providers/              # React context providers
└── types/                  # TypeScript types
```

## Key Technologies

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | JWT cookies |
| Styling | Tailwind CSS |
| Data Fetching | SWR |
| Animations | Framer Motion |

## Database

### Schema
Located in `prisma/schema.prisma`. Key models:
- `User`, `Course`, `Professor`, `Review`, `Reply`
- `Vote`, `Follow`, `Notification`, `Report`
- `CourseInstructor` (join table with semester/year)
- `AdminAuditLog` (admin action tracking)

### Migrations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database
npx dotenv -e .env.local -- npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio
```

## API Patterns

### Authentication
All protected routes use `getCurrentUser(request)` from `@/lib/auth`:
```typescript
const user = await getCurrentUser(request);
if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
}
```

### Admin Routes
Admin routes check `user.is_admin` and log actions:
```typescript
if (!user.is_admin) {
    return NextResponse.json({ detail: "Admin access required" }, { status: 403 });
}
await logAdminAction({ adminId: user.id, actionType: "CREATE", ... });
```

### Response Format
- Success: `{ data }` or `{ items, total }` for lists
- Error: `{ detail: "Error message" }`

## Frontend Patterns

### Data Fetching
Use SWR hooks from `@/hooks/useData.ts`:
```typescript
const { courses, total, isLoading } = useCourses({ search, limit: 20 });
```

### API Calls
Use clients from `@/lib/api.ts` and `@/lib/admin-api.ts`:
```typescript
import { reviewAPI } from "@/lib/api";
await reviewAPI.create({ course_id, content, rating });
```

### Components
- Use existing UI components from `@/components/ui/`
- Follow established styling patterns (cards, modals, etc.)
- Use `motion.div` for animations

## Common Tasks

### Adding a New API Route
1. Create file in `app/api/[route]/route.ts`
2. Export `GET`, `POST`, `PATCH`, `DELETE` as needed
3. Use `getCurrentUser` for auth
4. Add to API client in `lib/api.ts` or `lib/admin-api.ts`

### Adding a New Page
1. Create file in `app/[page]/page.tsx`
2. Use existing layout components
3. Create component in appropriate `components/` subfolder

### Adding a New Admin Page
1. Create `app/admin/[page]/page.tsx`
2. Use `AdminPageWrapper` component
3. Create management component in `components/admin/`
4. Add link to admin dashboard (`app/admin/page.tsx`)

## Testing

```bash
# Build (includes type checking and linting)
npm run build

# Lint
npm run lint
```

## Environment Variables

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."    # Pooler connection
DIRECT_URL="postgresql://..."      # Direct connection

# Auth
JWT_SECRET="your-secret"
JWT_EXPIRATION="86400"

# Verification
ALLOWED_EMAIL_DOMAINS="students.iiit.ac.in,research.iiit.ac.in,iiit.ac.in"
```

## Helpful Commands

```bash
# Dev server
npm run dev

# Production build
npm run build

# View database
npx prisma studio

# Generate Prisma client
npx prisma generate

# Push schema to DB
npx dotenv -e .env.local -- npx prisma db push
```

