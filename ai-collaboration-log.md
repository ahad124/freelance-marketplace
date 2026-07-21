# AI Collaboration Log — Freelance Marketplace

This log records the **top 20 prompts** used across the entire capstone — planning, backend and
frontend implementation, testing, DevOps, and documentation. For each entry it captures the *phase*,
the *exact prompt*, the *purpose*, and the *outcome* (accepted as-is / modified / rejected), with
enough detail to show critical engagement with the AI's output rather than blind acceptance.

Phases covered: **Planning · Backend · Frontend · Testing · DevOps · Documentation** (6 phases).

---

### 1. Planning — Project decomposition
> **Prompt:** "I'm building an Upwork-style freelance marketplace as a .NET 8 + React capstone. Break the scope into a build order that lets me demo end-to-end early: list the entities, the roles, and the sequence of vertical slices (auth → jobs → proposals → files → currency → admin) I should implement, and flag which acceptance criteria each slice satisfies."

- **Purpose:** Turn a vague brief into an ordered backlog of vertical slices mapped to acceptance criteria.
- **Outcome:** **Accepted with edits.** The slice order was adopted as-is; I reordered "file upload" after proposals because attachments depended on the job/proposal entities existing first.

### 2. Planning — Data model design
> **Prompt:** "Design `AppUser`, `Job`, and `Proposal` entities with navigation properties and constraints. Configure them in `AppDbContext` with the Fluent API — max lengths, required fields, cascade-delete, and a unique index that prevents a freelancer from having two active proposals on the same job."

- **Purpose:** Get a correct relational model with integrity rules encoded at the DB level.
- **Outcome:** **Modified.** Kept the entities and Fluent config; changed the "unique index" to a service-level check because the uniqueness needed to ignore *withdrawn* proposals, which a plain unique index can't express.

### 3. Backend — Identity + JWT wiring
> **Prompt:** "Add ASP.NET Core Identity with `AppUser`, configure JWT Bearer authentication validating issuer/audience/lifetime/signing-key, and create a `JwtTokenService` that emits tokens with `sub` and `role` claims. Register everything via a single `ServiceCollectionExtensions.AddServices()` method."

- **Purpose:** Establish the auth backbone and a clean DI composition root.
- **Outcome:** **Accepted.** Used nearly verbatim; the `AddServices()` extension became the project's DI convention that every later feature followed.

### 4. Backend — Register endpoint with role guard
> **Prompt:** "Implement `POST /api/auth/register` accepting email, password, displayName, role, preferredCurrency. Reject any role not in `Roles.SelfAssignable` (so Admin can't be self-granted). Return an `AuthResponse` with a JWT and user payload."

- **Purpose:** Secure registration while preventing privilege escalation to Admin.
- **Outcome:** **Accepted.** The `Roles.SelfAssignable` allow-list pattern was reused when seeding the Admin account separately.

### 5. Backend — Jobs CRUD with ownership
> **Prompt:** "Implement `JobsController` with full CRUD. Only the owning Client (or an Admin) may update or delete a job. Add `GET /api/jobs` accepting `search`, `category`, `minBudget`, `maxBudget` query params. Put the ownership and filter logic in `JobService`, keep the controller thin."

- **Purpose:** Build the primary CRUD entity with authorization beyond simple role checks.
- **Outcome:** **Accepted.** Reinforced the thin-controller/fat-service split later formalised in [ADR-003](adr/003-layered-service-architecture.md).

### 6. Backend — Duplicate proposal guard (semantics correction)
> **Prompt:** "In `ProposalService.CreateAsync`, if the freelancer already has an active (non-withdrawn) proposal for the same job, reject it. What's the most correct HTTP status for this?"

- **Purpose:** Enforce the one-active-proposal rule with correct REST semantics.
- **Outcome:** **Modified — rejected the AI's first answer.** The AI initially returned `400 Bad Request`; I pushed back and we changed it to **`409 Conflict`**, which correctly signals a state conflict rather than malformed input. (The stale `400` in the original prompt notes is corrected here.)

### 7. Backend — Soft-delete on withdraw
> **Prompt:** "Add `POST /api/proposals/{id}/withdraw`. Only the owning freelancer may withdraw. Set status to `Withdrawn` — do not hard-delete, because clients and admins still need the audit trail."

