# Workloom
A collaborative team task management platform where admins create projects, manage members, assign prioritized tasks, and track delivery progress through real-time status and overdue analytics, while members focus on and update only their assigned work.
=======
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
=======
# TaskAssigner

Role-based project and task management app (Admin/Member) with:

- Signup/Login authentication
- Project + team management
- Task creation and status tracking
- Task assignment and priority (LOW, MEDIUM, HIGH)
- Dashboard metrics (total/in-progress/completed/overdue)
- Tasks per user analytics

## Tech Stack

- Next.js 14 (App Router)
- Prisma ORM
- SQLite (default local DB)
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

- `ADMIN`: create projects and add members to projects.
- `ADMIN`: remove members, assign tasks, and manage task details.
- `MEMBER`: view/update assigned tasks only.

## Railway Deployment

1. Create a Railway project and deploy this repo.
2. Set environment variables:
   - `JWT_SECRET` (required)
   - `DATABASE_URL` (Railway Postgres connection string or other SQL DB)
3. For Postgres, update `prisma/schema.prisma` datasource provider to `postgresql`.
4. Run migration command in Railway:

```bash
npx prisma db push
```

5. Set start command:


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
```bash
npm run start
```
