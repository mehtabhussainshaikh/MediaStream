# MediaStream

MediaStream is a full-stack media management application where authenticated users can securely upload, preview, search, filter, edit, download, and delete their own media. It supports images, videos, audio files, and PDFs while keeping every user's collection private.

## Live application

- **Frontend:** [media-stream-delta.vercel.app](https://media-stream-delta.vercel.app)
- **Backend API:** [mediastream-backend-x9c8.onrender.com](https://mediastream-backend-x9c8.onrender.com)
- **Swagger documentation:** [mediastream-backend-x9c8.onrender.com/api-docs](https://mediastream-backend-x9c8.onrender.com/api-docs)
- **Health check:** [mediastream-backend-x9c8.onrender.com/health](https://mediastream-backend-x9c8.onrender.com/health)

> The Render free-tier service may need a short warm-up period after inactivity.

## Features

- Registration, login, logout, access-token refresh, and protected routes
- Owner-scoped media collection: users can access only their own uploads
- Drag-and-drop upload with immediate type and size validation
- Multiple tags per upload with normalization and duplicate removal
- Image, video, audio, and PDF previews
- Media download, metadata editing, and confirmed deletion
- Header search with type, tag, date, and sorting filters
- Server-side ranking, pagination, and atomic view tracking
- Cloudinary media storage and MongoDB metadata persistence
- Authenticated Socket.IO upload notifications
- Responsive, accessible React interface with clear loading, empty, and error states
- Swagger/OpenAPI documentation and automated frontend/backend tests

## Supported files and limits

| Category | Formats | Maximum size |
| --- | --- | ---: |
| Images | JPEG, PNG, WebP, GIF | 10 MB |
| Videos | MP4, WebM, MOV/QuickTime | 100 MB |
| Audio | MP3, WAV, OGG, M4A | 25 MB |
| Documents | PDF | 20 MB |

The frontend displays early validation feedback; backend validation remains authoritative.

## Technology stack

### Frontend

- React 19 and Vite
- React Router
- Redux Toolkit and RTK Query
- Socket.IO Client
- SCSS
- Vitest and Testing Library
- Vercel deployment

### Backend

- Node.js and Express
- MongoDB and Mongoose
- Cloudinary
- JWT access tokens and rotating hashed refresh sessions
- Socket.IO
- Multer streaming uploads
- Swagger/OpenAPI
- Jest
- Render deployment

## Architecture

```text
React + RTK Query (Vercel)
          |
          | HTTPS / Socket.IO
          v
Express API (Render)
     |              |
     v              v
MongoDB Atlas    Cloudinary
metadata/auth    media files
```

The access token is kept in Redux memory and the rotating refresh token is stored in a secure HttpOnly cookie. Media queries and detail operations are scoped to the authenticated owner.

## Local setup

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Configure MongoDB, Cloudinary, JWT, frontend origin, and upload limits in `backend/.env`. The API runs at `http://localhost:3000` by default.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL` and `VITE_REALTIME_URL` to the backend origin. The frontend runs at `http://localhost:5173` by default.

## Verification

```bash
# Frontend
cd frontend
npm run lint
npm test
npm run build

# Backend
cd ../backend
npm test
npm run smoke
```

## Main API routes

All feature endpoints use the `/api/v1` prefix.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/refresh` | Rotate the refresh session |
| `POST` | `/auth/logout` | Sign out |
| `GET` | `/media` | Search/filter the current user's media |
| `POST` | `/media` | Upload media |
| `GET` | `/media/:id` | Get owner-scoped media details |
| `PATCH` | `/media/:id` | Update owned media metadata |
| `DELETE` | `/media/:id` | Delete owned media |
| `POST` | `/media/:id/view` | Record a view |

See [backend/README.md](backend/README.md) for the complete API contract and [frontend/README.md](frontend/README.md) for frontend routes and configuration.

## Repository structure

```text
MediaStream/
├── backend/     Express API, tests, Swagger, and Postman collection
├── frontend/    React application, styles, and component tests
└── README.md
```

## Deployment

The frontend is deployed from `frontend/` to Vercel, and the backend is deployed from `backend/` to Render. Both services are connected to this repository, so pushes to `main` trigger production deployments.
