# Printify

Remote print orders: upload documents, pay with Paystack, track fulfillment, collect in person.

Backend and frontend are **independent applications**. Install, run, build, and deploy them separately.

```text
printify/
├── backend/     Express + Mongo API (Phase 9.5 contract)
├── frontend/    Next.js App Router (Tailwind CSS v4)
└── README.md
```

| App      | Default URL           | Start                        |
| -------- | --------------------- | ---------------------------- |
| Backend  | http://localhost:8080 | `cd backend && npm run dev`  |
| Frontend | http://localhost:3000 | `cd frontend && npm run dev` |

---

## Local development

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill secrets
npm run dev            # http://localhost:8080
```

```bash
npm run build          # compiles TypeScript and copies email templates into dist/
npm start              # node ./dist/index.js  (requires .env)
npm test
node --loader ts-node/esm src/scripts/verify-order-status.ts
node --loader ts-node/esm src/scripts/verify-multi-item-pricing.ts
node --loader ts-node/esm src/scripts/verify-security.ts
```

Ops probe (no auth): `GET http://localhost:8080/health` → `{ "ok": true }`

API docs (development only by default): http://localhost:8080/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
npm run build
npm start
```

The only required **public** environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Production frontend **builds** must set `NEXT_PUBLIC_API_URL` to the public API origin (Next inlines it at build time). Do not put JWT, Paystack, Cloudinary, SMTP, MongoDB, or Firebase **server** secrets in frontend env.

Run backend and frontend in two terminals. CORS allows the frontend origin from `FRONTEND_URL` (comma-separated list supported).

---

## Architecture

- **Auth:** Register does **not** issue a JWT. Verify the emailed OTP, then a token is issued. Unverified login returns **403**. The API is Bearer-token based; it does not set httpOnly cookies. The frontend stores the JWT in `sessionStorage` for the tab.
- **Pricing:** Authoritative totals are calculated on the server. The public landing calculator is an estimate. Authenticated orders ignore client-supplied page counts and prices.
- **Payments:** `POST /api/payment/initialize` body is `{ "orderId" }` only. Paystack customer email is `req.user.email`. Webhook: `POST /api/payment/webhook` (raw body + `x-paystack-signature`).
- **Transactions:** Status values are only `pending` and `success`. List endpoints return `{ documents, meta }`.
- **Uploads:** JWT required. Max 10 files per request. Cloudinary IDs are owned (`printing-app/{userId}_…`).
- **Admin:** Frontend route guards are UX only. Backend `authenticate` + `authorizeAdmin` is the security boundary.

Visual system: `frontend/design.md`. Marketing (`/`) is editorial; authenticated pages use the app shell.

---

## Environment variables

### Backend (`backend/.env`) — never expose to the browser

| Variable                                                  | Required              | Notes                                                            |
| --------------------------------------------------------- | --------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                                                | recommended           | `production` enables strict secret checks                        |
| `PORT`                                                    | no                    | default `8080`                                                   |
| `MONGO_URI`                                               | **yes**               |                                                                  |
| `JWT_SECRET`                                              | **yes**               | production: 32+ chars; `change-me` / `secret` rejected           |
| `FRONTEND_URL`                                            | **yes in production** | CORS origin(s), comma-separated                                  |
| `FRONTEND_VERIFY_PAYMENT_URL`                             | no                    | Paystack return URL; defaults to `{FRONTEND_URL}/payment/verify` |
| `PAYSTACK_SECRET_KEY`                                     | **yes in production** | live secret; no test-key fallback in production                  |
| `PAYSTACK_TEST_SECRET_KEY`                                | dev only              | used if `PAYSTACK_SECRET_KEY` is unset outside production        |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET`        | **yes in production** | server-side only                                                 |
| `MAX_UPLOAD_SIZE_MB`                                      | no                    | per-file limit, default `10`                                     |
| `OTP_PEPPER`                                              | no                    | defaults to `JWT_SECRET`                                         |
| `ENABLE_SWAGGER`                                          | no                    | default on in development, off in production                     |
| `TRUST_PROXY`                                             | no                    | production defaults to `1` hop; set `0`/`false` to disable       |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | no                    | SMTP optional; API still boots                                   |
| `FIREBASE_*` admin fields                                 | no                    | FCM optional; API still boots                                    |

See `backend/.env.example`.

### Frontend (`frontend/.env.local`)

| Variable              | Required | Notes                                               |
| --------------------- | -------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | **yes**  | backend origin only, e.g. `https://api.example.com` |

Firebase web config is optional and must not include Admin private keys. The checked-in service worker is a no-op placeholder.

---

## Production deployment

Deploy **two** services.

1. **API** — Node 20+, MongoDB, `cd backend && npm ci && npm run build && npm start` with production env.
2. **Web** — `cd frontend && npm ci && npm run build && npm start` (or a Node/Next host). Set `NEXT_PUBLIC_API_URL` **at build time**.

Production boot **fails** if `JWT_SECRET` is missing/weak, or if `MONGO_URI`, `PAYSTACK_SECRET_KEY`, Cloudinary credentials, or `FRONTEND_URL` are missing.

SMTP and Firebase are **not** required to boot. Registration/OTP email will fail until SMTP is configured. Push notification test sends return 500 until Firebase Admin is configured; the rest of the app continues.

### Paystack

- Secret key: `PAYSTACK_SECRET_KEY`
- Checkout callback: `FRONTEND_VERIFY_PAYMENT_URL` or `{FRONTEND_URL}/payment/verify`
- Webhook URL: `https://<api-host>/api/payment/webhook` (HMAC via `x-paystack-signature`)

### Cloudinary

Server-only credentials. Never prefix with `NEXT_PUBLIC_`.

### CORS

Set `FRONTEND_URL` to the exact browser origin(s), e.g. `https://app.example.com`.

### Reverse proxies

Behind nginx, Render, Fly, Railway, or similar, keep `TRUST_PROXY=1` (the production default) so rate limits use the client IP. If you are not behind a proxy, set `TRUST_PROXY=false`.

---

## Security notes

- Authorization is enforced on the API (ownership checks, admin role). Do not treat frontend routes as a security boundary.
- Payment email and order totals cannot be set by the client.
- JWTs live in `sessionStorage` because the API uses `Authorization: Bearer`. Do not put tokens in URLs.
- `.env` files are gitignored. Commit only `.env.example`.

---

## Areas (frontend)

- `/` marketing landing (public quote calculator)
- `/register` `/verify-otp` `/login` `/forgot-password` `/reset-password`
- `/dashboard` `/orders` `/transactions` `/profile` `/notifications`
- `/payment/verify` Paystack return URL
- `/admin/*` admin-only (orders, users, transactions, pricing)

Light/dark theme is persisted in `localStorage`. Harvest orange (`#fa5d00`) is the accent.
