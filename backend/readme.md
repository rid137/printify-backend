# 🖨️ Printify Backend

Printify is a backend service that eliminates the hassle of waiting in long queues at printing shops by allowing users to upload documents remotely, pay for print orders via Paystack, track order status, receive push notifications, and pick up their printed documents at their convenience.

## 🚀 Features

- 📄 Remote document upload
- 💳 Paystack payment integration
- 🔔 Push & background notifications via Firebase Cloud Messaging (FCM)
- 📬 Email alerts with custom HBS templates
- 🔐 Secure authentication with JWT
- ☁️ Cloud storage via Cloudinary
- 📦 File handling with Formidable
- 🧾 Order & transaction management (Admin & User APIs)
- 🧪 Swagger documentation
- ❌ Centralized error handling using custom error classes
- 🧱 Modular and maintainable folder structure
- 🍃 MongoDB integration with Mongoose

---

## 🛠 Tech Stack

- **Backend Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Email Service**: Nodemailer + Handlebars (HBS)
- **File Uploads**: Formidable + Cloudinary
- **API Docs**: Swagger

---

## Environment (Paystack)

| Variable | Purpose |
|----------|---------|
| `PAYSTACK_SECRET_KEY` | Secret for API calls and webhook HMAC. **Required in production** (no test-key fallback). |
| `PAYSTACK_TEST_SECRET_KEY` | Development/test fallback if `PAYSTACK_SECRET_KEY` is unset |
| `FRONTEND_VERIFY_PAYMENT_URL` | Paystack callback URL after checkout. Optional; defaults to `{FRONTEND_URL}/payment/verify` |
| `TRUST_PROXY` | Reverse-proxy hops for `req.ip` / rate limits. Production defaults to `1`. Set `false` if not behind a proxy. |

Production boot fails if `JWT_SECRET` (minimum 32 characters; trivial values such as `change-me` are rejected), `MONGO_URI`, `PAYSTACK_SECRET_KEY`, Cloudinary credentials, or `FRONTEND_URL` are missing. Development still requires `JWT_SECRET` and `MONGO_URI`; Paystack may use the test-key fallback. SMTP and Firebase are not boot requirements.

`GET /health` returns `{ "ok": true }` (unauthenticated, for process/load-balancer probes).

Webhook URL to configure in Paystack: `POST /api/payment/webhook` (public; secured with `x-paystack-signature`).

---

## Environment (Upload / Cloudinary)

| Variable | Purpose |
|----------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key (server only) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (server only — never expose to frontend) |
| `MAX_UPLOAD_SIZE_MB` | **Per-file** upload limit in MB (default `10`) |

### Supported upload formats

- PDF (`.pdf` / `application/pdf`) — uploaded as Cloudinary `image`; `pages` usually returned
- Word (`.docx` only) — uploaded as Cloudinary `raw`
- PowerPoint (`.pptx` only) — uploaded as Cloudinary `raw`

Legacy `.doc` / `.ppt` are not supported.

`MAX_UPLOAD_SIZE_MB` is a **per-file** limit, not a multi-file order/session total. Each upload request accepts at most **10** files.

DOCX/PPTX page counts are **not** returned by Cloudinary on a standard raw upload without the Aspose document-conversion add-on. The upload API returns `pages: null` when Cloudinary does not provide a page count — values are never invented.

**Order create and authenticated price calculation** ignore client-supplied `pages` and `url`. They resolve the Cloudinary resource owned by the authenticated user (`printing-app/{userId}_{uuid}`):

- **PDF:** priced from Cloudinary `pages` (must be ≥ 1).
- **DOCX/PPTX:** rejected unless Cloudinary already has a page count. The server does not invent one.

The public landing calculator `POST /api/pricing/calculate` still accepts client `pages` as a quote only (no file, no order).

Upload requires JWT authentication: `POST /api/upload` with multipart field `files`. Another user cannot attach your `publicId` to their order.

`npm run build` emits `dist/` and copies Handlebars email templates from `src/utils/email/templates` (TypeScript compile does not copy `.hbs` files). `npm start` runs `node ./dist/index.js`.

---

## Pricing configuration

On startup the server upserts a singleton `PricingConfig` (`key: active`) seeded from the historical hardcoded rules (paper-size premiums start at `0` so totals are unchanged).

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/admin/pricing` | Admin JWT | Read active rules + version |
| `PUT /api/admin/pricing` | Admin JWT | Replace rules; increments `version` |
| `POST /api/pricing/calculate` | Public | Landing-page calculator |

Authenticated order price calc remains at `POST /api/user/orders/calculate-price` (multi-item) and uses the same `PricingService`. Public single-option calc: `POST /api/pricing/calculate`.

### Multi-item orders

Orders store an embedded `items[]` array (file metadata, printing options, quantity, server-calculated `unitPrice`/`subtotal`, and `pricingSnapshot`). Legacy single-file orders are normalized on read; run `npm run migrate:orders` to persist the conversion.

Upload files first (`POST /api/upload`), then create an order with the returned `public_id` (and optional display `fileName`). Client `pages` is not used for pricing. Orphaned Cloudinary files from failed order creation are **not** auto-deleted in this phase (unsafe without reference checks).

### Order status machine

Orders move forward only: `pending → received → processing → completed → delivered`. The order **owner** may cancel an unpaid `pending` order via `POST /api/user/orders/:id/cancel`. Admins cannot cancel through the status endpoint. Same-status updates are rejected. Payment confirmation does **not** advance status; an admin marks a paid order as `received`. `status` is authoritative; `isDelivered` is kept in sync on write (`true` only when `status === delivered`).

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `PUT /api/admin/orders/:id/status` | Admin JWT | Transition status (`{ status, note? }`) |
| `PUT /api/admin/orders/:id/deliver` | Admin JWT | Shortcut for `status=delivered` (must already be `completed`) |
| `POST /api/user/orders/:id/cancel` | Owner JWT | Cancel unpaid pending order |
| `GET /api/admin/orders/:id` | Admin JWT | Single order including `statusHistory` |

List endpoints accept an optional `?status=` filter. Run `npm run migrate:order-status` to canonicalize legacy `isDelivered` / `printed` / `shipped` values.

### Authentication / OTP

Verification field: `User.isVerified` (default `false`). Flow: **register (no JWT) → email OTP → verify-otp (JWT issued) → login**. Unverified users cannot obtain a JWT from login and cannot use authenticated routes.

OTPs are stored as HMAC-SHA256 hashes (`OTP_PEPPER` or `JWT_SECRET`), expire in **10 minutes**, allow **5** verification attempts, and are deleted after success or lockout. Resend cooldown is **60 seconds** per email+purpose. `POST /api/auth/request-otp` and `POST /api/auth/forgot-password` always return the same success message so they do not reveal whether an email is registered.

IP auth rate limit remains **20 requests / 15 minutes** (Phase 1). Per-email cooldown is internal (HTTP 200 even when skipped) so probing an email cannot lock the owner out via 429.

Upload: if a file is stored on Cloudinary and that same upload then fails before it is returned to the client, that owned `public_id` is destroyed. **Order create does not delete Cloudinary files** — they came from a previous upload and may be retried.

### Swagger

`/docs` and `/docs.json` are **on by default in development** and **off by default in production**. Set `ENABLE_SWAGGER=true` to expose them in production, or `ENABLE_SWAGGER=false` to disable them in development.

---
