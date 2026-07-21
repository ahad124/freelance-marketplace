# ADR-004: Resilient external currency integration (Frankfurter + cache + fallback)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Capstone author

## Context

Jobs are posted with a budget in the client's currency, but freelancers want to see budgets in
**their** preferred currency. This requires live exchange rates from a third-party service. Two risks
follow: (1) an external dependency can be slow or down, and if job browsing blocks on it the core UX
breaks; (2) rate APIs are often rate-limited or paid.

The capstone brief also requires a **meaningful third-party integration that handles errors
gracefully**. So the integration must add real product value *and* never become a single point of
failure for unrelated features.

## Decision

Integrate the **Frankfurter API** (`https://api.frankfurter.app`, keyless, ECB-backed) through a
dedicated `CurrencyService` behind the `ICurrencyService` interface, with three resilience measures:

1. **Caching** — successful rates are cached in `IMemoryCache` for 60 minutes, so repeated conversions
   (every job card on a list) cost one upstream call per currency pair per hour.
2. **Timeout** — each upstream call is bounded by a linked `CancellationTokenSource` (default 5 s) so a
   hanging provider cannot stall requests.
3. **Graceful fallback** — on timeout or **any** exception, the service logs a warning and returns the
   original amount (an effective rate of **1.0**) instead of throwing, so the page still renders.

For tests, `CustomWebApplicationFactory` swaps the real service for a Moq mock returning a fixed rate,
keeping integration tests hermetic and network-free.

## Consequences

**Easier**
- Currency conversion is genuinely useful yet safe: a Frankfurter outage degrades to "no conversion",
  never a broken job list or a 500.
- Caching keeps the app well within any implicit rate limits and makes repeat conversions instant.
- The mock swap makes the whole feature deterministically testable.

**Harder / riskier**
- The 1.0 fallback can silently show an unconverted amount; mitigated by showing the original amount
  as a footnote in the UI so the displayed figure is never misleading.
- Cached rates can be up to an hour stale — acceptable for browsing budgets, not for settlement.

## Related

- **Depends on [ADR-003](003-layered-service-architecture.md):** isolating this behind a service
  interface is what makes the timeout/cache/fallback policy and the test-time mock possible.
