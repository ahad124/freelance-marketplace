# Loom Video 1: Technical Walkthrough Script

**Duration:** ≤ 15 minutes  
**Project:** Freelance Marketplace — a simplified Upwork-style platform  

---

## 1. Introduction & Architecture Overview (2 min)

**🎥 Show:** Screen recording with the README and folder structure open.

> "Hi, I'm going to walk you through the **Freelance Marketplace** capstone project — a full-stack web application that connects freelancers with clients for job posting, proposals, milestone-based escrow payments, and an admin dashboard."

> "The architecture follows a classic three-tier design:"

- **Frontend:** React 19 + Vite + TypeScript SPA, styled with Tailwind CSS v3
- **Backend:** .NET 8 Web API (ASP.NET Core) with a controller → service → repository pattern
- **Database:** SQL Server 2022 running in Docker, accessed through EF Core 8 code-first
- **Orchestration:** Docker Compose wires together the API, SQL Server, and the Nginx-served frontend

> "All third-party integrations are mocked to run locally: MailHog for email capture, local filesystem for file storage, and the Frankfurter API for currency conversion."

**🎥 Show:** The `docker-compose.yml` file briefly.

---

## 2. Folder Structure (1.5 min)

**🎥 Show:** The project tree in VS Code.

```
freelance-marketplace/
├── backend/
│   ├── src/FreelanceMarketplace.Api/
│   │   ├── Controllers/        # 9 controllers: Auth, Jobs, Proposals, Contracts, Milestones, Admin, Currency, Files, Wallet
│   │   ├── Services/           # Business logic: Auth, Job, Proposal, Contract, Escrow, Admin, Currency, FileStorage, JwtToken
│   │   ├── Entities/           # AppUser, Job, Proposal, Contract, Milestone, LedgerEntry
│   │   ├── Dtos/               # Request/Response records
│   │   ├── Validation/         # FluentValidation validators
│   │   ├── Data/               # AppDbContext, DbSeeder, Migrations
│   │   ├── Middleware/         # Global exception handler
│   │   └── Common/             # Options, Roles, DI registration
│   └── tests/FreelanceMarketplace.Tests/
│       ├── Unit/               # 6 test files (service-level)
│       └── Integration/        # 8 test files (HTTP endpoint-level)
├── frontend/
│   └── src/
│       ├── views/              # Login, Register, JobList, JobDetails, JobForm, Dashboard, AdminDashboard
│       ├── components/         # Navbar, ProtectedRoute
│       ├── context/            # AuthContext, ThemeContext
│       └── utils/              # Axios API client
└── docs/                       # SPECIFICATION, UAT, coverage report, prompts
```

---

## 3. Database Schema & Entity Design (2.5 min)

**🎥 Show:** The Entities folder files and the `AppDbContext`.

> "Let's look at the data model. We have 6 main entities plus enums."

**Core Entities:**

| Entity | Key Properties | Purpose |
|--------|---------------|---------|
| **AppUser** | Extends IdentityUser, adds `DisplayName`, `PreferredCurrency`, `WalletBalance`, `IsDisabled` | User accounts with roles |
| **Job** | ClientId, Title, Description, Category, BudgetType/Amount/Currency, Status | Jobs posted by Clients |
| **Proposal** | JobId, FreelancerId, BidAmount, CoverLetter, DeliveryDate, Status | Freelancer bids on jobs |
| **Contract** | JobId, ProposalId, ClientId, FreelancerId, AgreedAmount, Status | Created when a proposal is accepted |
| **Milestone** | ContractId, Title, Amount, DueDate, Status | Work phases with escrow states |
| **LedgerEntry** | ContractId, MilestoneId, FromUserId, ToUserId, Amount, Type, BalanceAfter | Immutable audit trail for all escrow movements |

**Enums:** `BudgetType` (Fixed/Hourly), `JobStatus` (Open/InProgress/Closed), `ProposalStatus` (Submitted/Withdrawn/Accepted/Declined), `ContractStatus` (Active/Completed/Cancelled), `MilestoneStatus` (Unfunded/Escrowed/Submitted/Released), `LedgerEntryType` (Fund/Release/Refund)

