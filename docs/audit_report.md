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
- No dynamic exploitation, fuzzing, dependency CVE scan, or live-chain validation was performed for this report.

Overall assessment:
- The core on-chain asset accounting in `BarkXIncubator` is relatively simple and the main balance invariant (`userTotalInjection - userTotalConversion`) is enforced on-chain.
- The highest-risk issues are concentrated in the off-chain control plane: convert-signature issuance, admin authentication, admin transaction safety, and deployment defaults.

## Findings

### 1. High: Anyone can keep a victim permanently stuck in `CONVERSION_PENDING`

Affected code:
- `barkx-incubator-backend/src/routes/incubator.ts:34-50`
- `barkx-incubator-backend/src/sign/convert.ts:44-94`
- `barkx-pool-interface/src/composables/useIncubatorBackend.js:110-116`

Why this is a problem:
- The public convert endpoints only take an `address` and do not require any wallet-authenticated proof that the caller controls that address.
- Once a signature is issued, `signConvert()` inserts a row into `convert_sig` and blocks any second request for the same user/mechanism/day while the first one is still unconsumed and unexpired.
- Because the endpoint is unauthenticated, any third party can repeatedly request fresh signatures for a victim address and keep the victim in the in-flight state forever.

Practical impact:
- A remote attacker can deny Normal conversion for any user.
- A remote attacker can deny Leader conversion for any user.
- The attack is cheap and repeatable every time the previous signature expires.
- It also creates unnecessary `convert_sig` growth and noise in the audit table.

Recommended fix:
- Require a wallet-authenticated request before issuing a convert signature.
- The authenticated identity must be bound to the exact wallet that will call `convert()` on-chain.
- A standard fix is a server-issued challenge or EIP-712 login with nonce + short TTL, then require that session on `/incubator/convert/*`.
- Add endpoint-level abuse controls as defense in depth.

### 2. High: Admin login is a replayable bearer signature with client-controlled lifetime

Affected code:
- `barkx-incubator-backend/src/auth/eip712.ts:28-35`
- `barkx-incubator-backend/src/auth/adminAuth.ts:28-39`
- `barkx-incubator-backend/src/env.ts:52`
- `barkx-incubator-admin/index.html:112-121`

Why this is a problem:
- The admin login payload has no server-issued nonce or one-time challenge.
- The backend accepts any correctly signed payload as long as `expiresAt` is still in the future.
- The server does not enforce a maximum lifetime, even though `ADMIN_LOGIN_TTL_SEC` exists in config.
- The browser chooses `issuedAt` and `expiresAt`, so a malicious page can ask the owner to sign a very long-lived admin token and the backend will accept it.

Practical impact:
- A stolen bearer token remains valid until its self-declared expiry.
- A phishing page can obtain a reusable admin signature without ever talking to the backend first.
- If the signer is tricked into signing a far-future expiry, the compromise becomes long-lived instead of bounded to 8 hours.

Recommended fix:
- Replace the reusable typed-data bearer with a server-issued nonce/challenge that is stored and invalidated after one use.
- Enforce `expiresAt - issuedAt <= ADMIN_LOGIN_TTL_SEC` on the server.
- Reject very old `issuedAt` values, not only future ones.

### 3. Medium: Admin actions can be broadcast on the wrong chain

Affected code:
- `barkx-incubator-admin/actions.html:84-85`
- `barkx-incubator-admin/actions.html:102-110`
- `barkx-incubator-admin/actions.html:113-153`

Why this is a problem:
- The admin actions page tries to switch the wallet network, but silently ignores switch failures.
- It then creates a write-capable contract object directly from the current signer and never re-checks the signer chain before sending transactions.
- The page also does not hard-block actions when the owner check is failing; it only renders status text.

Practical impact:
- If the wallet stays on the wrong network, `pause`, `unpause`, `withdraw`, or `setApprover` can be sent to the same hex address on an unintended chain.
- In the worst case, if that address hosts attacker-controlled code on another network the admin uses, the owner can be tricked into executing unintended logic there.
- Even without an attacker, this can burn gas or trigger meaningless writes on the wrong network.

