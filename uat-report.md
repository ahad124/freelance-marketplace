# User Acceptance Test (UAT) Report — Freelance Marketplace

This report documents User Acceptance Testing performed against the capstone's defined acceptance
criteria (see [`SPECIFICATION.md`](SPECIFICATION.md)). It records the test environment, per-case
results with evidence, a severity-classified issue summary, and a release sign-off.

---

## 1. Test Environment

| Aspect | Detail |
|--------|--------|
| **Operating system** | macOS (Darwin 25.x) |
| **Browser** | Google Chrome (latest stable) |
| **Deployment method** | `docker compose up --build` — three containers (`web`, `api`, `db`) |
| **Frontend** | React 19 + Vite, served by Nginx at `http://localhost:3000` |
| **Backend API** | .NET 8 Web API at `http://localhost:5107` (`:8080` in-container) |
| **Database** | SQL Server 2022 (`mcr.microsoft.com/mssql/server:2022-latest`), `sqldata` volume |
| **External service** | Frankfurter API (`https://api.frankfurter.app`) |
| **Seed admin** | `admin@demo.test` / `Password123!` (seeded on startup) |
| **Automated suite** | `dotnet test` — **67/67 passing**, **88.3% line coverage** (excl. auto-generated migrations) |
| **Test date** | 2026-07-20 |

Each functional UAT case below is backed by a corresponding automated unit/integration test in
`backend/tests/FreelanceMarketplace.Tests`, executed as part of the 67-test suite. API cases were
additionally exercised manually against the running Docker stack.

---

## 2. Test Cases

| ID | Description | Expected Result | Actual Result | Status | Evidence / Notes |
|----|-------------|-----------------|---------------|--------|------------------|
| UAT-01 | Register a new Freelancer via `POST /api/auth/register` | 201 + JWT + user payload | 201 + JWT returned | ✅ Pass | `AuthEndpointsTests` |
| UAT-02 | Log in with valid credentials `POST /api/auth/login` | 200 + JWT + user payload | 200 + JWT + user payload | ✅ Pass | Token used for subsequent cases |
| UAT-03 | Access a protected route with **no** token | 401 Unauthorized | 401 Unauthorized | ✅ Pass | JWT bearer challenge |
| UAT-04 | Access a protected route with a **tampered** token | 401 Unauthorized | 401 Unauthorized | ✅ Pass | Signature validation rejects it |
| UAT-05 | Freelancer attempts `POST /api/jobs` (Client-only) | 403 Forbidden | 403 Forbidden | ✅ Pass | RBAC via `[Authorize(Roles)]` |
| UAT-06 | Client creates a job with title/budget/currency | 201 + job object | 201 + job object | ✅ Pass | `JobEndpointsTests` |
| UAT-07 | List jobs with filters `GET /api/jobs?search=react&category=Web Development` | Filtered list | Filtered list | ✅ Pass | Search + category + budget filters |
| UAT-08 | Non-owner Client updates another's job `PUT /api/jobs/{id}` | 403 Forbidden | 403 Forbidden | ✅ Pass | Ownership check in `JobService` |
| UAT-09 | Owning Client deletes their job `DELETE /api/jobs/{id}` | 204 No Content | 204 No Content | ✅ Pass | Soft/hard delete verified |
| UAT-10 | Freelancer submits a proposal `POST /api/proposals` | 201 + proposal | 201 + proposal | ✅ Pass | `ProposalEndpointsTests` |
| UAT-11 | Freelancer submits a **duplicate** active proposal to same job | 409 Conflict | 409 Conflict | ✅ Pass | Duplicate guard in `ProposalService` |
| UAT-12 | Freelancer withdraws a proposal `POST /api/proposals/{id}/withdraw` | 200, status = Withdrawn (not deleted) | 200, status = Withdrawn | ✅ Pass | Soft-delete preserves record |
| UAT-13 | Upload a file `POST /api/files` (multipart) | 200 + fileId | 200 + fileId | ✅ Pass | 5 MB + extension validation |
| UAT-14 | Download a file unauthenticated `GET /api/files/{id}` | 401 Unauthorized | 401 Unauthorized | ✅ Pass | `[Authorize]` on `FilesController` |
| UAT-15 | Convert currency `GET /api/currency/convert?amount=100&from=USD&to=EUR` | 200 + convertedAmount | 200 + convertedAmount | ✅ Pass | Frankfurter integration |
| UAT-16 | Repeat conversion is served from cache | Fast response, no upstream call | Cache hit (`IMemoryCache`) | ✅ Pass | 60-min cache |
| UAT-17 | Currency provider failure | Graceful fallback (rate 1.0), no error | Original amount returned, warning logged | ✅ Pass | `CurrencyServiceTests` |
| UAT-18 | Admin views metrics `GET /api/admin/metrics` | 200 + KPI payload (live DB counts) | 200 + KPIs | ✅ Pass | `AdminEndpointsTests` |
| UAT-19 | Freelancer attempts `GET /api/admin/metrics` | 403 Forbidden | 403 Forbidden | ✅ Pass | Admin-only controller |
| UAT-20 | Admin changes a user's role `POST /api/admin/users/{id}/role` | 200 + updated user | 200 + updated user | ✅ Pass | Admin dashboard UI + API |
| UAT-21 | Admin lists all users `GET /api/admin/users` | 200 + user list | 200 + user list | ✅ Pass | Manage Users tab |
| UAT-22 | Admin disables **their own** account | 400 Bad Request | 400 Bad Request | ✅ Pass | Self-disable guard |

**Result: 22 / 22 acceptance cases passed.**

---

## 3. Bug / Issue Summary

No blocking or high-severity defects were found. The following lower-severity issues were identified
during verification and are documented for transparency:

| ID | Issue | Severity | Status | Workaround / Notes |
|----|-------|----------|--------|--------------------|
| ISS-01 | `docker-compose.yml` injects `Jwt__Secret`, but the API binds `Jwt:SigningKey`. The compose value is therefore ignored and the app falls back to the **committed dev signing key** in `appsettings.json`. Tokens still sign/validate consistently, so functionality is unaffected. | Medium (security) | Open | Rename the compose env var to `Jwt__SigningKey` (and remove the dev key from source control) before any real deployment. |
| ISS-02 | Documentation drift: the original `docs/UAT.md` cited "61 tests" and `docs/PROMPTS.md #8` described a duplicate-proposal `400`, while the code returns `409 Conflict` and the suite now has **67 tests**. | Low (cosmetic) | Resolved | Corrected in this report and the AI collaboration log. |
| ISS-03 | Branch coverage is **57.4%**, below line coverage (88.3%). Some error-path branches (rare exception handlers, migration hooks) are unexercised. | Low | Accepted | Line coverage exceeds the 80% target; branch gaps are in low-risk plumbing. |
| ISS-04 | First `docker compose up` waits ~30 s for SQL Server to become healthy before the API starts. | Low (UX, expected) | By design | Documented in the README quick-start note. |

---

## 4. Sign-off

**Decision: ACCEPTED for release (capstone / educational deployment).**

Justification:
- **22/22** acceptance test cases pass, covering authentication, RBAC (401/403), full CRUD for two
  domain entities (Jobs, Proposals), file upload/download, the third-party currency integration with
  graceful failure, and all admin functions.
- The automated suite is green (**67/67**) with **88.3% line coverage**, exceeding the 80% target.
- No high or blocking defects remain. The one Medium item (**ISS-01**) is a configuration hardening
  task that does not affect functional behaviour but **must be remediated before any production
  (non-educational) deployment**.

Signed off by: Capstone author (AI-assisted) — 2026-07-20.
