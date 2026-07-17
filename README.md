# Freelance Marketplace (Capstone)

A simplified Upwork-style platform connecting **freelancers** with **clients** — job posting, proposals, file attachments, and an admin dashboard.

## Quick Start (One Command)

```bash
docker compose up --build
```

The app will be available at **http://localhost:3000**

> **Note:** SQL Server takes ~30 s to initialise on first run. The API waits for it via a health check before starting.

### Default Seed Account

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.test` | `Password123!` |

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | .NET 8 Web API · EF Core 8 (code-first) · ASP.NET Core Identity + JWT |
| **Frontend** | React 19 · Vite · TypeScript · TanStack Query v5 · Axios · Tailwind CSS v3 |
| **Database** | SQL Server 2022 (Docker) |
| **Third-party API** | [Frankfurter](https://www.frankfurter.app/) — keyless currency conversion |
| **Orchestration** | Docker Compose v2 |

---

## Running Locally (Dev Mode)

### Prerequisites
- .NET 8 SDK
- Node 18+
- Docker Desktop

### Backend

```bash
cd backend
# Start SQL Server
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Password123!" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest

# Apply migrations and run
dotnet run --project src/FreelanceMarketplace.Api
# API listens on http://localhost:5107
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App opens at http://localhost:3000 (proxies /api → :5107)
```

---

## Features

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Authentication** | Register / Login with JWT; roles: Freelancer, Client, Admin |
| 2 | **Job Posting (CRUD)** | Clients create, edit, delete jobs with category, budget type, and currency |
| 3 | **Job Discovery** | Search by keyword, category, and budget range |
| 4 | **Currency Conversion** | Freelancers see budgets in their preferred currency via Frankfurter API (cached 1 h, graceful fallback) |
| 5 | **File Attachments** | Upload files to jobs and profiles (max 5 MB, validated extension); authenticated download |
| 6 | **Proposals** | Freelancers submit, edit, and withdraw bids; clients view all proposals on their jobs |
| 7 | **Admin Dashboard** | Metrics (KPIs, role breakdown, recent signups), user role management, account suspension |
| 8 | **Role-based Access** | Route and endpoint guards enforce Freelancer / Client / Admin boundaries |

---

## API Reference

Base URL: `http://localhost:5107/api`  
All protected endpoints require `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | — | Register (Freelancer or Client only) |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | ✓ | Current user profile |
| PUT | `/auth/profile` | ✓ | Update display name / currency / avatar |
| GET | `/jobs` | — | List jobs (search, category, budget filters) |
| POST | `/jobs` | Client | Create a job |
| GET | `/jobs/{id}` | — | Get job details |
| PUT | `/jobs/{id}` | Client (owner) | Update a job |
| DELETE | `/jobs/{id}` | Client (owner) | Delete a job |
| GET | `/jobs/{id}/proposals` | Client (owner) / Admin | List proposals for a job |
| POST | `/proposals` | Freelancer | Submit a proposal |
| GET | `/proposals/mine` | Freelancer | My proposals |
| PUT | `/proposals/{id}` | Freelancer (owner) | Edit a proposal |
| POST | `/proposals/{id}/withdraw` | Freelancer (owner) | Withdraw a proposal |
| DELETE | `/proposals/{id}` | Admin | Delete a proposal |
| POST | `/files` | ✓ | Upload a file (multipart) |
| GET | `/files/{id}` | ✓ | Download a file |
| GET | `/currency/convert` | — | Convert amount between currencies |
| GET | `/admin/metrics` | Admin | Platform KPIs |
| GET | `/admin/users` | Admin | All users |
| POST | `/admin/users/{id}/role` | Admin | Change user role |
| POST | `/admin/users/{id}/toggle-status` | Admin | Suspend / enable account |

---

## Testing

```bash
cd backend
dotnet test
```

- **58 tests** — all green (unit + integration)
- **89.3% line coverage** (excluding auto-generated migrations and `Program.cs`)

Generate HTML coverage report:

```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./TestResults
~/.dotnet/tools/reportgenerator \
  -reports:"TestResults/**/coverage.cobertura.xml" \
  -targetdir:"TestResults/CoverageReport" \
  -reporttypes:Html \
  -classfilters:"-FreelanceMarketplace.Api.Data.Migrations.*;-FreelanceMarketplace.Api.Data.DesignTimeDbContextFactory;-Program"
# Open TestResults/CoverageReport/index.html
```

---

## Project Structure

```
freelance-marketplace/
├── backend/
│   ├── src/FreelanceMarketplace.Api/
│   │   ├── Controllers/        # Auth, Jobs, Proposals, Files, Currency, Admin
│   │   ├── Data/               # AppDbContext, DbSeeder, Migrations
│   │   ├── Dtos/               # Request/Response records
│   │   ├── Entities/           # AppUser, Job, Proposal
│   │   ├── Services/           # Business logic + interfaces
│   │   ├── Validation/         # FluentValidation validators
│   │   └── Middleware/         # Global exception handler
│   └── tests/FreelanceMarketplace.Tests/
│       ├── Unit/               # Service-level unit tests
│       └── Integration/        # HTTP endpoint integration tests
├── frontend/
│   └── src/
│       ├── components/         # Navbar, ProtectedRoute
│       ├── context/            # AuthContext
│       ├── utils/              # Axios client
│       └── views/              # Login, Register, JobList, JobDetails, JobForm, AdminDashboard
├── docs/
│   ├── SPECIFICATION.md
│   ├── UAT.md                  # Acceptance test results
│   └── PROMPTS.md              # Top 20 AI prompts
├── Dockerfile.api
├── Dockerfile.web
└── docker-compose.yml
```

---

## Documentation

- 📄 [SPECIFICATION.md](./SPECIFICATION.md) — full spec, user stories, Gherkin criteria, technical design
- ✅ [docs/UAT.md](./docs/UAT.md) — acceptance test results (20/20 pass)
- 🤖 [docs/PROMPTS.md](./docs/PROMPTS.md) — top 20 AI prompts used in the build sprint
