# Travel Nepway & Tours — V4

V4 keeps the existing frontend design while adding a server-backed foundation.

## Added
- Server-side admin authentication (credentials are no longer embedded in frontend JS).
- PBKDF2 password-hash support via `scripts/hash-password.js`.
- Central JSON datastore for flights, enquiries and CMS content.
- Protected flight create/update/delete API.
- Central enquiry submission API.
- Cross-device enquiry tracking API.
- Login rate limiting and expiring server sessions.
- Existing localStorage remains only as a temporary client cache/fallback.

## Run locally
1. Install Node.js 18+.
2. Generate a password hash:
   `node scripts/hash-password.js "YOUR-STRONG-PASSWORD"`
3. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD_SALT`, and `ADMIN_PASSWORD_HASH` in your server environment. Do not put them in frontend files.
4. Start:
   `node server.js`
5. Open the displayed local address, normally `http://127.0.0.1:8080/`.

For a production deployment, put the app behind HTTPS and a reverse proxy, use a managed database (PostgreSQL/MySQL/etc.), persistent sessions, automated backups, CSRF protection, and a secrets manager. The JSON datastore in this package is intended as the V4 starter datastore, not a high-volume production database.

## CMS direction
The API already exposes `/api/content` for the next CMS screens. The current public pages can therefore be migrated to database-managed content without redesigning them.