**🎥 Show:** The `AppDbContext.cs` configuration — highlight the precision settings for amounts, the cascade delete rules, and the indexes on status columns.

> "Key design decisions in the schema:"
1. **Immutable Ledger** — every escrow transaction writes a `LedgerEntry` with `BalanceAfter`, creating an audit trail
2. **Decimal precision 18,2** — all monetary amounts use this precision
3. **Restrict deletes** — on most foreign keys to prevent accidental cascade data loss
4. **Status indexes** — on Job, Contract, and Milestone status columns for fast querying

---

## 4. Key Design Decisions (3 min)

### 4a. Service Layer Pattern

**🎥 Show:** The Services folder, specifically `EscrowService.cs` and `ContractService.cs`.

> "All business logic sits in service classes, not controllers. Controllers are thin — they parse requests and call services. This makes the logic testable without HTTP."

### 4b. Escrow / Milestone State Machine

**🎥 Show:** The `EscrowService.cs` — highlight `FundAsync`, `SubmitAsync`, `ReleaseAsync`, `RejectAsync`.

> "The milestone escrow flow is a strict state machine:"

```
Unfunded → [Client funds] → Escrowed → [Freelancer submits] → Submitted → [Client releases] → Released
                                          ↓
                                     [Client rejects] → Escrowed (back)
```

> "Each transition:"
1. Checks the current user's role and contract party status
2. Validates the current milestone state
3. Debits/credits wallet balances
4. Writes an immutable `LedgerEntry`
5. When all milestones are released, auto-completes the contract

### 4c. Authorization Strategy

**🎥 Show:** The `Roles.cs` and an example like `ProposalsController.cs`.

> "Authorization is layered:"
1. **Role-based** — `[Authorize(Roles = Roles.Client)]` on endpoints
2. **Resource-based** — ownership checks in services (e.g., only the job owner can accept proposals)
3. **CurrentUser abstraction** — `ICurrentUser` wraps `HttpContext` for testability

### 4d. Third-Party API Integration (Frankfurter Currency)

**🎥 Show:** `CurrencyService.cs`.

> "We integrate the Frankfurter API for live currency conversion. Key design:"
- **Interface:** `ICurrencyService` for testability
- **Caching:** 60-minute in-memory cache via `IMemoryCache`
- **Graceful degradation:** On API failure or timeout, falls back to returning the original amount
- **Timeout safety:** 5-second timeout with linked cancellation tokens

### 4e. Exception Handling

**🎥 Show:** `AppException.cs` and `ExceptionHandlingMiddleware.cs`.

> "Domain errors use a custom `AppException` with HTTP status codes. The middleware catches these and renders RFC 7807 ProblemDetails JSON responses. Unexpected errors return 500 with no internal details leaked."

### 4f. File Storage Abstraction

**🎥 Show:** `FileStorage.cs`.

> "File storage is behind an `IFileStorage` interface — currently local filesystem, but swappable to cloud storage. Validates file extension (7 allowed types) and size (5 MB max)."

---

## 5. Request Lifecycle Example (1.5 min)

**🎥 Show:** Walk through the "accept proposal" flow across files.

> "Let's trace one complete flow: **Client accepts a proposal.**"

1. React sends `POST /api/proposals/{id}/accept` with JWT in Authorization header
2. ASP.NET middleware authenticates, checks `[Authorize(Roles = Client,Admin)]`
3. `ProposalsController.Accept()` calls `ProposalService.AcceptAsync()`
4. `AcceptAsync`:
   - Finds proposal + job
   - Verifies caller owns the job
   - Checks proposal is `Submitted` and job is `Open`
   - Sets proposal → `Accepted`, job → `InProgress`
   - Auto-declines all other proposals on that job
   - Creates a new `Contract` linking Client + Freelancer
   - Saves all inside a single EF Core transaction
5. Returns `ProposalDto` with status `Accepted`

---

## 6. Test Suite & Coverage Report (3 min)

**🎥 Show:** Run `dotnet test` in the terminal, then open the coverage report.

> "We have **58 tests** — all green — split between unit and integration tests."

### Unit Tests (6 files)

