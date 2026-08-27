# MediaStream

MediaStream is a full-stack multimedia library for authenticated image, video, audio, and PDF uploads, Cloudinary storage, MongoDB metadata, search, deterministic ranking, ownership controls, and refresh-session authentication.

The React frontend is implemented in [`frontend/`](frontend/) and consumes the versioned Express API in [`backend/`](backend/).

## Backend status

- Node.js and Express modular API
- Mongoose and MongoDB Atlas metadata persistence
- Cloudinary streaming uploads with compensation on persistence failure
- JWT access tokens and rotating hashed refresh sessions
- Media CRUD, owner/admin authorization, search, filters, ranking, pagination, and atomic views
- Swagger/OpenAPI, Postman collection, unit/integration/contract tests, and deployment smoke test

See [`backend/README.md`](backend/README.md) for setup, API usage, environment variables, tests, and Railway deployment instructions. The implementation decisions and phased delivery record are in [`BACKEND_IMPLEMENTATION_PLAN.md`](BACKEND_IMPLEMENTATION_PLAN.md).

## Frontend status

- Vite, React Hooks, React Router, Redux Toolkit, and RTK Query
- Cookie-enabled session recovery with in-memory access tokens
- Registration, login, logout, protected/public-only routing
- Validated drag/drop upload with local image, video, audio, and PDF previews
- URL-backed 400 ms debounced search, filters, server ranking, and pagination
- Media details, view tracking, owner/admin metadata editing and confirmed deletion
- Classical responsive SCSS design, keyboard/focus behavior, feedback and fallback states
- Vitest and Testing Library checks plus production build verification

See [`frontend/README.md`](frontend/README.md) for setup, environment, routes, tests, and deployment. The phased delivery record is in [`FRONTEND_IMPLEMENTATION_PLAN.md`](FRONTEND_IMPLEMENTATION_PLAN.md).

## Repository layout

```text
MediaStream/
  backend/                       Backend application and documentation
  frontend/                      React application and documentation
  BACKEND_IMPLEMENTATION_PLAN.md
  FRONTEND_IMPLEMENTATION_PLAN.md
  README.md
```

Optional WebSocket and fuzzy-search stretch work remains outside the baseline.
