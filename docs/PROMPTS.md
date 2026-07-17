# AI Prompts — Capstone Build Sprint

Top 20 prompts used during AI-assisted development of the Freelance Marketplace.

---

## Architecture & Scaffolding

**1. Initial scaffold**
> "Scaffold a .NET 8 Web API solution with EF Core 8 + SQL Server, a Vite+React+TypeScript frontend, and a `.gitignore`. Place everything under `~/freelance-marketplace/`. Use a single solution file at `backend/FreelanceMarketplace.sln`."

**2. Entity and DbContext design**
> "Create `AppUser`, `Job`, and `Proposal` entities with appropriate navigation properties and constraints. Configure them in `AppDbContext` using Fluent API — set max lengths, required fields, cascade-delete, and unique indices where appropriate."

**3. Identity and JWT wiring**
> "Add ASP.NET Core Identity with `AppUser`, configure JWT Bearer authentication, and create a `JwtTokenService` that generates signed tokens with role and sub claims. Register everything cleanly via a `ServiceCollectionExtensions.AddServices()` method."

---

## Authentication

**4. Register endpoint with role guard**
> "Implement `POST /api/auth/register`. Accept email, password, displayName, role, and preferredCurrency. Reject any role not in `Roles.SelfAssignable`. Return an `AuthResponse` with a JWT and user payload on success."

**5. Login with disabled-account guard**
> "Implement `POST /api/auth/login`. Check the user's `IsDisabled` flag first — if true, return 403. On success, return the same `AuthResponse` shape used by register."

**6. Auth integration tests — seeded admin**
> "Write integration tests for the auth endpoints. For admin-only routes, do not register a new admin — instead log in as the pre-seeded `admin@demo.test` / `Password123!` user and use that JWT."

---

## Jobs & Proposals CRUD

**7. Jobs controller with ownership checks**
> "Implement `JobsController` with full CRUD. Enforce that only the owning Client (or Admin) can update or delete a job. Add a `GET /api/jobs` that accepts `search`, `category`, `minBudget`, `maxBudget` query params."

**8. Proposal duplicate guard**
> "In `ProposalService.CreateAsync`, check whether the requesting freelancer already has an active (non-withdrawn) proposal for the same job and throw `AppException(409)` if so."

**9. Proposal withdraw endpoint**
> "Add `POST /api/proposals/{id}/withdraw`. Only the owning freelancer may withdraw. Change status to `Withdrawn` — do not hard-delete the record."

---

## File Storage

**10. File storage service**
> "Create `IFileStorage` and `FileStorage`. Validate file extensions (`.jpg`, `.jpeg`, `.png`, `.pdf`, `.zip`, `.txt`, `.docx`) and max size (5 MB). Store files on disk with a GUID prefix, return the stored filename as a file-ID."

**11. Authenticated file download**
> "Add `GET /api/files/{id}` protected by `[Authorize]`. Stream the file back with the correct `Content-Type` and a `Content-Disposition: attachment` header derived from the original filename suffix."

---

## Currency Integration

**12. Resilient currency service**
> "Implement `CurrencyService` that hits `https://api.frankfurter.app/latest?from={from}&to={to}`. Cache successful responses in `IMemoryCache` for 1 hour. On timeout or any exception, log a warning and return a fallback rate of 1.0 (same amount)."

**13. Currency mock for integration tests**
> "In `CustomWebApplicationFactory`, replace the real `ICurrencyService` with a Moq mock that always returns a fixed rate of 1.25. This avoids flaky tests caused by network calls."

---

## Admin Dashboard

**14. Admin metrics aggregation**
> "Implement `GET /api/admin/metrics` returning: totalUsers, openJobs, totalJobs, totalProposals, usersByRole dictionary, and recentSignups (users created in the last 7 days). Restrict the endpoint to `Admin` role."

**15. User suspension with self-disable guard**
> "Implement `POST /api/admin/users/{id}/toggle-status`. Accept `{ isDisabled: bool }`. If the admin is trying to disable their own account, return 400 with message 'Cannot disable your own account'."

---

## Frontend

**16. Axios JWT interceptor**
> "Create an Axios instance with a request interceptor that reads the token from `localStorage` and sets `Authorization: Bearer {token}`. Add a response interceptor that clears storage and redirects to `/login` on 401."

**17. AuthContext with localStorage persistence**
> "Create a React Context that reads `token` and `user` from `localStorage` on mount. Expose `login(token, user)`, `logout()`, and `updateUser(user)` actions that keep state and `localStorage` in sync."

**18. JobList with live currency conversion**
> "In the JobList view, for every job card use a `ConvertedAmount` component that calls `GET /api/currency/convert` via TanStack Query (staleTime 30 min). Show the converted amount in the user's preferred currency with the original as a footnote."

**19. AdminDashboard with role-change dropdowns**
> "Create an AdminDashboard with two tabs: Metrics (KPI cards + progress bars by role + recent signups table) and Manage Users (table with inline role `<select>` that calls `/api/admin/users/{id}/role` on change, and a Suspend/Enable toggle button)."

---

## DevOps

**20. One-command Docker Compose**
> "Write `docker-compose.yml` with three services: `db` (SQL Server 2022 with health check), `api` (.NET 8 built from `Dockerfile.api`, waits for db healthy, injects connection string and JWT secret via env vars), and `web` (React+Nginx built from `Dockerfile.web`, proxies `/api/*` to `api:8080`). The app should be reachable at `http://localhost:3000`."
