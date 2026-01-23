# HolylandAward - Docker Setup

This project is now fully dockerized for easy development and deployment.

## Quick Start

### Development

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Clerk API keys.

2. **(Optional) Install frontend dependencies locally:**
   
   If you require company SSO/VPN for npm:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
   
   Otherwise, Docker will install dependencies automatically.

3. **Start all services:**
   ```bash
   docker-compose up
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Database: localhost:5433

### Production

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

### Stop and remove volumes (⚠️ deletes database data)
```bash
docker-compose down -v
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
├── docker-compose.yml          # Development setup
├── docker-compose.prod.yml     # Production setup
├── .env.example                # Environment template
├── backend/
│   ├── Dockerfile              # Backend container
│   └── .dockerignore
└── frontend/
    ├── Dockerfile              # Production frontend
    ├── Dockerfile.dev          # Development frontend
    ├── nginx.conf              # Production nginx config
    └── .dockerignore
```

## Troubleshooting

### Port conflicts
If ports 5173, 8000, or 5433 are in use:
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
# Remove all containers, networks, and volumes
docker-compose down -v
docker-compose up --build
```

## Environment Variables

See `.env.example` for all required environment variables.

### Required:
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key

### Optional (have defaults):
- `POSTGRES_USER` - Database user (default: holyland_user)
- `POSTGRES_PASSWORD` - Database password (default: holyland_password)
- `POSTGRES_DB` - Database name (default: holyland_award)
