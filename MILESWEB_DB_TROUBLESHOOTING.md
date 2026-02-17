# MilesWeb MariaDB/MySQL Connection Issues (Prisma + Express)

This document captures a real-world MilesWeb/cPanel deployment issue where the site loaded, but admin/login and any DB-backed actions failed because the Node.js process was not actually connecting to MariaDB with the intended credentials.

## Symptoms

- `POST /auth/signin` always redirects to `/auth/signin?error=1`.
- `POST /contact` returns `500`.
- The server log (`stderr*.log`) shows Prisma connection/auth errors, for example:
  `Authentication failed against database server, the provided database credentials for 'X' are not valid`

## Root Cause (What Actually Happened)

1. The running Node.js process was using a different `DATABASE_URL` than expected (stale or incorrect environment).
2. The MySQL username was wrong in the effective `DATABASE_URL` on the server:
   On cPanel, MySQL users are commonly *prefixed* by the cPanel account name, e.g. `cpaneluser_dbuser`.
   Example: cPanel user `cohdttpf` creates DB users like `cohdttpf_aumlaan`.
   Using the short username (without prefix) will fail authentication even if the password is correct.
3. Changes to code and `.env` were not taking effect until a *real* Passenger/Node restart occurred.
   With cPanel Node.js apps (CloudLinux Passenger + LiteSpeed), the process can keep running with old env until you restart the app from the cPanel UI.

## Fast Triage Checklist

1. Verify the database credentials work *from the server* (not from your laptop).
   The simplest test is a PHP `mysqli` script in the domain docroot.
   Connect to `localhost`, the full prefixed user, and the database.
   If PHP connects but Node/Prisma does not, the DB server is fine and the problem is in the Node environment/runtime.
2. Check the Prisma error message.
   Prisma errors often include the username it is trying to use.
   If it's using a short username (missing cPanel prefix), your effective `DATABASE_URL` is wrong.
3. Confirm the Node process is running the code you think it is.
   Add a temporary diagnostic route that returns the parsed `process.env.DATABASE_URL` (redact password).
   If the route isn't reachable after "restart", your app didn't actually reload.

## Fix (Recommended)

### 1) Set the Correct `DATABASE_URL` (use the full cPanel-prefixed DB user)

Use this format:

```text
DATABASE_URL=mysql://CPANEL_PREFIX_DBUSER:DB_PASSWORD@localhost:3306/CPANEL_PREFIX_DBNAME
```

Notes:

- Prefer setting env vars in **cPanel -> Setup Node.js App** (Node.js Selector), not by committing secrets.
- If you do keep a `.env` file on the server, keep it **out of git** (this repo already ignores `.env`).

### 2) Ensure the App Loads `.env` from the Project Root (cwd-safe)

On MilesWeb/Passenger, the process working directory may not be the repo root. This project loads `.env` explicitly from the project root in:

- `src/server.js`

This matters because Prisma reads `DATABASE_URL` when the Prisma client is created, so `DATABASE_URL` must be correct before `PrismaClient()` is instantiated.

### 3) Restart the Node.js App for Env Changes to Apply

After changing env vars (or `.env`), restart from:

- cPanel -> **Setup Node.js App** -> Restart (or Stop then Start)

Do not rely on only editing files to "trigger" a restart; verify with a runtime diagnostic or a PID change.

## Project-Specific Guardrails

- `src/server.js` loads `.env` in a cwd-safe way and with `override: true` so server-side `.env` can win over stale process env.
- `src/server.js` also normalizes cPanel MySQL URLs when the username is missing the cPanel prefix (best effort safety net).
  The primary fix is still to set a correct `DATABASE_URL` in the hosting environment.

## Verification Steps

1. Confirm MariaDB connectivity on-host:
   PHP `mysqli` test returns `OK`.
2. Confirm Node/Prisma is using the intended connection string:
   Diagnostic endpoint (temporary) returns values like:
   `protocol=mysql:`
   `username=cpanel_prefix_user`
   `host=localhost:3306`
   `database=cpanel_prefix_db`
3. Admin login works:
   `POST /auth/signin` redirects to `/admin`
   A `Set-Cookie: vivantara_session=...` header is returned

## Where To Look (References)

Repo files:

- Prisma datasource expects `DATABASE_URL`: `prisma/schema.prisma`
- Server boot + env loading: `src/server.js`
- Prisma client creation: `src/lib/prisma.js`
- Admin login uses Prisma user lookup: `src/routes/auth.js`
- (Optional/temporary) DB/env diagnostic endpoint: `src/routes/public.js` (`GET /__diag-db`)
  In production, this endpoint is disabled unless `DIAG_TOKEN` is set and provided (query `?token=...` or header `X-Diag-Token`).

Server-side (MilesWeb) locations (for reference when debugging on-host):

- Passenger config and `SetEnv` values are commonly written into the domain `.htaccess` by Node.js Selector:
  `/home/<cpanel-user>/<domain>/.htaccess`
- CloudLinux Node.js Selector env vars:
  `/home/<cpanel-user>/.cl.selector/node-selector.json`
- App stderr log (Prisma errors show up here):
  `/home/<cpanel-user>/repositories/<repo>/stderr*.log`

Note: Node.js Selector can rewrite the `CLOUDLINUX PASSENGER CONFIGURATION` and `CLOUDLINUX ENV VARS CONFIGURATION` blocks in `.htaccess`. Treat those sections as generated config and prefer changing settings in the cPanel UI.

## Security Notes

- Do not commit DB passwords, SMTP passwords, or cPanel API tokens to git.
- If you ever shared a cPanel API token during debugging, rotate it after the incident is resolved.
