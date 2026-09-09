# Printify frontend

Next.js (App Router) + Tailwind CSS v4. Independently installable from `backend/`.

```bash
npm install
cp .env.example .env.local
npm run dev      # http://localhost:3000
npm run build    # requires NEXT_PUBLIC_API_URL
npm start
```

## Environment

The only required public variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

In production, set this to the public API origin **when you build** (Next inlines `NEXT_PUBLIC_*` at compile time).

Do not put JWT, Paystack, Cloudinary, SMTP, MongoDB, or Firebase Admin secrets here.

## Firebase / FCM

Optional. The app does not assume Firebase is configured.

- Device registration uses a pasted FCM token against `POST /api/notification/register-device`.
- `POST /api/notification/send-test` may return 500 if the API has no Firebase Admin config; that is expected and is not treated as an app-wide failure.
- `public/firebase-messaging-sw.js` is a no-op placeholder (no project credentials). Replace it only if you enable web push for your own Firebase project.

## Design

See `design.md`. Marketing (`/`) and the authenticated app shell are the same product in different contexts.

See the repository root `README.md` for architecture, CORS, and deployment.
