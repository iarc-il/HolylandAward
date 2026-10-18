# HolylandAward - Docker Setup

This project is now fully dockerized for easy development and deployment.

## CI/CD — Automated Image Builds (GitHub Actions)

Two workflows automatically build and push Docker images to
**GitHub Container Registry (GHCR)** whenever you push to a branch:

| Branch   | Workflow | Images pushed |
|----------|----------|---------------|
| `dev`    | `deploy-dev.yml`  | `backend:dev`, `frontend:dev` |
| `master` | `deploy-prod.yml` | `backend:latest`, `frontend:latest`, `backend:<sha>`, `frontend:<sha>` |

Images are published to:
```
ghcr.io/iarc-il/holylandaward/backend:<tag>
ghcr.io/iarc-il/holylandaward/frontend:<tag>
```

### Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `VITE_API_BASE_URL` | Backend API URL baked into the production frontend bundle |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for the frontend |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key for the frontend |

> `GITHUB_TOKEN` is provided automatically — no action needed.

### Running on a Server

**Dev server** (pulls `:dev` images):
```bash
# First login to GHCR on the server
echo $CR_PAT | docker login ghcr.io -u <github-username> --password-stdin

# Pull latest dev images and start
docker compose -f docker-compose.dev-server.yml pull
docker compose -f docker-compose.dev-server.yml up -d
```

**Production server** (pulls `:latest` images):
```bash
# First login to GHCR on the server
echo $CR_PAT | docker login ghcr.io -u <github-username> --password-stdin

# Pull latest images and start
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

> `CR_PAT` is a GitHub Personal Access Token with `read:packages` scope.

---

## Quick Start

### Local Development

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Clerk API keys.

2. **Create the database volume (one time):**
   ```bash
   docker volume create holyland_postgres_data
   ```
   `docker-compose.yml` declares this volume as `external`, so Compose will not create it
   for you — the first `up` fails without this step.

3. **(Optional) Install frontend dependencies locally:**
   
   If you require company SSO/VPN for npm:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
   
   Otherwise, Docker will install dependencies automatically.

4. **Start all services:**
   ```bash
   docker-compose up
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:1293
   - Database: localhost:5434

### Production (manual, without CI)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

- Frontend: http://localhost
- Backend API: http://localhost:8000

## Services

- **db** - PostgreSQL 16 database
- **backend** - FastAPI application (Python 3.13)
- **frontend** - React + Vite application

## Commands

### Build and start
```bash
docker-compose up --build
```

### Start in background
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
docker-compose logs -f backend  # Just backend
```

### Stop services
```bash
docker-compose down
```

### Reset the database (⚠️ deletes all local data)
`docker-compose down -v` does **not** clear the database — the Postgres volume is declared
`external`, and Compose never removes external volumes. Remove and recreate it explicitly:

```bash
docker-compose down
docker volume rm holyland_postgres_data
docker volume create holyland_postgres_data
docker-compose up
```

### Run database migrations manually
```bash
docker-compose exec backend alembic upgrade head
```

### Access database
```bash
docker-compose exec db psql -U holyland_user -d holyland_award
```

### Rebuild a specific service
```bash
docker-compose up --build backend
```

## Development Features

- **Hot reload enabled** for both frontend and backend
- **Database persistence** via Docker volumes
- **Source code mounted** as volumes for instant updates
- **Health checks** ensure services start in correct order

## File Structure

```
.
├── .github/workflows/
│   ├── deploy-dev.yml              # CI: push to dev → :dev images on GHCR
│   └── deploy-prod.yml             # CI: push to master → :latest images on GHCR
├── docker-compose.yml              # Local development (volume mounts + hot reload)
├── docker-compose.dev-server.yml   # Dev server (pulls :dev images from GHCR)
├── docker-compose.prod.yml         # Production server (pulls :latest images from GHCR)
├── .env.example                    # Environment template
├── backend/
│   ├── Dockerfile                  # Production backend image
│   ├── Dockerfile.dev              # Development backend image (hot reload)
│   └── .dockerignore
└── frontend/
    ├── Dockerfile                  # Production frontend image (nginx + static build)
    ├── Dockerfile.dev              # Development frontend image (Vite dev server)
    ├── nginx.conf                  # Production nginx config
    └── .dockerignore
```

## Troubleshooting

### Port conflicts
If ports 5173, 1293, or 5434 are in use:
```bash
# Change ports in docker-compose.yml
# Example: "3000:5173" instead of "5173:5173"
```

### Database connection issues
```bash
# Check database is healthy
docker-compose ps

# View database logs
docker-compose logs db
```

### Clean slate
```bash
# Remove containers and networks, then rebuild images from scratch
docker-compose down
docker-compose up --build
```
To also wipe the database, see [Reset the database](#reset-the-database--deletes-all-local-data).

## Environment Variables

See `.env.example` for all required environment variables.

### Required (all environments):
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key

### Required for production frontend (set as GitHub Secrets for CI):
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key

### Optional (have defaults):
- `POSTGRES_USER` - Database user (default: holyland_user)
- `POSTGRES_PASSWORD` - Database password (default: holyland_password)
- `POSTGRES_DB` - Database name (default: holyland_award)

