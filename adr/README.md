# Architecture Decision Records

This directory records the significant architectural decisions made while building the Freelance
Marketplace, using a format inspired by
[Michael Nygard's template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md).

Each record captures the **context** that forced a decision, the **decision** itself, and its
**consequences** (what becomes easier, harder, or riskier) in the specific context of this project.

| ADR | Title | Status | Relationships |
|-----|-------|--------|---------------|
| [001](001-use-ef-core-and-sql-server.md) | Use EF Core 8 with SQL Server for data access | Accepted | relates to 003 |
| [002](002-jwt-bearer-auth-with-aspnet-identity.md) | JWT bearer authentication with ASP.NET Identity for RBAC | Accepted | relates to 003 |
| [003](003-layered-service-architecture.md) | Layered service architecture with thin controllers | Accepted | relates to 002, enables 004 |
| [004](004-resilient-external-currency-integration.md) | Resilient external currency integration | Accepted | depends on 003 |
