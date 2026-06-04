# Lead Management CRM

A full-stack Lead Management CRM for a small business. The app supports lead CRUD, search, status filtering, pagination, and live dashboard statistics without authentication.

## Tech Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Prisma ORM
- Database: PostgreSQL
- Deployment targets: Vercel frontend, Render backend, Neon PostgreSQL database

## Features

- Create, view, edit, and delete leads
- Search leads by name, email, or company
- Filter leads by status
- Change lead status across `NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, and `LOST`
- Statistics cards for total leads and each status
- Paginated lead table with Previous and Next controls
- Loading, empty, success, and error states
- Responsive dashboard layout for desktop, tablet, and mobile

## API Endpoints

Base URL locally: `http://localhost:4000`

- `GET /health`
- `POST /api/leads`
- `GET /api/leads?page=1&limit=10&search=value&status=NEW`
- `GET /api/leads/stats`
- `PUT /api/leads/:id`
- `DELETE /api/leads/:id`

## Environment Variables

Backend `be/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
PORT=4000
```

Frontend `fe/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## Database Setup

1. Create a PostgreSQL database, for example on Neon.
2. Add the connection string to `be/.env`.
3. Install backend dependencies and run the Prisma migration:

```bash
cd be
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
```

For local migration development, use:

```bash
pnpm prisma migrate dev
```

## Backend Setup

```bash
cd be
pnpm install
pnpm run dev
```

The backend runs on `http://localhost:4000` by default.

## Frontend Setup

```bash
cd fe
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Run Locally

1. Start PostgreSQL or use a Neon database URL.
2. Start the backend from `be`.
3. Start the frontend from `fe`.
4. Open `http://localhost:3000`.

## Deployment Links

- Frontend: add your Vercel URL here
- Backend: add your Render URL here
- Database: add your Neon project details here

## Screenshots

Add dashboard screenshots after deployment or local testing.
