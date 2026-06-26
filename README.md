# TenantTrails API

REST API for the TenantTrails app, built for CSCI 4177/5709 Lab 5.
Express + MySQL (the Week 4 `tenanttrails` database) + JWT auth + Cloudinary uploads.

## Stack

Express 5, mysql2 (connection pool), jsonwebtoken, bcrypt, multer, cloudinary.
Tests with Jest + supertest.

## Setup

```bash
npm install
cp .env.example .env      # then fill in the values
```

Run the migrations once against your Week 4 database (they switch the id
columns to AUTO_INCREMENT and add the review image column):

```bash
mysql -u root -p tenanttrails < sql/0001_api_autoincrement.sql
mysql -u root -p tenanttrails < sql/0002_review_image.sql
```

Start the server (restarts on save):

```bash
npm run dev      # API on http://localhost:3000
```

## Environment (.env)

| Key | Purpose |
|-----|---------|
| `PORT` | server port (default 3000) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL connection |
| `JWT_SECRET` | signs and verifies auth tokens |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | image uploads |

Secrets live in `.env` (gitignored). `.env.example` lists the keys with no values.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/health` | - | Liveness check |
| POST | `/api/auth/signup` | - | Create user, returns JWT |
| POST | `/api/auth/login` | - | Returns JWT |
| GET  | `/api/auth/me` | Bearer | Current user |
| GET  | `/api/apartments` | - | Dashboard list with avg rating + review count |
| GET  | `/api/apartments/:id` | - | Apartment with nested reviews and comments |
| POST | `/api/apartments/:id/reviews` | Bearer | Add a review (author from token) |
| POST | `/api/reviews/:id/comments` | Bearer | Add a comment to a review |
| POST | `/api/uploads` | Bearer | Upload an image, returns CDN URL |
| POST | `/api/reviews/:id/image` | Bearer | Upload and attach an image to a review |

Auth is a Bearer token: `Authorization: Bearer <token>`.
The author of any write is taken from the verified token, never the request body.

## Testing

Postman: import `TenantTrails-API.postman_collection.json`, run **Login** first
(it saves `{{token}}`), then the protected requests.

Automated (needs the database reachable):

```bash
npm test
```

```
PASS tests/api.test.js
  apartments API
    ok lists apartments
    ok blocks an unauthenticated review
```

## Project structure

```
tenanttrails-api/
├── app.js            Express app (middleware, routes), exported for tests
├── server.js         entry point; starts the server
├── db.js             mysql2 connection pool
├── middleware/auth.js   JWT verification
├── utils/token.js       JWT signing
├── config/cloudinary.js Cloudinary SDK + upload helper
├── routes/
│   ├── auth.js          signup, login, me
│   ├── apartments.js    list, detail, add review
│   ├── reviews.js       add comment, attach image
│   └── uploads.js       generic image upload
├── sql/                 one-time migrations
├── tests/api.test.js    supertest tests
└── .env.example
```

## Lab 6 additions

New endpoints (owner-checks return 403 when it is not your review):

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/api/apartments/:id/reviews` | - | Reviews for an apartment, aliased to camelCase (`aptId`, `userId`, `author`, `date`) |
| PUT    | `/api/reviews/:id` | cookie | Edit your own review (403 otherwise) |
| DELETE | `/api/reviews/:id` | cookie | Delete your own review (403 otherwise) |
| GET    | `/api/profile` | cookie | The logged-in user and their own reviews |
| POST   | `/api/auth/logout` | - | Clears the auth cookie |

Auth moved from a Bearer token to an **httpOnly cookie** set at login/signup and
cleared at logout. The middleware reads `req.cookies.token` (Bearer still works as
a Postman fallback). CORS allows the React origin with credentials.

New env key: `FRONTEND_URL` (the React origin, e.g. `http://localhost:5173`).
