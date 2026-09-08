# HolylandAward

A website supporting the Holyland Award program — a ham radio award system for amateur
radio operators. Operators upload their ADIF logs; the app parses them, works out which
Israeli grid squares ("areas") they contacted, and shows their progress on a map and
dashboard.

**Stack:** FastAPI + PostgreSQL backend, React 19 + Vite frontend, Clerk for authentication,
Google Maps for visualization.

The project runs entirely in Docker. All commands below assume Docker Desktop (or Colima)
with Compose v2.

## Prerequisites

- Docker with Compose v2 (`docker compose version`)
- A [Clerk](https://dashboard.clerk.com/) application — you need both its publishable and
  secret key
- A [Google Maps](https://console.cloud.google.com/) API key with the Maps JavaScript API
  enabled

You do **not** need Python, Node, `uv`, or a local PostgreSQL install.

## Setup

**1. Create your environment file**

```bash
cp .env.example .env
```

Fill in the Clerk and Google Maps values (see [Environment variables](#environment-variables)).
The `POSTGRES_*` entries have working defaults and can be left as-is for local development.

**2. Create the database volume (one time)**

`docker-compose.yml` declares the Postgres volume as `external`, so it must exist before the
first start or Compose will refuse to run:

```bash
docker volume create holyland_postgres_data
```

**3. Start everything**

```bash
docker compose up
```

The backend applies database migrations automatically on startup, so there is no separate
migration step for a fresh checkout.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:1293 |
| API docs (Swagger) | http://localhost:1293/docs |
| PostgreSQL | `localhost:5434` |

Both frontend and backend hot-reload; source directories are mounted into the containers, so
edits apply without a rebuild.

## Environment variables

All local configuration lives in a single `.env` at the repo root — Compose reads it and
passes the values into the containers. There are no per-directory `.env` files in the Docker
workflow.

| Variable | Required | Notes |
|----------|----------|-------|
| `CLERK_SECRET_KEY` | **yes** | Backend. Must start with `sk_test_` / `sk_live_`; the app refuses to start otherwise. |
| `CLERK_PUBLISHABLE_KEY` | **yes** | Frontend. Compose maps this into the container as `VITE_CLERK_PUBLISHABLE_KEY` — set **this** name, not the `VITE_`-prefixed one. |
| `VITE_GOOGLE_MAPS_API_KEY` | **yes** | Frontend. Maps will not render without it. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | no | Default to `holyland_user` / `holyland_password` / `holyland_award`. `DATABASE_URL` is assembled from these by Compose. |
| `VITE_API_BASE_URL` | no | Defaults to `http://localhost:1293`. |
| `FRONTEND_URL` | no | Backend CORS origin; defaults to `http://localhost:5173`. |

The publishable and secret Clerk keys must come from the **same Clerk instance** — a mismatch
produces token-verification failures at sign-in rather than an obvious error.

## Common tasks

**Logs**

```bash
docker compose logs -f            # everything
docker compose logs -f backend    # one service
```

**Tests** (43 tests, run against in-memory SQLite)

```bash
docker compose exec backend pytest
docker compose exec backend pytest tests/test_adif_service.py          # one file
docker compose exec backend pytest tests/test_users_service.py::test_x  # one test
```

**Frontend lint and typecheck**

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run build   # typechecking happens here, not in dev
```

**Database migrations**

Migrations run automatically when the backend container starts. To drive them manually:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "Description of change"
docker compose exec backend alembic current
docker compose exec backend alembic history
docker compose exec backend alembic downgrade -1
```

When you add a model, import it in `backend/alembic/env.py` — autogenerate silently misses
models that aren't imported there, and may even propose dropping their tables.

**Database shell**

```bash
docker compose exec db psql -U holyland_user -d holyland_award
```

**Rebuild after changing a Dockerfile or dependency**

```bash
docker compose up --build
```

**Reset the database**

```bash
docker compose down
docker volume rm holyland_postgres_data && docker volume create holyland_postgres_data
docker compose up
```

## Project layout

```
backend/          FastAPI app
  src/            domain packages: qsos/, users/, system_settings/
                  each with models.py, schema.py, repository.py, router.py, service.py
  alembic/        migrations
  tests/          pytest suite
frontend/         React 19 + Vite SPA
  src/api/        TanStack Query hooks, one per endpoint
  src/components/ pages and UI (shadcn/ui in components/ui)
```

Backend imports are rooted at `src/` — `from qsos.repository import ...`, never
`from src.qsos...`. See [CLAUDE.md](CLAUDE.md) for the architectural detail behind that and
other non-obvious conventions.

## Troubleshooting

**`docker compose up` fails with an external volume error** — you skipped step 2; run
`docker volume create holyland_postgres_data`.

**Backend exits immediately on startup** — usually a missing or malformed `CLERK_SECRET_KEY`
or `DATABASE_URL`; both are validated at import time. Check `docker compose logs backend`.

**Sign-in fails with a token error** — the publishable and secret Clerk keys are from
different Clerk instances.

**Maps don't render** — `VITE_GOOGLE_MAPS_API_KEY` is unset, or the key's HTTP-referrer
restrictions don't include `http://localhost:5173`.

**Port already in use** — 5173, 1293, or 5434 is taken; change the host-side port in
`docker-compose.yml`.

## Contributing

1. Branch off `dev`
2. Make your changes and add tests
3. Verify locally: `docker compose exec backend pytest` and `docker compose exec frontend npm run lint`
4. Open a pull request **against `dev`**, not `master`

`dev` is the staging branch and `master` is production; changes reach production through a
`dev` → `master` pull request. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Further documentation

- [DOCKER.md](DOCKER.md) — Docker setup detail and server-side image usage
- [DEPLOYMENT.md](DEPLOYMENT.md) — environments, CI/CD, secrets, Clerk key rotation
- [CLAUDE.md](CLAUDE.md) — architecture and conventions
- [backend/MIGRATIONS.md](backend/MIGRATIONS.md) — migration workflow
- [frontend/DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md) — colors, typography, RTL support

## License

[Add your license information here]
