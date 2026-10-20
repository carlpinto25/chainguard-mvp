# Validation record

Validated on 20 October 2026 using Node.js 26.11.1, Next.js 16.4.2 and React 19.3.1.

## Automated tests

`npm test`: **23 passed, 0 failed**.

`npm run check`: engine, API, runtime and Next.js configuration syntax checks passed.

`npm run build`: optimized Next.js production build passed; the dashboard page and dynamic `/api/[...path]` route compiled successfully.

| Behavior tested | Observation |
| --- | --- |
| Valid transaction | One persisted request, one tool invocation, successful ledger read-back |
| Pending bank verification | Blocked; no dispatch, including retry |
| Malicious invoice instructions | Cannot override bank verification; no dispatch |
| Invoice mismatch | Blocked; no dispatch |
| High-value request | Held until independent approval and explicit execution |
| Unauthorized approval | Rejected and audited |
| Self-approval | Rejected |
| Approval against failed business checks | Rejected |
| Beneficiary changed after approval | Held; fresh approval restores the permitted path |
| Amount changed with consistent records | Existing approval rejected as stale |
| Approval expired | Held |
| Supplier becomes unverified after approval | Blocked at execution |
| Eight identical retries | One request total, one protected-tool invocation |
| Same invoice with a different operation key | No second request |
| Missing authoritative record | Held; no dispatch |
| Unknown tool or agent | Denied |
| Cross-record identity or quantity mismatch | Rejected |
| Excessive, zero, fractional or negative amounts | Limit check fails |
| Document modified | No effect on decision or approval fingerprint |
| All eight scenarios | Linked audit records contain actor, trace, evidence and policy fields |
| Application restart | Stored request and audit events survive |
| Mock storage error | Atomic rollback; no partial request or event commit |
| Next.js API handler | Session role checks, CSRF/origin checks, no direct protected route, audit export and reset verified |

The count of 23 is the test runner’s test-case count. Some test cases cover several assertions; it is not a count of attacks or a statistical security score.

## Browser verification

An automated Chromium session against the Next.js production server exercised the four core scenarios, duplicate retry, stale approval and fresh-approval recovery, audit filtering, JSON download, the nine policy cards and reset. All passed with no browser console errors, hydration errors or uncaught page errors. A separate SQLite database was used for this verification; the user's demo data was not reset.

Desktop was checked at 1440×1000 and mobile at 390×844. The mobile page has no horizontal overflow. Captures are included at `screenshots/control-room.png` and `screenshots/mobile.png`.

The `npm run dev` command was also checked separately: React hydration, initial session creation and a valid API-backed scenario passed in development mode.

## Benchmark scope

The implemented permission-only baseline allows the known payment agent to call `create_payment_request`. The bank, injection and mismatch fixtures are permitted by that baseline but blocked by transaction policies. This is an explicit comparison with a deliberately limited baseline, not evidence against any commercial product.

The tests show correctness for the supplied fixtures. They do not establish zero false positives, complete prompt-injection protection, production authentication, distributed consistency or deployment readiness.
