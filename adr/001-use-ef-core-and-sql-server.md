# ADR-001: Use Entity Framework Core 8 with SQL Server for data access

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** Capstone author

## Context

The Freelance Marketplace needs to persist relational, highly-connected data: users, jobs,
proposals, file metadata, and later contracts/milestones/escrow ledger entries. The domain has
clear referential integrity requirements — a proposal belongs to exactly one job and one
freelancer; a job belongs to one client; ownership must be enforceable in queries. We also need
ASP.NET Core Identity for user management, which ships with a first-class EF Core store.

The team is a single developer working under a capstone time budget, so developer velocity and a
code-first workflow (models and migrations tracked in Git) matter as much as raw performance.
Access is entirely server-side through the API — there is no direct database access from clients.

## Decision

Use **Entity Framework Core 8** as the ORM with **SQL Server 2022** as the relational database,
in a **code-first** style:

- Entities (`AppUser`, `Job`, `Proposal`, `Contract`, `Milestone`, `LedgerEntry`) are configured
  with the Fluent API in `AppDbContext` — max lengths, required fields, cascade-delete behaviour,
  and unique indices (e.g. one active proposal per freelancer per job).
- Schema changes are versioned as EF migrations under `Data/Migrations/` and applied automatically
  on startup / via `dotnet ef database update`.
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore` reuses the same `AppDbContext`, so users and
  roles live in the same store as domain data.
- SQL Server runs as a container (`mcr.microsoft.com/mssql/server:2022-latest`) locally and in
  Docker Compose, so no host installation is required.

## Consequences

**Easier**
- Rapid, type-safe queries with LINQ; ownership checks (`job.OwnerId == currentUser.Id`) are
  expressed directly in C#.
- Migrations give a reproducible, reviewable schema history in Git.
- Identity integration is nearly free — no separate user store to maintain.

**Harder / riskier**
- EF Core can generate inefficient SQL for complex queries; the admin metrics aggregation needed
  deliberate shaping to avoid N+1s.
- SQL Server first-boot in Docker takes ~30 s, which forced a health-check + connection retry loop
  in the API startup (see the fix in commit `4ac91a1`).
- SQL Server licensing/image size is heavier than SQLite or PostgreSQL; the test suite therefore
  uses an in-memory **SQLite** provider for integration tests to stay fast and hermetic
  (this is a deliberate divergence, not a contradiction — see below).

## Related

- The integration-test database choice (SQLite) is a testability concession that relates to
  [ADR-003](003-layered-service-architecture.md), where the service layer is written against
  `DbContext` abstractions rather than SQL Server specifics.
