# Freelance Marketplace (Capstone)

A simplified Upwork-style platform connecting **freelancers** with **clients**: job posting, proposals, messaging, escrow-inspired milestone tracking, and reviews.

This repository holds the **capstone specification and planning artifacts**. The build sprints follow after approval.

## Deliverables

- 📄 **[SPECIFICATION.md](./SPECIFICATION.md)** — full spec: scope, user stories, use cases, Gherkin acceptance criteria, technical design, and the day-by-day implementation plan.
- 🗂️ **Project board** — GitHub Projects board (To Do / In Progress / Done) with labeled, effort-estimated issues for every user story, use case, technical task, and bug. _(Link added after creation.)_

## Planned Stack

- **Backend:** .NET 8 Web API · EF Core 8 (code-first) · ASP.NET Core Identity + JWT
- **Frontend:** React 18 + Vite + TypeScript · TanStack Query · Axios
- **Database:** SQL Server 2022 (Docker)
- **Mock integrations (local only):** MailHog (email) · in-app payment simulator + escrow ledger · MinIO/local FS (storage)
- **Orchestration:** Docker Compose

## Infrastructure Constraint

Everything runs **locally** — no cloud deployments or external hosting. The full stack is demonstrable via `docker compose up` plus the Vite dev server.