- **Purpose:** Preserve history while removing a proposal from active flows.
- **Outcome:** **Accepted.** The soft-delete decision later interacted with the duplicate guard (withdrawn proposals don't block re-applying).

### 8. Backend — File storage service
> **Prompt:** "Create `IFileStorage` / `FileStorage`. Validate extension (`.jpg .jpeg .png .pdf .zip .txt .docx`) and a 5 MB max size, store on disk with a GUID prefix, and return the stored filename as the file-ID. Then add `GET /api/files/{id}` behind `[Authorize]` that streams the file with the right `Content-Type` and `Content-Disposition`."

- **Purpose:** Local file persistence with validation and authenticated retrieval.
- **Outcome:** **Modified.** Accepted the service; hardened it by rejecting path traversal in the supplied filename, which the first version didn't guard against.

### 9. Backend — Resilient currency integration
> **Prompt:** "Implement `CurrencyService` hitting `https://api.frankfurter.app/latest?from={from}&to={to}`. Cache successes in `IMemoryCache` for 1 hour. On timeout or any exception, log a warning and fall back to a rate of 1.0 so the caller still gets a value. Bound each call with a 5-second timeout."

- **Purpose:** Add a meaningful third-party integration that can't take down the app.
- **Outcome:** **Accepted.** Became [ADR-004](adr/004-resilient-external-currency-integration.md); the timeout was implemented with a linked `CancellationTokenSource`.

### 10. Backend — Admin metrics aggregation
> **Prompt:** "Implement `GET /api/admin/metrics` returning totalUsers, openJobs, totalJobs, totalProposals, a usersByRole dictionary, and recentSignups (users created in the last 7 days). Restrict to Admin. Make sure the query doesn't cause N+1s."

- **Purpose:** Live-data admin summary from the database.
- **Outcome:** **Modified.** Reshaped the AI's LINQ to run grouped counts in fewer round-trips after reviewing the generated SQL.

### 11. Backend — Self-disable guard
> **Prompt:** "Implement `POST /api/admin/users/{id}/toggle-status` accepting `{ isDisabled: bool }`. If an admin tries to disable their own account, return 400 with 'Cannot disable your own account'."

- **Purpose:** Prevent an admin from locking themselves out.
- **Outcome:** **Accepted.** Added as UAT-22.

### 12. Backend — Global exception handling
> **Prompt:** "Create an `AppException(statusCode, message)` type and an `ExceptionHandlingMiddleware` that maps it to a consistent JSON problem response, so services can throw for business-rule violations instead of returning HTTP concerns."

- **Purpose:** Centralise error-to-HTTP translation and keep services HTTP-agnostic.
- **Outcome:** **Accepted.** This is the mechanism that let controllers stay thin ([ADR-003](adr/003-layered-service-architecture.md)).

### 13. Frontend — Axios JWT interceptor
> **Prompt:** "Create an Axios instance with a request interceptor that reads the token from localStorage and sets `Authorization: Bearer {token}`, plus a response interceptor that clears storage and redirects to `/login` on any 401."

- **Purpose:** Attach auth transparently and handle expiry globally.
- **Outcome:** **Accepted.** Every service call inherited auth without per-call code.

### 14. Frontend — AuthContext with persistence
> **Prompt:** "Create a React Context that hydrates `token` and `user` from localStorage on mount and exposes `login(token, user)`, `logout()`, and `updateUser(user)` actions that keep state and localStorage in sync."

- **Purpose:** App-wide auth state surviving refreshes.
- **Outcome:** **Accepted.** Paired with a `ProtectedRoute` guard component.

### 15. Frontend — Live currency conversion on job cards
> **Prompt:** "In the JobList view, render each job's budget in the user's preferred currency using a `ConvertedAmount` component that calls `GET /api/currency/convert` via TanStack Query with a 30-minute staleTime, showing the original amount as a footnote."

- **Purpose:** Surface the currency feature in the primary UI meaningfully.
- **Outcome:** **Modified.** Kept the component but lifted the query key to include the currency pair so cache entries didn't collide between jobs.

### 16. Testing — Integration test harness
> **Prompt:** "Set up a `CustomWebApplicationFactory` for integration tests that swaps SQL Server for in-memory SQLite and replaces the real `ICurrencyService` with a Moq mock returning a fixed 1.25 rate, so tests are hermetic and never hit the network."

- **Purpose:** Fast, deterministic HTTP-level tests without external dependencies.
- **Outcome:** **Accepted.** This harness backs the AdminEndpoints/AuthEndpoints/etc. suites.

### 17. Testing — Seeded-admin auth tests
> **Prompt:** "Write integration tests for the auth endpoints. For admin-only routes, don't register a new admin — log in as the pre-seeded `admin@demo.test` / `Password123!` and reuse that JWT. Include a case for a tampered token returning 401 and a Freelancer hitting an admin route returning 403."

- **Purpose:** Exercise the real seeded flow and both failure modes of auth.
- **Outcome:** **Accepted.** Produced UAT-04 and UAT-19.

### 18. Testing — Coverage measurement and reporting
> **Prompt:** "Show me how to run coverlet with `dotnet test --collect:\"XPlat Code Coverage\"` and generate an HTML report that excludes auto-generated EF migrations and the design-time factory, so the reported number reflects hand-written code."

- **Purpose:** Produce a defensible coverage figure (target ≥80%).
- **Outcome:** **Accepted, then independently re-verified.** I re-ran it during review: raw coverage is ~40% *including* migrations, but **88.3% excluding** the 2,287 lines of generated migrations — confirming the exclusion is legitimate, not cherry-picking.

### 19. DevOps — One-command Docker Compose + connection fix
> **Prompt:** "Write `docker-compose.yml` with `db` (SQL Server 2022 + health check), `api` (.NET 8, waits for db healthy, connection string + JWT via env), and `web` (React+Nginx proxying `/api` to the api). It's failing on startup with a SQL connection error — diagnose why the API can't reach the database."

- **Purpose:** Reproducible one-command stack and debugging the boot failure.
- **Outcome:** **Modified — key debugging win.** The AI spotted a connection-string env-key mismatch and I added a retry/backoff loop for the ~30 s SQL warm-up (commit `4ac91a1`). *Note:* a related env-key mismatch (`Jwt__Secret` vs `Jwt:SigningKey`) survived and is logged as ISS-01 in the [UAT report](uat-report.md).

### 20. Documentation — ADRs and architecture diagram
> **Prompt:** "From the actual code, draft Michael-Nygard-style ADRs for the four real decisions — EF Core/SQL Server, JWT+Identity RBAC, the layered service architecture, and the resilient currency integration — with project-specific consequences and cross-references, plus a GitHub-renderable Mermaid diagram of the three-tier system and the login sequence."

- **Purpose:** Capture *why* decisions were made and visualise the system for onboarding.
- **Outcome:** **Modified.** Accepted the structure but rewrote consequences to cite real specifics (the 88.3% coverage enabler, the SQL warm-up retry, the `Jwt__Secret` issue) instead of generic trade-offs, and verified the Mermaid rendered on GitHub.
