# Freelance Marketplace — Specification Document

> A simplified Upwork-style platform connecting freelancers with clients: job posting, proposals, messaging, escrow-inspired milestone tracking, and reviews.
> **Capstone deliverable.** All components run locally (no cloud): .NET 8 Web API, SQL Server (Docker), React (Vite) dev server, and Docker for mock services.

**Document version:** 1.0
**Author:** ahad124
**Status:** Draft for approval (gates the Build Sprints)

---

## Table of Contents

1. [Project Overview & Scope Statement](#1-project-overview--scope-statement)
2. [User Stories](#2-user-stories)
3. [Use Cases](#3-use-cases)
4. [Gherkin Acceptance Criteria (Top 5 Stories)](#4-gherkin-acceptance-criteria-top-5-stories)
5. [Technical Specification](#5-technical-specification)
6. [Implementation Plan](#6-implementation-plan)
7. [Appendix: Traceability Matrix](#7-appendix-traceability-matrix)

---

## 1. Project Overview & Scope Statement

### 1.1 Problem Statement
Independent freelancers and the clients who hire them need a trustworthy, structured place to meet, agree on scope, exchange work, and get paid safely. Ad-hoc arrangements (email, chat, invoices) lack accountability: there is no shared record of the agreement, no protection of funds until work is delivered, and no reputation signal to guide future hiring decisions. This project delivers a **simplified freelance marketplace** that solves those gaps with job posting, competitive proposals, in-app messaging, **milestone-based escrow-inspired payment tracking**, and a two-sided review system.

### 1.2 Vision
Provide a demonstrable, end-to-end local web application where a **Client** can post a job, receive and accept **Proposals**, form a **Contract** with **Milestones**, communicate with the hired **Freelancer**, release milestone payments through a **simulated escrow ledger**, and leave a **Review** — all moderated by an **Admin**.

### 1.3 Target Users (Actors)
| Actor | Description | Primary Goals |
|-------|-------------|---------------|
| **Freelancer** | Registered service provider | Find jobs, submit proposals, deliver milestones, get paid, build reputation |
| **Client** | Registered job poster / employer | Post jobs, evaluate proposals, hire, fund & release milestones, review work |
| **Admin** | Platform operator | Moderate users, jobs, proposals & reviews; resolve disputes; monitor platform health |
| **Guest** | Unauthenticated visitor | Browse public jobs, register / log in |

### 1.4 In Scope
- Account registration, login, and role-based access (Freelancer / Client / Admin).
- Freelancer and Client profiles (bio, skills, hourly rate, portfolio links).
- Job posting, editing, closing; job browsing with **search & filter** (keyword, category, budget).
- Proposal submission (cover letter, bid amount, estimated delivery), listing, withdrawal.
- Hiring: accepting a proposal creates a **Contract**.
- **Milestone tracking** with a **simulated escrow ledger** (fund → in-progress → submitted → released).
- 1:1 **messaging** threads between contract parties.
- Two-sided **reviews & ratings** upon contract completion.
- **Admin panel**: user management, content moderation, disputes, metrics dashboard.
- Local/mock integrations: email (Docker SMTP), payment simulation, file storage simulation.

### 1.5 Out of Scope
- Real money movement or live payment gateways (Stripe/PayPal). Payments are **simulated** via an internal ledger.
- Any cloud deployment or external hosting — the system must run entirely on a local machine.
- Native mobile applications (web responsive only).
- Advanced features: video calls, AI matching, multi-currency, tax/invoicing compliance, dispute arbitration workflows beyond a basic admin view.
- Third-party OAuth social logins (email/password + JWT only).

### 1.6 Success Criteria
1. A full happy-path demo runs locally: **register → post job → propose → hire → milestone release → review**.
2. All three roles are enforced; unauthorized actions are rejected (401/403).
3. Milestone escrow states transition correctly and are auditable in the ledger.
4. Admin can suspend a user and moderate a job/review.
5. Mock email, payment, and storage services operate without any external network calls.
6. The top 5 user stories pass their Gherkin acceptance criteria during UAT.

---

## 2. User Stories

> Format: *As a … I want … so that …*. IDs (`US-xx`) are referenced by use cases, acceptance criteria, and the implementation plan. **Priority**: P0 (must), P1 (should), P2 (could). ★ marks the **Top 5** stories used for Gherkin criteria.

| ID | Priority | Story |
|----|----------|-------|
| **US-01** ★ | P0 | **As a** visitor, **I want** to register an account as a Freelancer or Client and log in, **so that** I can access role-appropriate features securely. |
| **US-02** ★ | P0 | **As a** Client, **I want** to post a job with a title, description, category, and budget, **so that** freelancers can discover and bid on my work. |
| **US-03** ★ | P0 | **As a** Freelancer, **I want** to browse and search/filter open jobs by keyword, category, and budget, **so that** I can find work that matches my skills. |
| **US-04** ★ | P0 | **As a** Freelancer, **I want** to submit a proposal with a cover letter, bid amount, and estimated delivery, **so that** I can compete to be hired for a job. |
| **US-05** ★ | P0 | **As a** Client, **I want** to review proposals and accept one to hire a freelancer, **so that** a contract is created and work can begin. |
| US-06 | P0 | **As a** Client, **I want** to create milestones on a contract and fund them into escrow, **so that** payment is committed and released only as work is approved. |
| US-07 | P0 | **As a** Freelancer, **I want** to submit a milestone as complete and receive the released funds, **so that** I get paid for delivered work. |
| US-08 | P1 | **As a** contract party (Client or Freelancer), **I want** to exchange messages in a thread tied to the contract, **so that** we can coordinate work in one place. |
| US-09 | P1 | **As a** contract party, **I want** to leave a rating and written review after a contract completes, **so that** reputation informs future hiring. |
| US-10 | P1 | **As an** Admin, **I want** to suspend/verify users and moderate jobs, proposals, and reviews, **so that** the platform stays safe and trustworthy. |
| US-11 | P2 | **As a** Freelancer or Client, **I want** to manage my profile (bio, skills, rate, portfolio), **so that** counterparties can assess my suitability. |
| US-12 | P2 | **As a** user, **I want** email notifications for key events (new proposal, hired, milestone released), **so that** I stay informed without polling the app. |

---

## 3. Use Cases

### UC-1 — Post a Job
- **Actor:** Client (authenticated)
- **Related stories:** US-02
- **Preconditions:** Client is logged in with a Client role; email verified.
- **Main Flow:**
  1. Client navigates to "Post a Job".
  2. Client enters title, description, category, budget type (fixed/hourly) and amount, required skills.
  3. System validates the form (required fields, budget > 0).
  4. Client submits.
  5. System persists the job with status `Open` and displays it in the Client's dashboard and public job listing.
- **Alternate / Exception Flows:**
  - **3a. Validation fails:** System highlights invalid fields; job is not saved.
  - **2a. Save as draft:** Client saves a `Draft` job, visible only to the Client, not listed publicly.
  - **5a. Unauthorized role:** A Freelancer attempting this route receives 403 and is redirected.

### UC-2 — Submit a Proposal
- **Actor:** Freelancer (authenticated)
- **Related stories:** US-04
- **Preconditions:** Freelancer is logged in; the target job exists and is `Open`.
- **Main Flow:**
  1. Freelancer opens an open job's detail page.
  2. Freelancer clicks "Submit Proposal".
  3. Freelancer enters cover letter, bid amount, and estimated delivery date.
  4. System validates (bid > 0, delivery in the future, no existing active proposal on this job).
  5. Freelancer submits.
  6. System stores the proposal with status `Submitted` and notifies the Client (mock email).
- **Alternate / Exception Flows:**
  - **4a. Duplicate proposal:** System blocks a second active proposal on the same job and shows a message.
  - **4b. Job closed mid-flow:** If the job is no longer `Open`, submission is rejected with an explanation.
  - **6a. Withdraw:** Freelancer later withdraws; proposal moves to `Withdrawn`.

### UC-3 — Hire a Freelancer & Create Milestones
- **Actor:** Client (authenticated)
- **Related stories:** US-05, US-06
- **Preconditions:** Client owns a job with ≥1 `Submitted` proposal.
- **Main Flow:**
  1. Client reviews proposals on their job.
  2. Client accepts one proposal.
  3. System creates a `Contract` (Client + Freelancer + job), sets the job to `In Progress`, and marks other proposals `Declined`.
  4. Client defines one or more milestones (title, amount, due date).
  5. Client "funds" each milestone; the **simulated escrow ledger** debits the Client's mock balance and holds the amount in `Escrowed` state.
  6. System notifies the Freelancer (mock email).
- **Alternate / Exception Flows:**
  - **5a. Insufficient mock balance:** Funding is rejected; milestone stays `Unfunded`.
  - **2a. No acceptable proposal:** Client closes the job instead; proposals are declined.
  - **3a. Concurrency:** If the proposal was withdrawn just before acceptance, system reports it and refreshes the list.

### UC-4 — Release a Milestone Payment (Simulated Escrow)
- **Actor:** Client (authenticated); trigger from Freelancer submission
- **Related stories:** US-06, US-07
- **Preconditions:** An active contract exists with at least one `Escrowed` milestone.
- **Main Flow:**
  1. Freelancer marks a milestone `Submitted` (optionally attaching a deliverable file via mock storage).
  2. System notifies the Client.
  3. Client reviews the deliverable and approves.
  4. System transitions the milestone `Escrowed → Released`; the ledger credits the Freelancer's mock balance and records an immutable ledger entry.
  5. When all milestones are `Released`, the contract becomes `Completed` and both parties are prompted to review.
- **Alternate / Exception Flows:**
  - **3a. Request changes:** Client rejects; milestone returns to `InProgress` with a note; funds remain escrowed.
  - **4a. Dispute:** Either party opens a dispute; milestone moves to `Disputed` and appears in the Admin panel; funds stay held.
  - **1a. Not funded:** A milestone that is `Unfunded` cannot be submitted for release.

### UC-5 — Messaging Thread
- **Actor:** Client and Freelancer (authenticated contract parties)
- **Related stories:** US-08
- **Preconditions:** A contract exists linking the two parties.
- **Main Flow:**
  1. A party opens the contract's Messages tab.
  2. Party types and sends a message.
  3. System persists the message and displays it in the thread in chronological order.
  4. The counterparty sees the new message (on refresh/poll) and an unread indicator; a mock email digest may be sent.
- **Alternate / Exception Flows:**
  - **2a. Empty message:** Blank sends are blocked.
  - **1a. Non-party access:** A user who is not on the contract receives 403.
  - **3a. Attachment:** Party attaches a file; it is stored via the mock storage service and linked in the message.

### UC-6 — Admin Moderation (Supporting)
- **Actor:** Admin (authenticated)
- **Related stories:** US-10
- **Preconditions:** Admin is logged in with the Admin role.
- **Main Flow:**
  1. Admin opens the Admin panel.
  2. Admin views users, jobs, proposals, reviews, and disputes.
  3. Admin suspends a user, hides a job, or removes a review that violates policy.
  4. System applies the action and logs it in an audit trail.
- **Alternate / Exception Flows:**
  - **3a. Reinstate:** Admin lifts a suspension; the user regains access.
  - **2a. Dispute resolution:** Admin views a `Disputed` milestone and records a resolution note (release or refund in the simulated ledger).

---

## 4. Gherkin Acceptance Criteria (Top 5 Stories)

### US-01 — Register & Log In
```gherkin
Feature: Account registration and login

  Scenario: Successful registration as a Freelancer
    Given I am an unauthenticated visitor on the registration page
    When I submit a valid email, a strong password, and select the "Freelancer" role
    Then my account is created with the Freelancer role
    And I receive a mock verification email
    And I am redirected to my Freelancer dashboard

  Scenario: Login with valid credentials issues a JWT
    Given I have a verified account with email "dev@local.test"
    When I log in with the correct email and password
    Then the API returns a JWT access token and a refresh token
    And subsequent requests with the token are authorized

  Scenario: Registration rejected for a duplicate email
    Given an account already exists with email "dev@local.test"
    When I try to register again with "dev@local.test"
    Then registration is rejected with a "email already in use" error
    And no new account is created

  Scenario: Login fails with wrong password
    Given I have a verified account with email "dev@local.test"
    When I log in with an incorrect password
    Then I receive a 401 Unauthorized response
    And no token is issued
```

### US-02 — Post a Job
```gherkin
Feature: Posting a job

  Scenario: Client posts a valid job
    Given I am logged in as a Client
    When I submit a job with title "Build a landing page", a description, category "Web", budget type "Fixed" and amount 500
    Then the job is saved with status "Open"
    And it appears in the public job listing and my dashboard

  Scenario: Job rejected for missing required fields
    Given I am logged in as a Client
    When I submit a job with an empty title
    Then the job is not saved
    And I see a validation error on the title field

  Scenario: Job rejected for non-positive budget
    Given I am logged in as a Client
    When I submit a job with budget amount 0
    Then the job is not saved
    And I see a validation error on the budget field

  Scenario: Freelancer cannot post a job
    Given I am logged in as a Freelancer
    When I attempt to open the "Post a Job" route
    Then I receive a 403 Forbidden response
```

### US-03 — Browse & Search Jobs
```gherkin
Feature: Browsing and searching jobs

  Scenario: Freelancer sees only open jobs
    Given there are jobs with statuses "Open", "Draft", and "Completed"
    When I view the public job listing as a Freelancer
    Then I see only the "Open" jobs

  Scenario: Search by keyword
    Given open jobs titled "React dashboard" and "Logo design" exist
    When I search for "React"
    Then I see "React dashboard"
    And I do not see "Logo design"

  Scenario: Filter by category and budget range
    Given open jobs exist across categories "Web" and "Design"
    When I filter by category "Web" and budget between 100 and 600
    Then only "Web" jobs with budgets in [100, 600] are shown

  Scenario: No results
    Given no open job matches "quantum blockchain"
    When I search for "quantum blockchain"
    Then I see an empty-state message and zero results
```

### US-04 — Submit a Proposal
```gherkin
Feature: Submitting a proposal

  Scenario: Freelancer submits a valid proposal
    Given I am logged in as a Freelancer
    And an open job "Build a landing page" exists
    When I submit a proposal with a cover letter, bid 450, and a future delivery date
    Then the proposal is saved with status "Submitted"
    And the job's Client receives a mock notification email

  Scenario: Duplicate active proposal blocked
    Given I already have a "Submitted" proposal on the job
    When I submit another proposal on the same job
    Then the submission is rejected with a "proposal already exists" message

  Scenario: Proposal rejected on a closed job
    Given the job status has changed to "In Progress"
    When I attempt to submit a proposal
    Then the submission is rejected with a "job is no longer open" message

  Scenario: Bid must be positive
    Given I am logged in as a Freelancer on an open job
    When I submit a proposal with bid 0
    Then the proposal is not saved
    And I see a validation error on the bid field
```

### US-05 — Accept a Proposal (Hire)
```gherkin
Feature: Hiring a freelancer by accepting a proposal

  Scenario: Client accepts a proposal and a contract is created
    Given I am the Client who owns a job with two "Submitted" proposals
    When I accept one proposal
    Then a Contract is created linking me and that Freelancer
    And the job status becomes "In Progress"
    And the other proposals are marked "Declined"
    And the hired Freelancer receives a mock notification email

  Scenario: Only the job owner can accept
    Given I am a Client who does NOT own the job
    When I attempt to accept a proposal on it
    Then I receive a 403 Forbidden response

  Scenario: Cannot accept a withdrawn proposal
    Given the proposal I want to accept was just "Withdrawn"
    When I attempt to accept it
    Then the action is rejected
    And the proposal list is refreshed to show its current state
```

---

## 5. Technical Specification

### 5.1 Architecture Overview

```
                        ┌───────────────────────────────────────────────┐
                        │                  Client Browser                │
                        └───────────────────────────────────────────────┘
                                            │  HTTPS (JWT Bearer)
                                            ▼
        ┌───────────────────────────────────────────────────────────────┐
        │            React 18 + Vite + TypeScript (SPA / SSR)            │
        │   Pages · TanStack Query (server state) · Axios (API client)   │
        │            Auth context (access + refresh tokens)             │
        └───────────────────────────────────────────────────────────────┘
                                            │  REST / JSON
                                            ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                  .NET 8 Web API (ASP.NET Core)                │
        │  Controllers  →  Services (business logic)  →  Repositories    │
        │  ─────────────────────────────────────────────────────────    │
        │  Auth (Identity + JWT) · Jobs · Proposals · Contracts ·        │
        │  Milestones/Escrow Ledger · Messaging · Reviews · Admin        │
        │  Cross-cutting: validation (FluentValidation), logging,        │
        │  global exception handling, role/authorization policies        │
        └───────────────────────────────────────────────────────────────┘
              │                    │                     │
              ▼                    ▼                     ▼
   ┌────────────────┐   ┌────────────────────┐   ┌────────────────────┐
   │  EF Core 8     │   │  Mock Integrations │   │  Mock Storage      │
   │  (code-first)  │   │  · SMTP (MailHog)  │   │  · Local FS / MinIO│
   │       │        │   │  · Payment Sim     │   │    (attachments,   │
   │       ▼        │   │    (escrow ledger) │   │     avatars)       │
   │ SQL Server 2022│   └────────────────────┘   └────────────────────┘
   │  (Docker)      │
   └────────────────┘

              All services orchestrated locally via Docker Compose.
```

**Request lifecycle (example — accept proposal):** React calls `POST /api/proposals/{id}/accept` with the JWT → `AuthorizationMiddleware` checks role/ownership policy → `ProposalsController` → `ContractService.HireAsync()` (transactional: create contract, update job & proposals) → `EF Core` persists → mock email queued → 200 with contract DTO → TanStack Query invalidates job/proposal caches.

### 5.2 Data Model (High-Level ERD)

```
User (Id, Email, PasswordHash, Role, Status, CreatedAt)
  └─1:1─ Profile (UserId, DisplayName, Bio, Skills, HourlyRate, PortfolioUrl, AvatarKey)

Job (Id, ClientId→User, Title, Description, Category, BudgetType, BudgetAmount, Status, CreatedAt)
  └─1:N─ Proposal (Id, JobId, FreelancerId→User, CoverLetter, BidAmount, DeliveryDate, Status, CreatedAt)

Contract (Id, JobId, ClientId, FreelancerId, Status, CreatedAt, CompletedAt)
  └─1:N─ Milestone (Id, ContractId, Title, Amount, DueDate, Status)     -- Unfunded|Escrowed|InProgress|Submitted|Released|Disputed
  └─1:N─ Message (Id, ContractId, SenderId→User, Body, AttachmentKey, CreatedAt, ReadAt)

LedgerEntry (Id, ContractId, MilestoneId, FromUserId, ToUserId, Amount, Type, BalanceAfter, CreatedAt)  -- Fund|Release|Refund
Review (Id, ContractId, AuthorId→User, TargetId→User, Rating 1-5, Comment, CreatedAt)
AuditLog (Id, AdminId→User, Action, EntityType, EntityId, Note, CreatedAt)
```

**Key relationships:** a `Job` has many `Proposals`; accepting one creates a `Contract`; a `Contract` has many `Milestones`, `Messages`, and (on completion) two `Reviews`; every escrow movement writes an immutable `LedgerEntry`.

### 5.3 Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | **.NET 8 Web API (ASP.NET Core)** | Controllers → Services → Repositories |
| ORM | **EF Core 8**, code-first + migrations | `dotnet ef migrations`, seeded data |
| Database | **SQL Server 2022** in **Docker** | `mcr.microsoft.com/mssql/server:2022-latest` |
| Auth | **ASP.NET Core Identity + JWT** | Access + refresh tokens, role policies |
| Validation | **FluentValidation** | Request DTO validation |
| Frontend | **React 18 + Vite + TypeScript** | SPA (optional Vite SSR) |
| Server state | **TanStack Query** | Caching, invalidation, optimistic updates |
| HTTP client | **Axios** | Interceptors attach JWT, refresh on 401 |
| Styling | Tailwind CSS (or CSS Modules) | Responsive web |
| Mock email | **MailHog / Papercut** (Docker SMTP) | Catches all outbound mail locally |
| Mock storage | Local filesystem or **MinIO** (Docker) | S3-compatible attachments/avatars |
| Payments | **In-app payment simulator** | Escrow ledger; no real money |
| Orchestration | **Docker Compose** | api + db + mailhog + minio |
| API docs | **Swagger / OpenAPI** | Interactive testing during dev |
| Tests | xUnit (unit), optional Playwright (E2E) | Plus manual UAT |

### 5.4 Admin Panel Feature List
- **User management:** list/search users; verify, suspend, reinstate; view profile & activity.
- **Job & proposal moderation:** hide/flag policy-violating jobs; view all proposals; take down spam.
- **Review moderation:** remove reviews violating policy; view rating distributions.
- **Dispute management:** view `Disputed` milestones; record a resolution (simulated release or refund in the ledger) with a note.
- **Metrics dashboard:** counts of users by role, open jobs, active contracts, escrowed vs released totals, signups over time.
- **Audit trail:** every admin action logged to `AuditLog` with actor, action, entity, and timestamp.

### 5.5 Authentication Mechanism
- **ASP.NET Core Identity** manages users, password hashing (PBKDF2), and role storage.
- **JWT Bearer** authentication: on login the API issues a short-lived **access token** (~15 min) and a longer-lived **refresh token** (persisted, rotated on use, revocable).
- **Roles:** `Freelancer`, `Client`, `Admin`, enforced via ASP.NET Core **authorization policies** and `[Authorize(Roles=...)]`, plus **resource-based ownership checks** (e.g., only the job owner accepts a proposal; only contract parties read a thread).
- **Token flow:** Axios request interceptor attaches the access token; a response interceptor catches 401, calls `/api/auth/refresh`, retries once, and logs out on refresh failure.
- **Email verification & password reset** are handled through mock email links (no real delivery).

### 5.6 Third-Party Integrations (All Local / Mock — No Live Cloud)
| Concern | Mock Implementation | Purpose |
|---------|--------------------|---------|
| **Email** | **MailHog** (or Papercut) SMTP container | Captures verification, notification, and digest emails; viewable in a local web UI. The API talks plain SMTP to `mailhog:1025`. |
| **Payments** | **Internal Payment Simulator + Escrow Ledger** | Each user has a mock balance. Funding a milestone debits the Client and escrows funds; release credits the Freelancer. Every move writes an immutable `LedgerEntry`. No external gateway, no real money. |
| **Cloud storage** | **Local filesystem** (dev) or **MinIO** S3-compatible container | Stores avatars and message/deliverable attachments behind a storage abstraction (`IFileStorage`) so the interface matches real cloud storage without any cloud calls. |

All three sit behind interfaces (`IEmailSender`, `IPaymentService`, `IFileStorage`) so a real provider could be swapped in later without touching business logic.

### 5.7 UAT (User Acceptance Testing) Strategy
**Goal:** manually verify the application meets the acceptance criteria before delivery/demo.

- **Environment:** everything via `docker compose up` (api + SQL Server + MailHog + MinIO) plus the Vite dev server. A dedicated `uat` config with seeded data.
- **Seed data & test accounts:** deterministic seed creating role-based accounts — `client@uat.test`, `freelancer1@uat.test`, `freelancer2@uat.test`, `admin@uat.test` (shared known password), plus sample jobs/proposals so testers start mid-scenario quickly.
- **Test approach:** scripted **manual test cases derived directly from the Gherkin scenarios** (Section 4). Each case = preconditions, steps, expected result, pass/fail, notes.
- **UAT checklist (per top story):**

  | Story | Manual Test | Expected Result |
  |-------|-------------|-----------------|
  | US-01 | Register Freelancer; log in; hit a protected route | Account created, JWT issued, route accessible; verification email visible in MailHog |
  | US-02 | As Client post a valid job, then an invalid one | Valid job "Open" & listed; invalid job blocked with field error; Freelancer gets 403 on the route |
  | US-03 | Search "React"; filter category+budget; search nonsense | Matching jobs only; filters honored; empty-state for no matches |
  | US-04 | Submit valid proposal; submit duplicate; submit on closed job | First "Submitted" + email in MailHog; duplicate blocked; closed-job blocked |
  | US-05 | Accept a proposal as owner; try as non-owner | Contract created, job "In Progress", others "Declined", email sent; non-owner gets 403 |
  | US-06/07 | Fund a milestone, submit, release | Ledger shows debit→escrow→credit; contract "Completed" when all released |
  | US-10 | As Admin suspend a user & hide a job | User cannot log in; job removed from listing; actions in audit log |

- **Defect handling:** failures logged as GitHub issues labeled `bug` with severity, linked to the story/use case; re-tested after fix (bug-fix → verify loop).
- **Cross-cutting checks:** authorization (401/403 on protected actions), input validation, no external network calls (offline check), responsive layout on a mobile viewport.
- **Sign-off criteria:** all P0 stories pass; no open **critical/high** bugs; happy-path demo runs end-to-end. Sign-off gates delivery.

---

## 6. Implementation Plan

> Sprints for the remaining capstone days. Each task links to user stories. Effort uses relative sizing (**S/M/L/XL**). Days are indicative units of work, not calendar-locked.

### Day 0 — Documentation & Setup
| Task | Stories | Size | Dependencies |
|------|---------|------|--------------|
| Finalize this specification & get approval | all | M | — |
| Create repo, Projects board, issues & labels | all | M | Spec approved |
| Scaffold solution: .NET 8 Web API + React (Vite) + Docker Compose (SQL Server, MailHog, MinIO) | — | L | — |
| EF Core setup, base entities, first migration, seed | US-01 | M | Scaffold |

**Risks:** Docker networking / port conflicts on local; SQL Server container memory on low-RAM machines. *Mitigation:* pin image versions, document ports, provide a `.env`.

### Build Sprint 1 — Auth, Jobs, Proposals
| Task | Stories | Size | Dependencies |
|------|---------|------|--------------|
| Identity + JWT (register, login, refresh, roles) | US-01 | L | EF Core setup |
| Profiles (CRUD) | US-11 | M | Auth |
| Jobs (create/edit/close) + validation | US-02 | M | Auth |
| Job listing with search & filter | US-03 | M | Jobs |
| Proposals (submit/list/withdraw, duplicate guard) | US-04 | L | Jobs |
| React: auth flow, job list/detail, proposal form | US-01–04 | L | APIs above |

**Risks:** JWT refresh edge cases (rotation, revocation); authorization policy gaps. *Mitigation:* centralize auth in Axios interceptors + policy tests.

### Build Sprint 2 — Contracts, Milestones/Escrow, Messaging, Reviews
| Task | Stories | Size | Dependencies |
|------|---------|------|--------------|
| Accept proposal → create Contract (transactional) | US-05 | L | Sprint 1 |
| Milestones + **escrow ledger** (fund/submit/release/refund) | US-06, US-07 | XL | Contracts |
| Payment simulator + immutable `LedgerEntry` | US-06, US-07 | L | Milestones |
| Messaging threads (+ mock attachments) | US-08 | M | Contracts, storage |
| Reviews on completion (two-sided) | US-09 | M | Contracts |
| React: contract workspace (milestones, messages, reviews) | US-05–09 | L | APIs above |

**Risks:** escrow state-machine complexity & concurrency (double-release, race on accept); ledger consistency. *Mitigation:* DB transactions, explicit state machine, unit tests on transitions.

### Build Sprint 3 — Admin Panel & Mock Integrations
| Task | Stories | Size | Dependencies |
|------|---------|------|--------------|
| Admin panel: users, moderation, disputes, audit log | US-10 | L | Sprint 2 |
| Metrics dashboard | US-10 | M | Admin data |
| Email notifications wired to MailHog | US-12 | M | Auth, events |
| File storage abstraction → MinIO/local | US-08, US-11 | M | Storage service |

**Risks:** dispute/refund flows touching the ledger; admin actions bypassing normal guards. *Mitigation:* route admin mutations through the same services + audit every action.

### UAT & Polish Day
| Task | Stories | Size | Dependencies |
|------|---------|------|--------------|
| Seed UAT data & test accounts | all | S | Features complete |
| Execute UAT checklist (Section 5.7) | top 5 | L | Seed |
| Fix bugs (bug → verify loop) | as found | M | UAT results |
| Demo dry-run + README/run instructions | all | S | Green UAT |

**Overall dependencies:** Auth → everything; Contracts → Milestones/Messaging/Reviews; Features → UAT.
**Top risks (ranked):** (1) escrow/milestone state machine, (2) auth/authorization correctness, (3) Docker/local environment friction, (4) time-box on the 4-hour spec window vs. build sprints.

---

## 7. Appendix: Traceability Matrix

| Story | Use Case(s) | Gherkin | Sprint |
|-------|-------------|---------|--------|
| US-01 | — (auth precondition to all) | ✔ | Sprint 1 |
| US-02 | UC-1 | ✔ | Sprint 1 |
| US-03 | — | ✔ | Sprint 1 |
| US-04 | UC-2 | ✔ | Sprint 1 |
| US-05 | UC-3 | ✔ | Sprint 2 |
| US-06 | UC-3, UC-4 | — | Sprint 2 |
| US-07 | UC-4 | — | Sprint 2 |
| US-08 | UC-5 | — | Sprint 2 |
| US-09 | UC-4 (completion) | — | Sprint 2 |
| US-10 | UC-6 | — | Sprint 3 |
| US-11 | — | — | Sprint 1/3 |
| US-12 | — | — | Sprint 3 |
