# MediaStream Frontend

React interface for secure multimedia upload, server-ranked search, preview, metadata editing, and deletion.

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
| `/media/mine` | Authenticated | Current user's uploads |
| `/media/upload` | Authenticated | Validated drag/drop upload and local preview |
| `/media/:id` | Authenticated | Preview, view event, metadata, owner edit/delete |

## Deployment

The included `vercel.json` configures Vite output and SPA route fallback. Import the repository in Vercel, set the root directory to `frontend`, and define both `VITE_API_BASE_URL` and `VITE_REALTIME_URL` as the public Render backend origin. The backend must set `FRONTEND_ORIGIN` to the exact Vercel production origin and use a compatible secure `SameSite` cookie policy.

No live URL is included because hosting credentials and live MongoDB/Cloudinary configuration are not present in this workspace.