Recommended fix:
- Treat failed `wallet_switchEthereumChain` as a hard error.
- Disable all admin action buttons unless both conditions hold:
  - connected chain is `421614`
  - connected wallet matches on-chain `owner()`
- Re-check the active chain immediately before each transaction.

### 4. Medium: Partner IP allowlists are spoofable if the backend is reachable through untrusted proxy paths

Affected code:
- `barkx-incubator-backend/src/server.ts:31`
- `barkx-incubator-backend/src/auth/partnerAuth.ts:16`
- `barkx-incubator-backend/src/auth/partnerAuth.ts:36-39`

Why this is a problem:
- Express is configured with `app.set('trust proxy', true)`, which trusts all proxy headers.
- Partner IP allowlist decisions are then made from `req.ip`.
- If the app is ever directly reachable, or the reverse-proxy boundary is looser than expected, an attacker can spoof `X-Forwarded-For` and satisfy the IP allowlist check.

Practical impact:
- IP allowlisting stops being a reliable second factor for leaked partner tokens.
- Request logs also become less trustworthy because the recorded remote IP can be forged.

Recommended fix:
- Replace `true` with an explicit trusted proxy hop count or subnet list.
- If the service is not guaranteed to sit behind a fixed reverse proxy, disable proxy trust entirely.

### 5. Medium-Low: Admin wallet-critical pages load `ethers` from a public CDN without integrity pinning

Affected code:
- `barkx-incubator-admin/index.html:30`
- `barkx-incubator-admin/actions.html:59`

Why this is a problem:
- Admin sign-in and owner transactions depend on a third-party CDN script.
- The pages do not use Subresource Integrity.
- A CDN compromise, package substitution, or script-delivery issue would immediately affect admin authentication and transaction signing flows.

Practical impact:
- This is a supply-chain risk against the most privileged browser surface in the system.

Recommended fix:
- Self-host the exact `ethers` bundle inside the admin repo, or
- add SRI and pair it with a strict CSP.

## Additional Observations

### Unsafe production defaults

Affected code:
- `barkx-incubator-backend/src/env.ts:41`
- `barkx-incubator-backend/src/env.ts:56`
- `barkx-incubator-backend/src/opendao/client.ts:69-73`
- `barkx-incubator-backend/src/routes/admin.ts:195-240`

Notes:
- `OPENDAO_MOCK` defaults to `true`.
- `DEBUG_ENDPOINTS` defaults to `true`.
- If production env configuration is incomplete, the backend can silently compute quotas from a local mock fixture and expose virtual-clock / backfill controls in production.
- This is primarily an integrity and promotion-safety risk rather than a direct exploit.

### Partner-token lifecycle is incomplete in the shipped admin surface

Affected code:
- `barkx-incubator-backend/src/routes/admin.ts:174-189`
- `barkx-incubator-admin/partners.html:16-23`
- `barkx-incubator-admin/partners.html:58-68`

Notes:
- The admin UI creates partner tokens but does not expose IP allowlist input.
- The shipped API/UI surface also does not provide revoke/disable/rotate operations.
- A leaked partner token therefore falls back to manual DB intervention.

### Owner custody remains a hard trust assumption

Affected code:
- `barkx-incubator-contract/contracts/BarkXIncubator.sol:226-239`

Notes:
- The contract owner can withdraw BARKX/ETH and rotate the approver.
- This is documented behavior, not an implementation bug, but it means users are still trusting the operator not to drain conversion liquidity or misconfigure the approver.

## Closing Notes

No direct token-draining bug was found in the reviewed on-chain balance accounting itself. The most important fixes are off-chain:
- bind convert-signature issuance to wallet ownership
- redesign admin auth to be nonce-based and server-bounded
- harden admin transaction chain checks
- tighten proxy trust assumptions

