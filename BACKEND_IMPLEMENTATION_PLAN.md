# Backend Requirements Analysis and Implementation Plan

## 1. Purpose

This document converts the supplied backend requirements and technical assessment into an implementation plan for the backend phase of the Multimedia Upload and Search application.

The current delivery is backend only. Frontend implementation must not begin until the backend API, tests, Swagger documentation, and deployment work are complete and verified.

## 2. Source of truth and requirement priority

The project is governed by these supplied documents:

1. `Backend_Requirements_Specification.docx` - authoritative, implementation-ready backend contract.
2. `Technical Task FullStack (1).pdf` - assessment context, required technologies, expected deliverables, and evaluation criteria.

If the two documents differ in endpoint naming or implementation detail, the backend specification takes priority because it is more detailed and explicitly identifies itself as the approved baseline. For example, the PDF shows illustrative endpoints such as `POST /upload`, while the backend specification defines the versioned media contract. The implementation will therefore use `/api/v1/media`, not create a second `/upload` API.

## 3. Mandatory backend scope

The backend must provide:

- A Node.js and Express.js REST API.
- MongoDB Atlas persistence for users, refresh sessions, and media metadata.
- Cloudinary storage for image, video, audio, and PDF binary assets.
- JWT access-token and refresh-session authentication.
- Registration, login, refresh, logout, and current-user APIs.
- Authenticated multimedia upload using in-memory multipart handling and streaming to Cloudinary.
- Media listing, search, filtering, deterministic ranking, pagination, details, metadata update, deletion, and atomic view increments.
- Owner/admin authorization for media updates and deletion.
- A consistent success and error contract.
- Swagger/OpenAPI documentation for every mandatory endpoint, request, response, authentication rule, and error status.
- Unit, integration, contract, negative, and security tests required by the specification.
- Backend setup and deployment documentation.

## 4. Explicitly deferred or excluded

The following are not part of the current backend baseline:

- Any React, Redux, CSS, SASS, browser UI, or other frontend implementation.
- WebSocket or other real-time upload notifications.
- Fuzzy or advanced Atlas Search.
- Analytics dashboards.
- Media transcoding outside Cloudinary.
- Content moderation.
- Billing.
- Collaborative editing.
- Public sharing.
- View-count deduplication; the baseline may count each preview request if this behavior is documented.

These items must not be introduced unless the mandatory backend is complete and the scope is separately approved.

## 5. Technology constraint

Use only technologies named in the supplied requirements.

| Concern | Required technology or approach |
| --- | --- |
| Runtime | Node.js 24 or newer, JavaScript ESM |
| HTTP API | Express.js and Express middleware |
| Metadata database | MongoDB Atlas |
| MongoDB object modeling | Mongoose, approved after the initial analysis |
| Media storage | Cloudinary |
| Authentication | JWT |
| Multipart upload | Multer memory storage, streamed to Cloudinary |
| API documentation | Swagger/OpenAPI |
| API verification | Postman |
| Source control | Git/GitHub |
| Security middleware | Helmet |
| Tests | Jest |
| Deployment | A deployment target allowed by the assessment, selected during the deployment phase |

No additional database, cache, queue, search engine, object-storage provider, validation library, logging framework, test framework, or deployment service should be added merely by preference. Mongoose is the explicitly approved MongoDB ODM. If another package becomes necessary to implement an explicit requirement but is not named in the documents, its need must be reviewed before it is added.

## 6. Architecture

### 6.1 Architectural style

Use a modular monolith organized by backend feature. The required primary modules are:

- `auth` - registration, login, token creation, refresh-token rotation, logout, and current-user behavior.
- `users` - user persistence and user-domain behavior needed by authentication.
- `media` - upload, Cloudinary lifecycle, metadata CRUD, ownership, search, ranking, pagination, and view counting.

Cross-cutting application infrastructure should remain separate from feature logic:

- Application/bootstrap and HTTP server lifecycle.
- MongoDB connection and indexes.
- Environment validation.
- Authentication and authorization middleware.
- Request ID, security, CORS, payload limits, rate limits, and error middleware.
- Cloudinary adapter.
- Swagger/OpenAPI definition and serving.
- Shared response and error definitions.

### 6.2 Layer responsibilities

Each feature should preserve these boundaries:

1. **Routes** define paths, HTTP methods, middleware order, and controller entry points.
2. **Controllers** translate HTTP input/output and remain thin.
3. **Services** contain business workflows and transaction-like compensation behavior.
4. **Repositories/data access** perform MongoDB operations and query construction.
5. **Models/schemas** define persisted fields, constraints, and indexes.
6. **Validators** enforce request shape, allowed values, IDs, dates, pagination, and upload constraints.
7. **Policies** enforce ownership and admin authorization independently of frontend visibility.
8. **Adapters** isolate Cloudinary behavior and map provider failures to stable application errors.

