# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A ham-radio award tracker for the Holyland Award. Operators upload ADIF logs; the app parses
them, extracts which Israeli grid squares ("areas") they contacted, and shows progress on a map
and dashboard. FastAPI + PostgreSQL backend, React 19 + Vite frontend, Clerk for auth.

## Commands

Everything runs in Docker — the project has no supported native workflow. Source dirs are
volume-mounted, so both services hot-reload.

```bash
docker volume create holyland_postgres_data   # one time; the volume is declared external
docker compose up                             # frontend :5173, backend :1293, postgres :5434
docker compose logs -f backend
```

```bash
# Tests (43, in-memory SQLite)
docker compose exec backend pytest
docker compose exec backend pytest tests/test_adif_service.py
docker compose exec backend pytest tests/test_users_service.py::test_name

# Frontend — typechecking happens in build, not dev
docker compose exec frontend npm run lint
docker compose exec frontend npm run build

# Migrations (also applied automatically on container start)
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "msg"

docker compose exec db psql -U holyland_user -d holyland_award
docker compose up --build                     # after a Dockerfile or dependency change
```

There is no backend linter/formatter configured.

Two Docker gotchas: the Postgres volume is **external**, so `docker compose down -v` does
*not* reset the database (remove and recreate the volume instead); and pytest is only in the
dev image — `backend/Dockerfile` (production) deliberately installs runtime deps only.

## Backend architecture

### Imports are rooted at `src/`, not at the repo

`PYTHONPATH=/app/src` in the Dockerfiles, `pythonpath = ["src"]` in pytest config, and
`prepend_sys_path = src` in `alembic.ini`. So it is `from utils import ...` and
`from qsos.repository import ...` — never `from src.utils import ...`.

### Domain packages

`qsos/`, `users/`, `system_settings/` each hold `models.py` / `schema.py` / `repository.py` /
`router.py` (+ `service.py`). Repositories are **functional** — module-level functions whose
first arg is the `Session` (`get_user_by_clerk_id(db, ...)`), not classes. Routers are wired
in [src/main.py](backend/src/main.py); `users/admin_router.py` is a second, prefix-less router
carrying both `/admin/*` and some `/user/*` routes.

### Auth: Clerk, no webhooks

`verify_clerk_session` (in [src/utils.py](backend/src/utils.py)) is the FastAPI dependency on
every protected route. Users are **created lazily** on first authenticated request via
`get_or_create_user_from_clerk` — there is no signup webhook and no user-creation endpoint.
Admin status lives in Clerk `public_metadata.role == "admin"`, checked live against the Clerk
API (`is_admin_user`), **not** in the database.

`utils.py` and `database.py` raise at *import time* if `CLERK_SECRET_KEY` / `DATABASE_URL` are
missing — which is why `tests/conftest.py` sets them before anything imports.

### Maintenance mode is HTTP middleware

`maintenance_mode_check` in `main.py` runs on every request, reads the `maintenance_mode` row
from `system_settings` with its own session, and returns 503 to non-admins. `PUBLIC_PATHS`
and `OPTIONS` bypass it. Adding an endpoint that must work while the site is down means
adding it to `PUBLIC_PATHS`.

### Domain concepts that shape the data model

- **Area / region.** An area is a grid-square code like `H03AK`; its **last two characters are
  the region** (`get_regions_from_areas`). [src/area_grids.py](backend/src/area_grids.py) maps
  region → valid area codes and is the whitelist the ADIF parser validates against.
- **QSO uniqueness.** `QSOLogs` has `UniqueConstraint(spotter, area)` — one row per
  operator-per-area, not per contact. Re-uploading a log does not duplicate rows, and "QSO
  count" is really "areas worked".
- **Linked callsigns.** An operator may have held several callsigns. Never query by
  `user.callsign` alone — use `get_callsigns_for_user(db, user)` and the `*_by_spotters`
  (plural) repository functions, as the routers do. Callsign changes go through
  `CallsignChangeRequest` (pending → admin approve/deny), which on approval writes a
  `LinkedCallsigns` row.

