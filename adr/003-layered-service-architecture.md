# ADR-003: Layered service architecture with thin controllers

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Capstone author

## Context

The domain has non-trivial business rules that must be enforced consistently and covered by tests:
a Client may only edit/delete their **own** jobs; a Freelancer may not submit a second active
proposal to the same job; an Admin may not disable their own account; withdrawals soft-delete rather
than hard-delete. If this logic lived inside controllers, it would be hard to unit-test (controllers
are coupled to HTTP), easy to duplicate, and easy to bypass.

We need a structure where business rules are (a) in one place, (b) unit-testable without spinning up
HTTP, and (c) reusable across endpoints — while keeping the target of an **80%+ backend coverage**
requirement realistically achievable.

## Decision

Adopt a **layered architecture**: `Controller → Service → EF Core (AppDbContext)`.

- **Controllers** are thin: bind/validate DTOs, call a single service method, and map the result (or
  a thrown `AppException`) to an HTTP status code. They contain no business logic.
- **Services** (`JobService`, `ProposalService`, `AdminService`, `CurrencyService`, `FileStorage`,
  `AuthService`) own all business rules, ownership checks, and role-aware behaviour. They depend on
  `AppDbContext` and small abstractions (`ICurrentUser`, `IFileStorage`, `ICurrencyService`).
- A global `ExceptionHandlingMiddleware` translates `AppException(statusCode, message)` into
  consistent problem responses, so services signal failures by throwing rather than returning HTTP.
- DTOs (records in `Dtos/`) form the API contract; entities never leak directly to clients.

## Consequences

**Easier**
- Services are unit-tested in isolation with an in-memory context and mocks — this is what makes the
  **88.3% line coverage** attainable, because the rule-heavy code has no HTTP dependency.
- Business rules have a single home; adding contracts/milestones/escrow later reused the same pattern
  without touching controller conventions.
- Swapping the currency provider or file backend only touches one service behind its interface.

**Harder / riskier**
- More files and indirection than putting logic in controllers — a real cost for a small app, judged
  worth it for testability.
- Requires discipline: the value only holds if controllers stay thin. A future contributor could
  erode it by adding logic to a controller.

## Related

- **Relates to [ADR-002](002-jwt-bearer-auth-with-aspnet-identity.md):** attribute-based RBAC handles
  coarse role gates; the finer ownership/self-action checks (e.g. "own job", "not your own account")
  live in this service layer.
- **Enables [ADR-004](004-resilient-external-currency-integration.md):** the resilient currency
  integration is possible precisely because external I/O is isolated behind `ICurrencyService`.
