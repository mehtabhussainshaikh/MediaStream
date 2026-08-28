# MediaStream Backend

Versioned REST API and authenticated Socket.IO channel for secure multimedia upload, Cloudinary-backed previews, MongoDB metadata, authentication, ownership controls, search, ranking, pagination, and real-time upload notifications.

- **Live API:** [https://mediastream-backend-x9c8.onrender.com](https://mediastream-backend-x9c8.onrender.com)
- **Swagger UI:** [https://mediastream-backend-x9c8.onrender.com/api-docs](https://mediastream-backend-x9c8.onrender.com/api-docs)

## Requirements

- Node.js 24 or newer
- MongoDB Atlas database
- Cloudinary account

## Local setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Replace every example value in `.env`. Development and start scripts load `backend/.env` when it exists; production platforms can inject the same variables directly. The process fails fast when mandatory configuration or the MongoDB connection is unavailable.

After startup:

- Health: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production`; defaults to `development` |
| `PORT` | No | HTTP port; defaults to `3000` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string and database name |
| `FRONTEND_ORIGIN` | Yes | One exact HTTP(S) origin allowed to send credentialed browser requests |
| `JSON_BODY_LIMIT` | No | Express JSON payload limit; defaults to `100kb` |
| `SHUTDOWN_TIMEOUT_MS` | No | Graceful-shutdown timeout; defaults to `10000` |
| `JWT_ACCESS_SECRET` | Yes | At least 32 random characters for HS256 access tokens |
| `COOKIE_SAME_SITE` | No | `lax` or `strict` locally; use `none` only with production secure cookies when frontend/backend are cross-site |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret; never expose this to the frontend |
| `MAX_IMAGE_SIZE_MB` | No | Image limit; defaults to `10` |
| `MAX_VIDEO_SIZE_MB` | No | Video limit; defaults to `100` |
| `MAX_AUDIO_SIZE_MB` | No | Audio limit; defaults to `25` |
| `MAX_PDF_SIZE_MB` | No | PDF limit; defaults to `20` |

Do not commit `.env`. The frontend will use a separate environment file containing only browser-safe values such as the deployed API base URL.

## API contract

All feature endpoints use `/api/v1`; health and documentation endpoints remain unversioned.

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Liveness and MongoDB readiness |
| `POST` | `/api/v1/auth/register` | Public | Create account |
| `POST` | `/api/v1/auth/login` | Public | Return access token and set refresh cookie |
| `POST` | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh session |
| `POST` | `/api/v1/auth/logout` | Refresh cookie | Revoke session and clear cookie |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Current user |
| `POST` | `/api/v1/media` | Bearer JWT | Upload one media file |
| `GET` | `/api/v1/media` | Bearer JWT | Search, filter, rank, and paginate |
| `GET` | `/api/v1/media/mine` | Bearer JWT | Current owner's uploads |
| `GET` | `/api/v1/media/:id` | Bearer JWT | Media details and preview metadata |
| `PATCH` | `/api/v1/media/:id` | Owner/admin | Update title, description, or tags |
| `DELETE` | `/api/v1/media/:id` | Owner/admin | Delete Cloudinary asset and metadata |
| `POST` | `/api/v1/media/:id/view` | Bearer JWT | Atomically increment views |
| `GET` | `/api-docs` | Public | Swagger UI |
| `GET` | `/api-docs.json` | Public | OpenAPI JSON |

### Real-time notifications

Socket.IO clients connect to the backend origin and pass the current access token in `auth.token`. Missing, expired, or invalid tokens are rejected. After a media upload is stored successfully, authenticated clients receive `media:uploaded` with `_id`-independent safe metadata: `id`, `ownerId`, `title`, `mediaType`, and `createdAt`. Provider URLs, credentials, and tokens are never broadcast.

The frontend uses this event to announce the upload and invalidate affected RTK Query lists. Render supports WebSocket connections on the same public web-service URL; no separate port is required.

Swagger is the canonical wire contract and includes request schemas, security schemes, examples, response envelopes, and stable error statuses.

### Authentication

- Registration accepts `name`, `email`, and `password`.
- Login returns a 15-minute HS256 bearer JWT and sets `mediastream_refresh` as an HttpOnly seven-day cookie.
- Refresh tokens are 32-byte random values; only SHA-256 hashes are persisted.
- Refresh is one-time and rotating. Expired, revoked, or replayed sessions return `401`.
- Login is rate-limited and uses the same client response for missing accounts and incorrect passwords.

### Upload

`POST /api/v1/media` accepts `multipart/form-data`:

- `file`: exactly one supported file
- `title`: 2-120 characters
- `description`: optional, at most 2000 characters
- `tags`: optional comma-separated list, at most 10 unique lowercase tags of 30 characters each

Supported types are JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime, MP3, WAV, OGG, M4A, and PDF. Multer keeps the file in memory and streams it to Cloudinary. If MongoDB persistence fails afterward, the service attempts compensating provider deletion.

### Search and ranking

`GET /api/v1/media` accepts `q`, `type`, `tags`, `from`, `to`, `sort`, `page`, and `limit`.

- Text search uses the weighted index: title 10, original filename 8, tags 6, description 2.
- Text results sort by score, views, creation time, then `_id`.
- Non-text sort values are `newest`, `oldest`, and `mostViewed`.
- Tags use an all-tags match.
- Dates are inclusive UTC days in `YYYY-MM-DD` format.
- Pagination defaults to 20 and is capped at 50.
- Each authenticated view request increments once; deduplication is intentionally outside the baseline.

## Response envelopes

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  },
  "requestId": "uuid"
}
```

`meta` and `details` are optional. Internal stacks, credentials, cookies, raw tokens, and provider errors are never returned.

## Verification

```bash
npm test
npm run test:coverage
npm audit --audit-level=high
```

The tests cover validators, Mongoose models/indexes, repositories, token/session logic, authorization, Cloudinary error mapping, HTTP integration behavior, failure compensation, search/ranking, and Swagger contract drift.

Import `postman/MediaStream.postman_collection.json` into Postman and set its collection variables. Postman retains the refresh cookie automatically after login.

For a running local or deployed API:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke
```

The smoke check requires `/health` to report MongoDB ready and verifies the published OpenAPI document.

## Render deployment

The production API is deployed as a Render web service.

1. Connect the GitHub repository to a Render web service.
2. Set the service root directory to `backend`.
3. Use `npm ci` as the build command and `npm start` as the start command.
4. Add every required environment variable from the table. Set `NODE_ENV=production`, set `FRONTEND_ORIGIN` to the exact deployed frontend origin, and choose the explicit production `COOKIE_SAME_SITE` policy.
5. Configure the health-check path as `/health`.
6. Configure the public Render domain.
7. Run `SMOKE_BASE_URL=https://<render-domain> npm run smoke` and verify Swagger at `/api-docs`.

The application enables Express `trust proxy` in production, secure cookies, graceful `SIGTERM`/`SIGINT` shutdown, structured request logging, and secret redaction.

## Scope notes

- MongoDB Atlas and Cloudinary must permit traffic from the deployed environment.
- Fuzzy Atlas Search, analytics, moderation, billing, collaborative editing, public sharing, transcoding outside Cloudinary, and view deduplication remain out of scope.
