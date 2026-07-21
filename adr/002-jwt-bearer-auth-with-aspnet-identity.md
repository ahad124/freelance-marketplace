# ADR-002: JWT bearer authentication with ASP.NET Core Identity for RBAC

- **Status:** Accepted
- **Date:** 2026-07-17
- **Deciders:** Capstone author

## Context

The application has three roles — **Freelancer**, **Client**, and **Admin** — with strict
boundaries: only Clients post jobs, only Freelancers submit proposals, and only Admins reach the
dashboard. The frontend is a separate single-page app served from a different origin/container than
the API, so cookie-based session auth would require careful cross-origin/CSRF handling. The API
must also be independently testable and potentially horizontally scalable, which argues against
server-side session state.

We need: secure password storage, role management, a token the SPA can attach to requests, and
enforcement that returns **401** for missing/invalid credentials and **403** for insufficient role.

## Decision

Use **ASP.NET Core Identity** for user/credential/role management and **JWT bearer tokens** for
stateless authentication:

- `JwtTokenService` issues signed tokens containing `sub` and `role` claims; the signing key,
  issuer, audience, and lifetime come from the bound `JwtOptions` configuration section.
- The API validates issuer, audience, lifetime, and signing key on every request via
  `AddJwtBearer`, with a small `ClockSkew`.
- Authorization is declarative: `[Authorize]` guards any authenticated route and
  `[Authorize(Roles = "...")]` enforces RBAC at the controller/action level (e.g.
  `[Authorize(Roles = Roles.Admin)]` on the entire `AdminController`).
- The SPA stores the token and attaches it via an Axios request interceptor; a response
  interceptor clears storage and redirects to `/login` on 401.
- Registration only allows self-assignable roles (Freelancer/Client); Admin is seeded, never
  self-granted.

## Consequences

**Easier**
- The API is stateless — no session store, trivially testable, and scalable.
- RBAC is expressed as attributes right next to the endpoints, so the security posture is easy to
  read and audit.
- Identity handles password hashing, lockout, and uniqueness for free.

**Harder / riskier**
- JWTs cannot be revoked before expiry; mitigated with short-lived tokens and a `ClockSkew` of 30 s.
- The signing key is a secret that must be injected per environment. **Known issue:** the
  production `docker-compose.yml` currently sets `Jwt__Secret`, but the app binds `Jwt:SigningKey`,
  so the compose value is ignored and the committed dev key in `appsettings.json` is used. This is
  documented in the [UAT report](../uat-report.md) bug summary and must be corrected before any
  real deployment.
- Client-side token storage (localStorage) is vulnerable to XSS; acceptable for a capstone but would
  warrant httpOnly cookies or token rotation in production.

## Related

- Enforcement logic (ownership + role checks beyond simple attributes) lives in the service layer —
  see [ADR-003](003-layered-service-architecture.md).
