# UAT Verification Results

| # | Feature | Test Action | Expected Result | Actual Result | Status |
|---|---------|-------------|-----------------|---------------|--------|
| 1 | **User Registration** | POST `/api/auth/register` with Freelancer role | 201 + JWT returned | 201 + JWT returned | ✅ Pass |
| 2 | **User Login** | POST `/api/auth/login` with valid credentials | 200 + JWT + user payload | 200 + JWT + user payload | ✅ Pass |
| 3 | **Role Restriction (Client)** | POST `/api/jobs` as Freelancer | 403 Forbidden | 403 Forbidden | ✅ Pass |
| 4 | **Job Posting** | POST `/api/jobs` as Client with title/budget | 201 + job object | 201 + job object | ✅ Pass |
| 5 | **Job Listing with Filters** | GET `/api/jobs?search=react&category=Web Development` | Filtered list | Filtered list | ✅ Pass |
| 6 | **File Attachment Upload** | POST `/api/files` multipart form | 200 + fileId | 200 + fileId | ✅ Pass |
| 7 | **File Download Auth Guard** | GET `/api/files/{id}` unauthenticated | 401 Unauthorized | 401 Unauthorized | ✅ Pass |
| 8 | **Proposal Submission** | POST `/api/proposals` as Freelancer | 201 + proposal | 201 + proposal | ✅ Pass |
| 9 | **Duplicate Proposal Guard** | POST `/api/proposals` same job twice | 400 Bad Request | 400 Bad Request | ✅ Pass |
| 10 | **Proposal Withdrawal** | POST `/api/proposals/{id}/withdraw` | 200, status = Withdrawn | 200, status = Withdrawn | ✅ Pass |
| 11 | **Currency Conversion** | GET `/api/currency/convert?amount=100&from=USD&to=EUR` | 200 + convertedAmount | 200 + convertedAmount | ✅ Pass |
| 12 | **Currency Conversion Caching** | Call convert twice — second response served from cache | Response in < 5 ms | < 5 ms (IMemoryCache hit) | ✅ Pass |
| 13 | **Admin Metrics** | GET `/api/admin/metrics` as Admin | 200 + KPI payload | 200 + KPI payload | ✅ Pass |
| 14 | **Admin Metrics Forbidden** | GET `/api/admin/metrics` as Freelancer | 403 Forbidden | 403 Forbidden | ✅ Pass |
| 15 | **User Role Change** | POST `/api/admin/users/{id}/role` body `{"role":"Client"}` | 200 + updated user | 200 + updated user | ✅ Pass |
| 16 | **User Suspension** | POST `/api/admin/users/{id}/toggle-status` `{"isDisabled":true}` | 200 + disabled | 200 + disabled | ✅ Pass |
| 17 | **Self-Disable Guard** | Admin calls toggle-status on own account | 400 Bad Request | 400 Bad Request | ✅ Pass |
| 18 | **Job Update Ownership** | PUT `/api/jobs/{id}` as non-owner Client | 403 Forbidden | 403 Forbidden | ✅ Pass |
| 19 | **Job Delete** | DELETE `/api/jobs/{id}` as owning Client | 204 No Content | 204 No Content | ✅ Pass |
| 20 | **Expired JWT Guard** | Authenticated request with tampered token | 401 Unauthorized | 401 Unauthorized | ✅ Pass |

## Summary

- **Total tests:** 20
- **Passed:** 20
- **Failed:** 0
- **Backend automated test suite:** 61 tests — all green
- **Line coverage (excl. migrations):** 86.1% (branch 57.4%, method 93.3%) — see `docs/coveragereport/`
