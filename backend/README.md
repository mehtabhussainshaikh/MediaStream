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
- `GET /api-docs` - Swagger UI.
- `GET /api-docs.json` - OpenAPI JSON.

## Verification

- `npm test`
- `npm run test:coverage`
- `npm audit --audit-level=high`

Authentication and media endpoints will be added on their planned feature branches.
