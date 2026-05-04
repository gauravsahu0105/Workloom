# Workloom

A collaborative team task management platform where admins create projects, manage members, assign prioritized tasks, and track delivery progress through status and overdue analytics, while members focus on and update only their assigned work.

## Features

- Signup/Login authentication
- Project and team management
- Task assignment, status tracking, and priority (LOW, MEDIUM, HIGH)
- Dashboard metrics (total, in-progress, completed, overdue)
- Tasks-per-user analytics

## Tech Stack

- Next.js 14 (App Router)
- Prisma ORM
- PostgreSQL (production) / SQLite (local fallback)
- JWT auth (HTTP-only cookie)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Push Prisma schema:

```bash
npx prisma db push
```

4. Start app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then go to `/dashboard`.

## Role-Based Access

- `ADMIN`: create projects, add/remove members, assign tasks, and manage task details.
- `MEMBER`: view and update only assigned tasks.

## Railway Deployment

1. Create a Railway project and connect this repo.
2. Add a PostgreSQL service in the Railway.
3. Set app service variables:
   - `DATABASE_URL` (reference to Postgres `DATABASE_URL`)
   - `JWT_SECRET` (secure random value)
4. Ensure `prisma/schema.prisma` datasource provider is `postgresql`.
5. Set build/start commands:

```bash
# Build command
npm install && npx prisma db push && npm run build

# Start command
npm run start -- -p $PORT
```
