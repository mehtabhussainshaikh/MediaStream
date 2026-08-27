# MediaStream

MediaStream is a backend-first multimedia API for authenticated image, video, audio, and PDF uploads, Cloudinary storage, MongoDB metadata, search, deterministic ranking, ownership controls, and refresh-session authentication.

The backend baseline is implemented in [`backend/`](backend/). Frontend work is intentionally deferred until the backend contract is deployed and accepted.

## Backend status

- Node.js and Express modular API
- Mongoose and MongoDB Atlas metadata persistence
- Cloudinary streaming uploads with compensation on persistence failure
- JWT access tokens and rotating hashed refresh sessions
- Media CRUD, owner/admin authorization, search, filters, ranking, pagination, and atomic views
- Swagger/OpenAPI, Postman collection, unit/integration/contract tests, and deployment smoke test

See [`backend/README.md`](backend/README.md) for setup, API usage, environment variables, tests, and Railway deployment instructions. The implementation decisions and phased delivery record are in [`BACKEND_IMPLEMENTATION_PLAN.md`](BACKEND_IMPLEMENTATION_PLAN.md).

## Repository layout

```text
MediaStream/
  backend/                       Backend application and documentation
  BACKEND_IMPLEMENTATION_PLAN.md
  README.md
```

No frontend code or optional WebSocket/fuzzy-search stretch work is included in the current baseline.
