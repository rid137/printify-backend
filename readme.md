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

## 📂 Project Structure

```bash
src/
├── config/
│   └── db.ts              # Database connection
├── routes/
│   ├── auth.route.ts
│   ├── notification.route.ts
│   ├── upload.route.ts
│   ├── payment.route.ts
│   ├── user/
│   │   ├── user.route.ts
│   │   └── order.route.ts
│   │   └── transaction.route.ts
│   └── admin/
│       ├── user.route.ts
│       ├── order.route.ts
│       └── transaction.route.ts
├── middlewares/
│   ├── error-handler.middleware.ts
│   └── logger.middleware.ts
├── utils/
│   └── swagger.ts
├── services/
├── controllers/
└── index.ts
```
