# MediaStream Backend

Phase 1 provides the Express application foundation, Mongoose-managed MongoDB lifecycle, common security and error middleware, health endpoint, Swagger foundation, and graceful shutdown.

## Requirements

- Node.js 24 or newer
- MongoDB Atlas connection string

## Local setup

1. Copy `.env.example` to `.env` and replace every example value.
2. Install dependencies with `npm install`.
3. Start the API with `npm run dev`.

The process validates required environment variables before connecting to MongoDB. It exits on invalid configuration or a failed database connection.

## Available endpoints

- `GET /health` - liveness and MongoDB readiness.
- `POST /api/v1/auth/register` - create an account.
- `POST /api/v1/auth/login` - create an authenticated session.
- `POST /api/v1/auth/refresh` - rotate the refresh session.
- `POST /api/v1/auth/logout` - revoke the refresh session.
- `GET /api/v1/auth/me` - return the authenticated user.
- `POST /api/v1/media` - upload one authenticated image, video, audio, or PDF.
- `GET /api/v1/media` - search, filter, rank, and paginate ready media.
- `GET /api/v1/media/mine` - list the current user's uploads.
- `GET /api/v1/media/:id` - return authenticated media details.
- `PATCH /api/v1/media/:id` - update owner/admin-controlled title, description, or tags.
- `DELETE /api/v1/media/:id` - delete an owner/admin-controlled provider asset and metadata.
- `POST /api/v1/media/:id/view` - atomically increment the view count.
- `GET /api-docs` - Swagger UI.
- `GET /api-docs.json` - OpenAPI JSON.

## Verification

- `npm test`
- `npm run test:coverage`
- `npm audit --audit-level=high`

Authentication uses a 15-minute bearer JWT and a rotating seven-day HttpOnly refresh cookie. Remaining media CRUD and search endpoints will be added on their planned feature branches.

Media uploads use Multer memory storage and stream directly to Cloudinary. Configure Cloudinary credentials and the per-type limits in `.env`; defaults are 10 MB for images, 100 MB for video, 25 MB for audio, and 20 MB for PDFs. The multipart fields are `file`, `title`, optional `description`, and optional comma-separated `tags`.

Search accepts `q`, `type`, comma-separated `tags`, inclusive `from`/`to` dates, `sort`, `page`, and `limit`. Text searches use the weighted MongoDB text index and deterministic relevance tie-breakers. Pagination defaults to 20 and is capped at 50.
