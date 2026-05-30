# BarkX Incubator Static Security Audit

Date: 2026-05-30

Scope:
- `/home/soleste/barkx-pool-interface`
- `/home/soleste/barkx-incubator-contract`
- `/home/soleste/barkx-incubator-backend`
- `/home/soleste/barkx-incubator-admin`

Method:
- Static review only.
- No code changes were made.
- No dynamic exploitation, fuzzing, dependency CVE scan, or live-chain validation was performed.

Overall assessment:
- The previously reported high-risk issues were remediated as expected:
  - convert issuance now requires wallet ownership proof via one-time challenge
  - admin login now uses one-time challenge + server-issued session token
  - admin actions now hard-gate on chain/owner before sending transactions
  - `trust proxy` is env-controlled instead of globally trusted
  - admin-side `ethers` is self-hosted instead of loaded from a public CDN
- No new high or medium severity issue was found in the reviewed code.
- Remaining concerns are low-severity operational / abuse-resistance issues.

## Findings

### 1. Low: Public challenge endpoints can be spammed to grow the `challenge` table

Affected code:
- `barkx-incubator-backend/src/routes/incubator.ts:39-43`
- `barkx-incubator-backend/src/routes/auth.ts:19-23`
- `barkx-incubator-backend/src/auth/challenge.ts:25-46`
- `barkx-incubator-backend/src/db/migrations/0003_security_hardening.sql:17-25`

Why this matters:
- Both challenge-issuing endpoints are public and write a new DB row on every request.
- Cleanup is only opportunistic and mostly address-local.
- There is no endpoint-level rate limit or global GC pass for stale/unused challenges.

Impact:
- An unauthenticated caller can generate unbounded rows and grow the SQLite file over time.
- This is a denial-of-service / storage-growth risk, not a privilege-escalation issue.

Recommended fix:
- Add lightweight rate limiting to the challenge endpoints.
- Add a periodic cleanup job for expired/used challenges.
- Optionally cap outstanding challenges per address/scope.

Status: **Resolved (2026-05-30)**.
- Per-IP rate limit added to both challenge endpoints (30/min → `429 RATE_LIMITED`): `barkx-incubator-backend/src/util/rateLimit.ts`, wired in `src/routes/incubator.ts` + `src/routes/auth.ts`.
- `issueChallenge` now caps outstanding challenges to one per `(scope,address)` (deletes prior rows on re-issue): `src/auth/challenge.ts`.
- Periodic GC (every 5 min, plus once at boot) of expired/used challenges and expired admin sessions: `gcChallenges()` in `src/auth/challenge.ts`, scheduled in `src/server.ts`.

### 2. Low: Owner rotation revocation is delayed by the 10s owner cache

Affected code:
- `barkx-incubator-backend/src/auth/adminAuth.ts:37-49`
- `barkx-incubator-backend/src/auth/adminAuth.ts:56-103`
- `barkx-incubator-backend/src/auth/adminAuth.ts:109-137`

Why this matters:
- `getOwner()` caches the on-chain owner for `OWNER_TTL_MS = 10000`.
- Both login and `requireAdmin()` consult that cached value.
- After an on-chain owner rotation, the old owner can remain accepted until the cache refreshes.

Impact:
- Emergency owner rotation is not strictly immediate.
- Outstanding admin sessions can survive briefly after rotation.

Recommended fix:
- Reduce the cache TTL further, or invalidate the cache on each admin request.
- If performance matters, pin the cache to a block height instead of a wall-clock TTL.

Status: **Resolved (2026-05-30)**.
- `OWNER_TTL_MS` reduced from 10000 to 2000 (`barkx-incubator-backend/src/auth/adminAuth.ts`), cutting the post-rotation acceptance window ~5x. The cache now only coalesces request bursts; admin traffic is low.

## Additional Observations

- The auth-critical challenge/session paths do not appear to have dedicated automated tests in the repository; the current test coverage is still centered on quota math. **Addressed (2026-05-30): `barkx-incubator-backend/src/__tests__/auth.test.ts` adds 7 tests covering the challenge lifecycle and the admin session-login checks.**
- Testnet-oriented defaults (`OPENDAO_MOCK`, `DEBUG_ENDPOINTS`) remain intentionally enabled by default and must still be turned off for production per `prod_modify.md`.

## Closing Notes

The second-pass review confirms the earlier high-risk findings were addressed. The remaining issues are operational hardening items rather than exploitable privilege-escalation bugs.

**Follow-up (2026-05-30):** Both low-severity findings above have since been remediated (rate limiting + per-address cap + periodic GC for challenges; owner-cache TTL reduced to 2s), and automated tests were added for the auth paths. See `dev_guide_fix.md` F-18.
