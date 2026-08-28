# MediaStream Frontend

React interface for private multimedia upload, server-ranked search and filtering, previews, downloads, metadata editing, and deletion.

**Live application:** [https://media-stream-delta.vercel.app](https://media-stream-delta.vercel.app)

## Local setup

Requirements: Node.js 20.19 or newer and the MediaStream backend running on port 3000.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Set the backend `FRONTEND_ORIGIN` to that exact origin so credentialed refresh-cookie requests pass CORS.

## Environment

`VITE_API_BASE_URL` is the backend origin without `/api/v1`. `VITE_REALTIME_URL` is the Socket.IO backend origin and normally uses the same value. The optional media size variables mirror backend limits and are used only for early client feedback. Backend validation remains authoritative.

Access and refresh tokens are never written to local storage. The access token remains in Redux memory; the backend owns the HttpOnly refresh cookie. API requests send `credentials: include` and perform at most one refresh attempt after a `401`.

Authenticated Socket.IO connections use the same in-memory access token. Successful uploads broadcast safe media metadata, display an accessible notification, and invalidate media-list caches without exposing provider URLs.

## Commands

```bash
npm run lint
npm test
npm run test:coverage
npm run build
npm run preview
```

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/register` | Public only | Create account |
| `/login` | Public only | Sign in and restore intended destination |
| `/media` | Authenticated | URL-backed search, filters, server ranking, pagination |
| `/media/upload` | Authenticated | Validated drag/drop upload and local preview |
| `/media/:id` | Authenticated | Preview, view event, metadata, owner edit/delete |

## Deployment

The included `vercel.json` configures Vite output and SPA route fallback. The production project uses `frontend` as its root directory and defines `VITE_API_BASE_URL` and `VITE_REALTIME_URL` with the public Render backend origin. The backend allows the exact Vercel production origin and uses secure cross-site refresh cookies.

Pushes to `main` automatically deploy to [https://media-stream-delta.vercel.app](https://media-stream-delta.vercel.app).