### ADIF parsing

[src/adif_service.py](backend/src/adif_service.py) takes records from `adif_io` plus the
user's set of callsigns, and keeps an entry only if its `STATION_CALLSIGN`/`OPERATOR` is one
of theirs *and* a valid area code appears in the QSO fields. Upload strips any `/` suffix from
callsigns. `/read-file` writes the upload to a temp file next to the process, parses, then
deletes it; nginx caps uploads at 10 MB.

### Presence is in-process memory

[src/presence.py](backend/src/presence.py) is a module-level dict + lock with a 90 s TTL, fed
by `POST /presence/heartbeat`. It resets on restart and is per-process — the connected-user
count is wrong under multiple backend replicas.

### Migrations

New models **must be imported in [alembic/env.py](backend/alembic/env.py)** or autogenerate
will silently miss them (and may propose dropping their tables). Containers run
`alembic upgrade head` in their `CMD` before uvicorn starts, so a bad migration means the
backend never boots. `src/migrations_setup.py` is a historical one-time scaffolding script —
do not run it.

## Frontend architecture

### Auth token is passed manually per call

There is no fetch interceptor. Every authenticated hook does
`const token = await getToken()` (Clerk) and passes `{ Authorization: \`Bearer ${token}\` }`
into [src/lib/api.ts](frontend/src/lib/api.ts)'s `apiClient`. Follow the existing hooks in
`src/api/` when adding one; forgetting the header yields a 401, not a redirect.

### Render gating in App.tsx

[src/App.tsx](frontend/src/App.tsx) layers three gates before the app shell renders:
unauthenticated `/maintenance-mode` poll → Clerk `SignedIn`/`SignedOut` → `ProfileGate`
(blocks on `useProfile`, showing an "account blocked" screen when the user-limit cap rejects
the profile fetch). Admin-only routes additionally wrap in `RequireAdmin`.

### Query keys are inconsistent

Three conventions coexist: `src/api/queryKeys.ts` constants, `src/lib/queryKeys.ts`, and
literals inline in hooks (`["user", "profile"]`). Match whatever the hook you're editing
already uses, and check both files before inventing a key — invalidation silently no-ops on a
mismatch.

### Conventions

- Path aliases `@/` → `src/`, `@ui/` → `src/components/ui/` (vite + tsconfig).
- shadcn/ui in `src/components/ui/` (generated — see `components.json`); design tokens and RTL
  rules in [frontend/DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md). Tailwind v4, config-in-CSS.
- Google Maps via `@googlemaps/js-api-loader`; area polygons come from `src/data/areas.ts` with
  turf/jsts for geometry.
- `frontend/AreasUI/` is a dead prototype — not imported, not in `dist`, not served.

## API base URL

`VITE_API_BASE_URL` is **compiled into the bundle at build time**; setting it at runtime does
nothing. Deployed environments use the relative `/api`, which the frontend's nginx proxies to
`backend:8000` (`frontend/nginx.conf`) — same origin, so CORS is only a concern locally. In
`npm run dev` the Vite proxy does the equivalent; the fallback when the var is unset is
`http://localhost:1293`. Backend CORS origins come from `FRONTEND_URL` / `FRONTEND_ORIGINS`.

## Branches and deployment

`dev` → `:dev` images, `master` → `:latest` + `:<sha>`, both pushed to GHCR by
`.github/workflows/deploy-*.yml`. Portainer polls GHCR and redeploys; **CI never touches the
server**. Frontend `VITE_*` secrets are baked in at build time (Clerk/Maps keys via BuildKit
secret mounts), backend secrets are Portainer runtime env vars. Full detail, including the
Clerk key-rotation ordering, is in [DEPLOYMENT.md](DEPLOYMENT.md).

## Testing

pytest against in-memory SQLite with `StaticPool`; `tests/test_api_routes.py` builds a
`TestClient` and overrides `get_db`, `verify_clerk_session`, and `verify_admin` rather than
hitting Clerk. Schema comes from `Base.metadata.create_all`, not Alembic — so a test passing
does not prove the migration chain is correct.
