# HolylandAward

A website to support the Holyland Award program - a ham radio award system for amateur radio operators.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Database Migrations](#database-migrations)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

- **Python 3.13+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** and **npm** - [Download Node.js](https://nodejs.org/)
- **PostgreSQL 14+** - [Download PostgreSQL](https://www.postgresql.org/download/)
- **uv** (Python package manager) - Install with: `pip install uv`

### Required API Keys

You'll need to set up accounts and obtain API keys for:

- **Clerk** (Authentication) - [Get API keys at clerk.com](https://clerk.com/)
- **Google Maps API** (Map display) - [Get API key at Google Cloud Console](https://console.cloud.google.com/)

## Project Structure

```
HolylandAward/
├── backend/          # FastAPI backend server
│   ├── src/          # Source code
│   ├── alembic/      # Database migrations
│   └── pyproject.toml
└── frontend/         # React + Vite frontend
    ├── src/          # Source code
    └── package.json
```

## Backend Setup

### 1. Database Setup

#### Create PostgreSQL Database

```bash
# Start PostgreSQL service (if not already running)
# On macOS with Homebrew:
brew services start postgresql@14

# Create the database
createdb holyland_award

# Or using psql:
psql postgres
CREATE DATABASE holyland_award;
\q
```

#### Configure Database Connection

The backend uses the `DATABASE_URL` environment variable. You can set it in your shell or create a `.env` file in the `backend/` directory:

```bash
cd backend
echo "DATABASE_URL=postgresql://your_username@localhost:5432/holyland_award" > .env
```

Replace `your_username` with your PostgreSQL username. If you're using port 5433 or a different configuration, adjust accordingly.

### 2. Install Backend Dependencies

```bash
cd backend

# Install dependencies using uv
uv sync
```

This will install all required Python packages including:
- FastAPI
- SQLAlchemy
- Alembic
- psycopg2-binary
- Clerk SDK
- ADIF parser
- And more...

### 3. Run Database Migrations

```bash
# Apply all database migrations
uv run alembic upgrade head
```

This will create all necessary tables (users, qso_logs, etc.) in your database.

### 4. Configure Environment Variables (Optional)

Add any additional environment variables to your `.env` file:

```bash
# Database
DATABASE_URL=postgresql://your_username@localhost:5432/holyland_award

# Clerk (if using authentication in backend)
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd frontend

# Install dependencies
npm install
```

This will install all required packages including:
- React 19
- Vite
- Clerk React SDK
- Google Maps API loader
- TanStack Query
- Tailwind CSS
- And more...

### 2. Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
touch .env
```

Add the following environment variables:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Backend API URL (optional, defaults to http://localhost:1293)
VITE_API_BASE_URL=http://localhost:1293
```

**Important:** Replace the placeholder values with your actual API keys:
- Get your Clerk publishable key from your [Clerk Dashboard](https://dashboard.clerk.com/)
- Get your Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)

## Running the Application

### Start the Backend Server

```bash
cd backend

# Run the FastAPI server
uv run src/main.py
```

The backend API will be available at `http://localhost:1293`

### Start the Frontend Development Server

In a new terminal:

```bash
cd frontend

# Run the Vite development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API Docs:** http://localhost:1293/docs (FastAPI Swagger UI)

## Database Migrations

### Creating a New Migration

When you modify database models, create a new migration:

```bash
cd backend

# Auto-generate migration from model changes
uv run alembic revision --autogenerate -m "Description of your changes"

# Apply the migration
uv run alembic upgrade head
```

### Rolling Back Migrations

```bash
# Rollback one migration
uv run alembic downgrade -1

# Rollback to a specific revision
uv run alembic downgrade <revision_id>
```

### View Migration History

```bash
uv run alembic history
```

## Development Tips

### Backend Development

- The backend uses **FastAPI** with automatic API documentation at `/docs`
- Database models are defined in `src/users/models.py` and `src/qsos/models.py`
- API routes are organized in router files (`src/users/router.py`, `src/qsos/router.py`)
- ADIF log file parsing is handled in `src/adif_service.py`

### Frontend Development

- Built with **React 19** and **Vite** for fast development
- Uses **Clerk** for authentication
- **TanStack Query** for server state management
- **Tailwind CSS** for styling, with shadcn design system
- **Google Maps API** for map visualization

### Common Issues

**Database connection errors:**
- Verify PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
- Check your `DATABASE_URL` in the `.env` file
- Ensure the database exists: `psql -l`

**Frontend can't connect to backend:**
- Verify backend is running on port 1293
- Check CORS settings in `backend/src/main.py`
- Verify `VITE_API_BASE_URL` in frontend `.env`

**Missing API keys:**
- Ensure all required environment variables are set in `.env` files
- Restart development servers after changing `.env` files

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test locally
4. Submit a pull request

## License

[Add your license information here]