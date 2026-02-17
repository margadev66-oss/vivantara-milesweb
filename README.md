# Vivartana (Express.js)

This folder contains an Express.js rebuild of the Vivartana platform for MilesWeb Node.js hosting.

## Requirements

- Node.js 18+ (Node.js 20 recommended)
- A MySQL database (Updated from PostgreSQL)
- `DATABASE_URL` environment variable (Prisma)

## Environment Variables

- `DATABASE_URL`: `mysql://USER:PASSWORD@localhost:3306/DBNAME` (for MilesWeb/cPanel)
- `SESSION_SECRET`: Used to sign the admin session cookie.
- `SESSION_COOKIE_SECURE` (optional): `true` or `false`. If omitted, secure mode is auto-detected per request.
- `TRUST_PROXY` (optional): proxy trust setting for Express (default `1`).
- `SITE_URL` (recommended): Base URL used for absolute URLs in `sitemap.xml` and `robots.txt` (e.g. `https://vivartana.com`)
- `PORT`: default `3000`
- `HOST`: default `0.0.0.0`

## Email Configuration (SMTP)

To receive contact form submissions via email, set the following environment variables in cPanel:

- `SMTP_HOST`: Your SMTP server (e.g., mail.vivantara.com)
- `SMTP_PORT`: Usually 587 or 465
- `SMTP_SECURE`: `true` if port is 465, otherwise `false`
- `SMTP_USER`: Your email address
- `SMTP_PASS`: Your email password
- `CONTACT_EMAIL_TO`: The address that should receive the enquiries

## MilesWeb Deployment

1. **MySQL Setup**: Create a database and user in cPanel.
2. **Environment**:
   - Set `DATABASE_URL` in cPanel Node.js app to:
     - `mysql://cohdttpf_aumlaan:YOUR_DB_PASSWORD@localhost:3306/cohdttpf_vivartana`
   - Do not wrap the value in quotes in cPanel.
   - If admin login loops back to sign-in, set `SESSION_COOKIE_SECURE=false` and restart the app.
3. **Build**: Run `npm run build:milesweb`.
4. **Restart**: Restart the app in cPanel.

## UI Changes
- The mobile menu now uses a standard hamburger icon (three horizontal lines) for better visibility.

## Admin Login
- URL: `/auth/signin`
