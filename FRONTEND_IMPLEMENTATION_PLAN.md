# MediaStream Frontend Implementation Plan

## Objective

Build a responsive, accessible React frontend for authentication, multimedia upload, server-ranked discovery, media preview, and owner actions. The application will consume the existing Express OpenAPI contract directly and will not use production mock data.

## Required stack

- React with hooks, built by Vite
- Redux Toolkit and RTK Query
- React Router
- SCSS/CSS3 with reusable design tokens and responsive layouts
- Vitest, React Testing Library, MSW, and axe-based accessibility checks
- Cookie-enabled API requests with short-lived access tokens held only in memory

## Architecture decisions

- `frontend/` is a separate application with its own environment file and scripts.
- RTK Query owns remote user and media state. Authentication bootstrap status is the only justified global client state.
- Search state (`q`, `type`, `tags`, `from`, `to`, `sort`, `page`) lives in the URL.
- Local component state owns dialogs, drafts, drag state, and object-URL previews.
- A shared API base query sends `credentials: include`, attaches the in-memory bearer token, performs at most one refresh attempt after a `401`, and normalizes safe error messages.
- Reusable components expose loading, empty, error, responsive, keyboard, and fallback behavior.
- The visual direction is classical editorial: warm neutral surfaces, navy typography, restrained burgundy/gold accents, serif display headings, crisp borders, and generous spacing.

## Phase and branch plan

### Phase 0 - Planning

Branch: `feature/frontend-plan`

- Record scope, architecture, API assumptions, phases, and verification gates.
- Preserve all existing backend files and user changes.

Exit gate: plan matches the approved frontend specification and backend OpenAPI contract.

### Phase 1 - Foundation

Branch: `feature/frontend-foundation`

- Scaffold Vite and test tooling.
- Configure Redux, RTK Query base API, router, route-level error boundary, and SCSS tokens.
- Build `AppShell`, `Header`, `Navigation`, loading, error, empty, status, and not-found primitives.
- Add environment documentation and an API base URL example.

Exit gate: lint, unit tests, and production build pass; application shell works at 360 px and desktop widths.

### Phase 2 - Authentication

Branch: `feature/frontend-auth`

- Implement session bootstrap, registration, login, logout, public-only routes, and protected routes.
- Preserve intended destinations across login.
- Keep access tokens in memory and refresh cookies HttpOnly.
- Clear protected RTK Query cache on logout or failed recovery.

Exit gate: login/register validation, bootstrap, single refresh, redirects, reload recovery, and logout are verified.

### Phase 3 - Upload

Branch: `feature/frontend-upload`

- Implement picker and keyboard-accessible drag/drop for image, video, audio, and PDF.
- Validate MIME type, configurable size limits, title, description, and tags before submission.
- Build reusable local preview renderers and revoke replaced/unmounted object URLs.
- Submit real multipart data, prevent duplicates, preserve recoverable inputs, and navigate to the created item.

Exit gate: all local validations, preview fallbacks, loading/error/success states, and real upload integration are verified.

### Phase 4 - Search and library

Branch: `feature/frontend-library`

- Implement debounced search, filters, active-filter summary, server sort, adaptive media grid, and pagination.
- Keep every search parameter shareable in the URL and reset page when criteria change.
- Render the server result order without client sorting.
- Add the current user's media view.

Exit gate: debounce, stale-request behavior, URL restoration, filters, ranking order, states, pagination, and responsive behavior are verified.

### Phase 5 - Detail and ownership

Branch: `feature/frontend-media-actions`

- Implement trusted-type media rendering and robust broken-URL fallbacks.
- Increment views once per intentionally opened detail preview.
- Show owner/admin actions using current-user data while treating backend authorization as authoritative.
- Edit only title, description, and tags.
- Require an accessible confirmation dialog before deletion; await success before navigation/cache invalidation.

Exit gate: image/video/audio/PDF paths, fallbacks, view tracking, edit, delete, `403`, and media-specific `404` are verified.

### Phase 6 - Quality and delivery

Branch: `feature/frontend-quality`

- Complete component, integration, routing, and accessibility tests.
- Run lint, tests, and production build.
- Manually verify the end-to-end flow in the browser: register/login, upload, search, preview, edit, delete, and logout.
- Check keyboard flow, focus management, status announcements, 360 px/mobile and desktop layouts.
- Update root/frontend documentation with local setup, environment, test, build, and deployment instructions.

Exit gate: automated suite and browser smoke checks pass. Deployment remains conditional on external hosting credentials and live MongoDB/Cloudinary configuration.

## API integration map

| UI capability | Method and path |
| --- | --- |
| Register | `POST /api/v1/auth/register` |
| Login | `POST /api/v1/auth/login` |
| Refresh | `POST /api/v1/auth/refresh` |
| Current user | `GET /api/v1/auth/me` |
| Logout | `POST /api/v1/auth/logout` |
| Search/library | `GET /api/v1/media` |
| My uploads | `GET /api/v1/media/mine` |
| Upload | `POST /api/v1/media` |
| Detail | `GET /api/v1/media/:id` |
| Record view | `POST /api/v1/media/:id/view` |
| Edit metadata | `PATCH /api/v1/media/:id` |
| Delete | `DELETE /api/v1/media/:id` |

## Assumptions

- Local API default is `http://localhost:3000`; production uses `VITE_API_BASE_URL`.
- The access token returned by login/refresh is required as a bearer token and remains only in Redux memory.
- The refresh cookie is sent with `credentials: include`; the backend CORS origin must exactly match the frontend origin.
- Registration returns a user but does not establish a session, so the UI redirects to login with a confirmation message.
- Upload limits default to the documented backend values and can be overridden with browser-safe Vite variables.
- Deployment cannot be completed without access to a hosting account and configured live backend services; local production-build and browser verification remain mandatory.

## Verification policy

Each phase receives an independent commit. Before acceptance, run the relevant focused tests plus the full lint, test, and build commands. The final phase also requires manual browser verification against the running application and real backend when its external services are configured; otherwise verify the UI and request behavior against a local deterministic test server and explicitly record the limitation.
