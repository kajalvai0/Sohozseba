# Functions (serverless) for Sohozseba

This folder contains a small Firebase Functions-compatible HTTP function skeleton to accept booking submissions.

Why this exists
- The static frontend now POSTs booking data to `/api/book` — this function provides a server-side endpoint to persist bookings.

How it works
- If you provide a valid Firebase service account JSON via the environment variable `FIREBASE_SERVICE_ACCOUNT` (stringified JSON), the function will initialize the Admin SDK and write bookings to Firestore (collection `bookings`).
- If `FIREBASE_SERVICE_ACCOUNT` is not set, the function will fall back to appending bookings to a local file `bookings_local.json` (useful for local development).

Local development
1. Install deps: `cd functions && npm install`
2. Run locally: `npm run start` (requires `firebase-functions-framework` to be available via npx)
3. POST to `http://localhost:9000/` with JSON body { name, phone, address, service }

Deployment (Firebase)
1. Install firebase cli: `npm install -g firebase-tools`
2. Authenticate: `firebase login`
3. Initialize (if not yet): `firebase init functions` and choose existing project
4. Do NOT commit your service account JSON; instead set `FIREBASE_SERVICE_ACCOUNT` as an environment variable in your deployment setup (CI) or use a secret manager.

Security notes
- Do NOT commit service account keys to the repo. Add `functions/serviceAccountKey.json` to .gitignore (already added by the repo-level .gitignore update).
- Validate and sanitize inputs in production. Consider adding rate-limiting, CAPTCHA, and monitoring.

