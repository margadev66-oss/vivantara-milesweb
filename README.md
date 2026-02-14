# Vivartana (Express.js)

This folder contains an Express.js rebuild of the Vivartana platform for MilesWeb Node.js hosting.

## Requirements

- Node.js 18+ (Node.js 20 recommended)
- A MySQL database (Updated from PostgreSQL)
- `DATABASE_URL` environment variable (Prisma)

## Environment Variables

- `DATABASE_URL`: `mysql://USER:PASSWORD@127.0.0.1:3306/DBNAME`
- `SESSION_SECRET`: Used to sign the admin session cookie.
- `PORT`: default `3000`
- `HOST`: default `0.0.0.0`

## MilesWeb Deployment

1. **MySQL Setup**: Create a database and user in cPanel.
2. **Environment**: Set `DATABASE_URL` in cPanel Node.js app using `127.0.0.1` as the host.
3. **Build**: Run `npm run build:milesweb`.
4. **Restart**: Restart the app in cPanel.

## UI Changes
- The mobile menu now uses a standard hamburger icon (three horizontal lines) for better visibility.

## Admin Login
- URL: `/auth/signin`
