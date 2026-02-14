# Vivartana (Express.js)

This folder contains an Express.js rebuild of the Vivartana platform for MilesWeb Node.js hosting.

## Requirements

- Node.js 18+ (Node.js 20 recommended)
- A PostgreSQL database
- `DATABASE_URL` environment variable (Prisma)

## Environment Variables

- `DATABASE_URL` (required)
- `SESSION_SECRET` (required in production): used to sign the admin session cookie.
  - Fallbacks supported: `NEXTAUTH_SECRET` or `AUTH_SECRET`
- `PORT` (optional): default `3000`
- `HOST` (optional): default `0.0.0.0`

See `.env.example`.

## Install / Build / Run

```bash
cd milesweb-express
npm install
npm run build
npm start
```

## MilesWeb Panel Commands

- Build command: `npm run build:milesweb`
- Start command: `npm start`
- Startup file (if MilesWeb asks): `server.js`

## Admin Login

- URL: `/auth/signin`

Admin users are stored in the `User` table. Passwords are expected to be bcrypt hashes (same as the Next.js version).

## Database Migrations

```bash
cd milesweb-express
npm run prisma:migrate:deploy
```

## Seed (Optional)

```bash
cd milesweb-express
npm run prisma:seed
```

## Notes About Assets

Static assets (images, logo) are served from `milesweb-express/public/assests`.
