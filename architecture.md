# Architecture — Freelance Marketplace

This document describes the system architecture of the Freelance Marketplace platform: its
high-level components, the data flow for two key scenarios (authentication and the
core post-job → proposal journey), and the containerised deployment view.

All diagrams below are written in [Mermaid](https://mermaid.js.org/) and render natively in
GitHub's Markdown viewer.

---

## 1. Component / Container View

A classic three-tier design. The browser talks only to the `web` container (React SPA served
by Nginx). Nginx serves static assets and reverse-proxies every `/api/*` request to the `api`
container, which owns all business logic and is the only component that touches the database or
the external currency service.

```mermaid
flowchart LR
    user([User / Browser])

    subgraph web["web container · Nginx :80 → host :3000"]
        spa["React 19 SPA<br/>(Vite build, TanStack Query, Axios)"]
        proxy["Nginx reverse proxy<br/>/api/* → api:8080"]
    end

    subgraph api["api container · .NET 8 Web API :8080 → host :5107"]
        ctrl["Controllers<br/>(Auth, Jobs, Proposals, Files, Currency, Admin)"]
        svc["Services<br/>(business logic, ownership + RBAC checks)"]
        ef["EF Core 8<br/>(AppDbContext)"]
    end

    subgraph db["db container · SQL Server 2022 :1433"]
        sql[("FreelanceMarketplace DB")]
    end

    frank["Frankfurter API<br/>(external · exchange rates)"]
    vol1[["sqldata volume"]]
    vol2[["uploads volume"]]

    user -->|HTTPS/HTTP| spa
    spa -->|"/api/* (JWT Bearer)"| proxy
    proxy -->|http| ctrl
    ctrl --> svc
    svc --> ef
    ef -->|"TDS 1433"| sql
    svc -.->|"GET /latest (cached 1h, 5s timeout)"| frank
    sql --- vol1
    svc -->|"read/write files"| vol2
```

**Key design decisions** (see [`adr/`](adr/) for the full records):

- **Thin controllers, fat services** — controllers only bind DTOs and translate results to HTTP
  status codes; all business rules, ownership checks, and role enforcement live in the service
  layer ([ADR-003](adr/003-layered-service-architecture.md)).
- **Stateless JWT auth** — no server session state, so the `api` container scales horizontally
  ([ADR-002](adr/002-jwt-bearer-auth-with-aspnet-identity.md)).
- **Resilient external calls** — the currency integration caches results and degrades gracefully
  to a 1.0 rate on failure, so a third-party outage never breaks job browsing
  ([ADR-004](adr/004-resilient-external-currency-integration.md)).

---

## 2. Authentication Flow (Login)

JWT bearer authentication. On success the SPA stores the token and attaches it as an
`Authorization: Bearer <token>` header (via an Axios interceptor) on every subsequent request.
Protected endpoints return **401** when the token is missing/invalid and **403** when the role
is insufficient.

```mermaid
sequenceDiagram
    actor U as User
    participant SPA as React SPA
    participant API as AuthController
    participant AS as AuthService
    participant ID as ASP.NET Identity
    participant JWT as JwtTokenService
    participant DB as SQL Server

    U->>SPA: Enter email + password
    SPA->>API: POST /api/auth/login
    API->>AS: LoginAsync(dto)
    AS->>ID: Find user + verify password
    ID->>DB: SELECT AspNetUsers
    DB-->>ID: user row
    ID-->>AS: valid (or fail)
    alt account disabled
        AS-->>API: AppException(403)
        API-->>SPA: 403 Forbidden
    else valid credentials
        AS->>JWT: CreateToken(user, roles)
        JWT-->>AS: signed JWT (sub + role claims)
        AS-->>API: AuthResponse(token, user)
        API-->>SPA: 200 OK
        SPA->>SPA: store token in localStorage
        SPA->>API: subsequent calls with Bearer token
    end
```

---

## 3. Core Feature Flow — Post a Job → Submit a Proposal

The platform's primary journey spans both roles and shows RBAC, ownership checks, and the live
currency conversion working together.

```mermaid
sequenceDiagram
    actor C as Client
    actor F as Freelancer
    participant SPA as React SPA
    participant JC as JobsController
    participant PC as ProposalsController
    participant CS as CurrencyService
    participant DB as SQL Server
    participant FR as Frankfurter API

    Note over C,DB: Client posts a job (role = Client)
    C->>SPA: Fill job form (title, budget, currency)
    SPA->>JC: POST /api/jobs (Bearer, role=Client)
    JC->>DB: INSERT Job (OwnerId = client)
    DB-->>JC: job id
    JC-->>SPA: 201 Created

    Note over F,FR: Freelancer browses in preferred currency
    F->>SPA: Open job list
    SPA->>CS: GET /api/currency/convert?amount&from&to
    CS->>CS: check IMemoryCache
    alt cache miss
        CS->>FR: GET /latest?from&to
        FR-->>CS: rate (or timeout → fallback 1.0)
        CS->>CS: cache rate 1h
    end
    CS-->>SPA: converted amount

    Note over F,DB: Freelancer submits a proposal (role = Freelancer)
    F->>SPA: Submit proposal
    SPA->>PC: POST /api/proposals (Bearer, role=Freelancer)
    PC->>DB: check duplicate active proposal
    alt already applied
        PC-->>SPA: 409 Conflict
    else new
        PC->>DB: INSERT Proposal
        PC-->>SPA: 201 Created
    end
```

---

## 4. Deployment View

`docker compose up --build` orchestrates three containers on a shared Compose network with two
named volumes for persistence. The `api` container waits for the database health check to pass
before starting; both `api` and `web` restart on failure.

```mermaid
flowchart TB
    subgraph host["Developer machine (Docker Compose)"]
        direction TB
        webc["web<br/>freelance_web<br/>Nginx · host :3000 → :80"]
        apic["api<br/>freelance_api<br/>.NET 8 · host :5107 → :8080"]
        dbc["db<br/>freelance_db<br/>SQL Server 2022 · :1433"]

        vsql[["sqldata<br/>(named volume)"]]
        vup[["uploads<br/>(named volume)"]]
    end

    ext["Frankfurter API<br/>(internet)"]

    webc -->|"depends_on"| apic
    apic -->|"depends_on: service_healthy"| dbc
    apic -.->|"outbound HTTPS"| ext
    dbc --- vsql
    apic --- vup
```

**Ports:** `3000` (web) · `5107` (api) · `1433` (db).
**Volumes:** `sqldata` (database files) · `uploads` (user-uploaded attachments).