Dependencies should point inward: routes/controllers may call services; services may call policies, repositories, and adapters. Controllers must not contain database queries or Cloudinary orchestration.

### 6.3 Suggested backend layout

The exact filenames can follow the repository conventions established during foundation work, but the boundaries should resemble:

```text
backend/
  src/
    app/
    config/
    middleware/
    shared/
    infrastructure/
      database/
      cloudinary/
      swagger/
    features/
      auth/
      users/
      media/
    server/
  tests/
    unit/
    integration/
    contract/
```

The PDF expects frontend and backend in separate folders. Only the `backend/` side is to be created during this phase.

## 7. Data design

### 7.1 User

| Field | Contract |
| --- | --- |
| `_id` | MongoDB ObjectId |
| `name` | Trimmed string, 2-80 characters |
| `email` | Unique, normalized lowercase string |
| `passwordHash` | Stored hash; never returned or logged |
| `role` | `user` or `admin`; default `user` |
| `createdAt`, `updatedAt` | Server-controlled dates |

Required index: unique ascending index on `email`.

### 7.2 Refresh session

| Field | Contract |
| --- | --- |
| `userId` | Indexed MongoDB ObjectId referencing the user |
| `tokenHash` | Unique hash; the raw refresh token must never be stored |
| `expiresAt` | Date with TTL index |
| `revokedAt` | Date or `null` |
| `userAgent`, `ipAddress` | Session audit context |

Required indexes: unique `tokenHash`, TTL `expiresAt`, and ascending `userId`.

### 7.3 Media

| Group | Fields and rules |
| --- | --- |
| Identity | `_id`; immutable, indexed `ownerId` |
| Editable user metadata | `title`, `description`, `tags[]` only |
| Validated file metadata | `originalName`, `mimeType`, `extension`, `sizeBytes`, `mediaType` |
| Cloudinary metadata | `publicId`, `resourceType`, `secureUrl`, `format`, `dimensions`, `duration`; derived only from provider response |
| Lifecycle | `status` in `uploading`, `ready`, `failed`; server-controlled timestamps |
| Ranking | `viewCount`, default `0`, updated atomically |

Required indexes:

- `ownerId` ascending plus `createdAt` descending.
- `mediaType` ascending plus `createdAt` descending.
- `tags` ascending.
- Weighted text index: `title` 10, `originalName` 8, `tags` 6, `description` 2.

Binary files must never be stored in MongoDB.

## 8. Versioned API contract

All backend API endpoints are under `/api/v1`, except the public health endpoint if foundation work confirms the specification's literal `/health` path. Swagger must show the actual mounted paths exactly.

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Liveness/readiness summary |
| `POST` | `/api/v1/auth/register` | Public | Create account |
| `POST` | `/api/v1/auth/login` | Public | Create authenticated session |
| `POST` | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh session |
| `POST` | `/api/v1/auth/logout` | Refresh cookie | Revoke session and clear cookie |
| `GET` | `/api/v1/auth/me` | Access token | Return current user |
| `POST` | `/api/v1/media` | Access token | Upload one supported media file |
| `GET` | `/api/v1/media` | Access token | Search, filter, rank, and paginate media |
| `GET` | `/api/v1/media/mine` | Access token | List current owner's uploads |
| `GET` | `/api/v1/media/:id` | Access token | Return media details and preview metadata |
| `PATCH` | `/api/v1/media/:id` | Owner/admin | Edit only title, description, and tags |
| `DELETE` | `/api/v1/media/:id` | Owner/admin | Delete provider asset and metadata safely |
| `POST` | `/api/v1/media/:id/view` | Access token | Atomically increment `viewCount` |

Route declaration must place `/media/mine` before `/media/:id` so that `mine` is not interpreted as an ID.

## 9. Authentication and session behavior

- Registration normalizes email, validates input, hashes the password, rejects duplicates, and never exposes `passwordHash`.
- Login uses one generic invalid-credentials response and applies rate limiting.
- Access tokens expire after 15 minutes.
- Refresh sessions expire after 7 days and rotate on every successful refresh.
- Refresh rotation revokes the previous session and rejects expired or replayed tokens.
- Only a hash of a refresh token is persisted.
- Logout is idempotent, revokes the active session when present, and clears the authentication cookie.
- Protected routes return `401` for missing, malformed, expired, or invalid access tokens.
- Production refresh cookies are `HttpOnly` and `Secure`, with an explicitly configured `SameSite` policy.