| File | What it tests |
|------|---------------|
| `EscrowServiceTests.cs` | Fund, Submit, Release, insufficient balance, authorization |
| `CurrencyServiceTests.cs` | API response parsing, caching, timeout fallback, same-currency short-circuit |
| `JobServiceQueryTests.cs` | Open job listing with projection |
| `AdminServiceTests.cs` | Role changes, disable/enable, metrics aggregation |
| `JwtTokenServiceTests.cs` | Claim embedding, expiry, multi-role support |
| `FileStorageTests.cs` | Save, get, delete, file size limit, extension validation |

### Integration Tests (8 files)

| File | What it covers |
|------|----------------|
| `AuthEndpointsTests.cs` | Register (valid, duplicate, weak password, wrong role), Login, Me |
| `JobEndpointsTests.cs` | List, create, update, delete, authorization, search/filter |
| `ProposalEndpointsTests.cs` | Create, duplicate, closed job, accept, decline, withdraw, authorization |
| `ContractEndpointsTests.cs` | Full workflow: accept → contract → milestones → fund → submit → release → wallet |
| `AdminEndpointsTests.cs` | Metrics, list users, change role, suspend, self-disable guard |
| `CurrencyEndpointsTests.cs` | Convert endpoint, authorization |
| `FileEndpointsTests.cs` | Upload, download, invalid extension, authorization |

### Coverage Report

**🎥 Show:** The `Summary.txt` and highlight key numbers.

| Metric | Value |
|--------|-------|
| **Line coverage** | **86.1%** (967 covered / 1123 coverable) |
| **Method coverage** | **93.3%** (226 of 242 methods) |
| **Branch coverage** | 57.4% |
| **Fully covered methods** | 85.5% |

> "Key classes at 100%: `AppDbContext`, `Roles`, `JwtTokenService`, `CurrentUser`, all validators, all DTOs, `AdminController`, `CurrencyController`, `ServiceCollectionExtensions`."

> "Areas for improvement: `ExceptionHandlingMiddleware` (78.7%), `FileStorage.GetAsync` content-type branching (25%), `EscrowService.RejectAsync` (0% — no test yet), `ProposalService.UpdateAsync` partial coverage."

---

## 7. How to Run & Demo (0.5 min)

**🎥 Show:** Quick scroll through README.

> "To run: `docker compose up --build` from root. This starts SQL Server, the .NET API on port 5107, and the React frontend served by Nginx on port 3000."

> "Seed accounts: `admin@demo.test` / `Password123!`, `client@demo.test`, `freelancer1@demo.test`."

> "For testing locally: `cd backend && dotnet test` — generates coverage with coverlet."

---

## 8. Summary (0.5 min)

> "In summary, this project delivers a complete freelance marketplace with:"
1. **Full CRUD for jobs and proposals** with search/filter
2. **Role-based access control** with 3 roles
3. **Milestone-based escrow payments** with immutable ledger audit trail
4. **Admin dashboard** with metrics, user management, and moderation
5. **Currency conversion** via Frankfurter API with caching and graceful fallback
6. **58 passing tests** at 86.1% line coverage

> "Thanks for watching!"

---

## Appendix: Quick Reference for Recording

| Section | Time | Slides/Files to Show |
|---------|------|----------------------|
| 1. Intro & Architecture | 2 min | README, docker-compose.yml |
| 2. Folder Structure | 1.5 min | Full project tree in VS Code |
| 3. Database Schema | 2.5 min | Entities folder, AppDbContext.cs |
| 4a. Service Layer | 1 min | Services folder, EscrowService.cs |
| 4b. Escrow State Machine | 1 min | EscrowService methods |
| 4c. Authorization | 1 min | Roles.cs, ProposalsController.cs |
| 4d. Currency API | 1 min | CurrencyService.cs |
| 4e. Exception Handling | 0.5 min | AppException.cs, Middleware |
| 4f. File Storage | 0.5 min | FileStorage.cs |
| 5. Request Lifecycle | 1.5 min | ProposalsController → ProposalService |
| 6. Tests & Coverage | 3 min | Terminal (dotnet test), coverage report |
| 7. How to Run | 0.5 min | README quick start |
| 8. Summary | 0.5 min | — |