## 10. Upload and Cloudinary lifecycle

The upload workflow must be treated as one coordinated business operation:

1. Authenticate the request.
2. Accept `multipart/form-data` containing exactly one supported file and the fields `title`, `description`, and `tags`.
3. Validate metadata, MIME allowlist, media type, and configurable size limit before provider upload.
4. Keep the file in Multer memory storage; do not depend on server-disk temporary files.
5. Stream the in-memory file to Cloudinary using the correct resource type.
6. Derive provider metadata only from the successful Cloudinary response.
7. Persist the MongoDB media record only after provider upload succeeds.
8. If MongoDB persistence fails, attempt compensating Cloudinary deletion and log a sanitized cleanup failure if compensation also fails.
9. Return the standard API envelope without leaking provider secrets or internal errors.

Deletion must use both the stored Cloudinary `publicId` and `resourceType`. The API must not report successful deletion while an untracked provider asset remains.

## 11. Search, ranking, and pagination

`GET /api/v1/media` accepts these strictly validated parameters:

- `q` - text query.
- `type` - media-type filter.
- `tags` - tag filter.
- `from`, `to` - date-range filter.
- `sort` - allowed sort mode.
- `page` - positive page number.
- `limit` - default `20`, maximum `50`.

When a text query is present, matching uses the required weighted MongoDB text index. Relevance order is deterministic:

1. MongoDB text score descending.
2. `viewCount` descending.
3. `createdAt` descending.
4. `_id` as the stable final tie-breaker.

The response must include pagination metadata. View increments must use an atomic MongoDB update.

## 12. Response and error contract

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` is optional and should be included for paginated results.

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A safe client-facing message",
    "details": []
  },
  "requestId": "request identifier"
}
```

`details` is optional. Stack traces, credentials, tokens, cookies, connection strings, and raw provider errors must never be returned.

| Condition | HTTP status | Stable code |
| --- | ---: | --- |
| Validation failed | 400 | `VALIDATION_ERROR` |
| Not authenticated | 401 | `UNAUTHENTICATED` |
| Not authorized | 403 | `FORBIDDEN` |
| Media missing | 404 | `MEDIA_NOT_FOUND` |
| Duplicate email | 409 | `EMAIL_EXISTS` |
| File too large | 413 | `FILE_TOO_LARGE` |
| Unsupported media | 415 | `UNSUPPORTED_MEDIA` |
| Rate limited | 429 | `RATE_LIMITED` |
| Unexpected failure | 500 | `INTERNAL_ERROR` |
| Cloudinary/provider failure | 502 | `STORAGE_ERROR` |

## 13. Security and operations

- Validate all required environment values at startup and fail fast on missing secrets or connection settings.
- Restrict CORS to the configured frontend origin and allow credentials; wildcard CORS is prohibited.
- Apply Helmet.
- Bound JSON request size.
- Enforce upload size limits and MIME allowlists.
- Rate-limit authentication flows as required.
- Redact passwords, JWTs, refresh tokens, cookies, Cloudinary secrets, and MongoDB connection strings from logs.
- Carry `requestId`, route, status, duration, known `userId`, and sanitized error context in structured logs.
- Configure `trust proxy` in production for secure cookies and correct client addressing behind the deployment proxy.
- On `SIGTERM` or `SIGINT`, stop accepting traffic, close the HTTP server, and close MongoDB within a bounded timeout.

## 14. Swagger/OpenAPI completion standard

Swagger is part of each feature, not a final afterthought. Every feature branch must update its API documentation together with its implementation.

The final OpenAPI contract must include:

- API title, version, server/base path, and `/api/v1` versioning.
- Bearer JWT authentication scheme.
- Refresh-cookie authentication behavior where applicable.
- Multipart upload schema with one binary file plus title, description, and tags.
- Query schemas and allowed values for search, filters, sort, page, and limit.
- Object schemas for user, media, pagination metadata, success envelopes, and error envelopes.
- Examples for successful and failed requests.
- All required response statuses and stable error codes.
- Ownership/admin requirements for update and delete.
- Cloudinary preview URL fields returned as metadata.

Contract tests must verify that documented examples and statuses remain aligned with the running API.

## 15. Testing gates

### Unit tests

- Input validators.
- Search/ranking query builder.
- Owner/admin authorization policy.
- Token and refresh-session service.
- Cloudinary adapter error mapping.

### Integration tests

- Register, login, refresh rotation, replay rejection, logout, and current user.
- Upload for image, video, audio, and PDF.
- Upload validation and MongoDB-failure compensation.
- Search, filters, deterministic ranking, and pagination.
- Owner listing, details, update, delete, and provider deletion behavior.
- Atomic view increment.

### Negative and security tests

- Missing, malformed, expired, and invalid JWTs.
- Duplicate email.
- Forged ownership and non-admin modification/deletion.
- Unsupported MIME type and oversized file.
- Malformed MongoDB IDs.
- Authentication rate limit.
- Secret and stack-trace non-disclosure in API errors.

### Exit rule

Do not start the next feature phase until the current phase's implementation, tests, and Swagger changes pass together.

## 16. Feature-wise Git workflow

The persistent integration branch is `develop`. Each feature branch is created from an up-to-date `develop`, contains one coherent phase, and returns to `develop` only after its exit gate passes.

| Order | Branch | Scope | Exit gate |
| ---: | --- | --- | --- |
| 1 | `feature/backend-foundation` | Backend skeleton, configuration validation, MongoDB connection, common middleware, response/error contract, health endpoint, graceful shutdown | Startup, health, MongoDB connection, middleware, and error tests pass; Swagger foundation exists |
| 2 | `feature/auth-api` | User and refresh-session persistence; register, login, refresh, logout, me; JWT protection; cookies; auth rate limits | All auth, rotation, replay, logout, token-negative, and Swagger contract tests pass |
| 3 | `feature/media-upload-api` | Multer memory upload, MIME/size validation, Cloudinary adapter, four media types, metadata persistence, compensation path | Image/video/audio/PDF uploads and failure compensation pass; upload Swagger is complete |
| 4 | `feature/media-crud-api` | Mine/details/update/delete, ownership/admin policy, Cloudinary deletion | CRUD, forged ownership, authorization, and provider deletion tests pass; Swagger is updated |
| 5 | `feature/media-search-api` | Query validation, weighted search, filters, deterministic ranking, pagination, atomic view count | Search/filter/ranking/pagination/view tests pass; Swagger query and response examples are complete |
| 6 | `feature/backend-docs-deployment` | Final Swagger audit, README, Postman material if stored in repo, environment documentation, deployment, smoke test | All tests pass; live backend works; Swagger and README match deployed behavior |

Workflow for every phase:

```text
develop
  -> create feature branch
  -> implement one feature and its tests
  -> update Swagger for that feature
  -> verify the phase exit gate
  -> review and merge into develop
  -> create the next feature branch from updated develop
```

Do not mix frontend work into these branches. Do not start multiple dependent phases before the previous exit gate is complete.

## 17. Implementation decisions

The following decisions are locked:

- Node.js 24 or newer with JavaScript ESM.
- Jest as the only test framework.
- Mongoose for MongoDB schemas, validation, indexes, and model access.
- A 15-minute HS256 JWT access token.
- A rotating 32-byte opaque refresh token persisted only as a SHA-256 hash in a seven-day session.
- Refresh cookie name `mediastream_refresh`, path `/api/v1/auth`, `HttpOnly`, `Secure` in production, `SameSite=Lax` by default locally, and explicitly configurable to `None` for cross-site production deployment.
- `/health` remains unversioned; feature endpoints use `/api/v1`.
- Structured JSON logging uses the existing application logger without an additional logging framework.

The following phase-specific decisions remain to be locked before their related implementation begins:

- Exact supported MIME allowlist and configurable size limit for each of image, video, audio, and PDF.
- Allowed search `sort` values and default behavior when `q` is absent.
- Tag normalization, maximum tag count, and metadata length limits not already specified.
- Deployment target from the examples permitted by the assessment.

None of these decisions authorizes adding unrelated infrastructure.

## 18. Backend definition of done

The backend phase is complete only when:

- Every mandatory endpoint is implemented under the agreed contract.
- Every endpoint and error response is documented in Swagger/OpenAPI.
- Authentication and owner/admin authorization are enforced and tested server-side.
- Raw refresh tokens and credentials are neither persisted nor logged.
- Upload failures do not silently leave untracked Cloudinary assets.
- Search, filters, deterministic ranking, pagination, and atomic view increments are verified.
- The test suites required by Section 15 pass.
- The deployed API works with the configured production frontend origin and secure cookies.
- The README documents local setup, required environment values, assumptions, test commands, Swagger location, deployment URL, and incomplete items.
- No frontend code or optional stretch feature has been introduced into the backend baseline.

Only after this definition of done is met should planning or implementation move to the frontend phase.
