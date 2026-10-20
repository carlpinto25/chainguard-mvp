# ChainGuard — hackathon demo

A working **Next.js App Router + React** local MVP for **PS 2.1: AI Agent Safety & Control**, based on the supplied ChainGuard report.

ChainGuard links a supplier, purchase order, goods receipt and invoice before allowing an agent’s proposed payment request. A real server-side gate checks deterministic rules, pauses high-value requests for independent review, prevents duplicate requests and records evidence in SQLite.

**This is a simulation:** deterministic scenario actors stand in for AI agents; business systems, users and payment requests are mock. There is no live LLM, ERP integration, bank connection or money movement.

## Start the local demo

Requires **Node.js 22.13 or newer** (tested here on Node 26.11.1). Uses Next.js 16.4.2, React 19.3.1 and SQLite. No API keys are needed. Install the pinned dependencies once:

```bash
cd /home/carl/Documents/chainguard/chainguard-mvp
npm ci
npm run dev
```

Open **http://localhost:3000** in your browser. Keep the terminal open. Press `Ctrl+C` to stop.

If the project is copied to another computer, open a terminal inside the `chainguard-mvp` folder and run `npm ci`, then `npm run dev`. Installation needs internet access; the installed demo runs offline. A Node warning about the experimental SQLite API on some versions is expected.

If port 3000 is occupied:

```bash
npm run dev -- --port 3001
```

Then visit http://localhost:3001.

For a smoother recording using an optimized production build:

```bash
npm run build
npm start
```

`npm start` requires a successful build. Both servers bind only to the local machine. The Next.js [App Router](https://nextjs.org/docs/app) serves the React dashboard and API route handlers in one application.

## Record the selection video

Use [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the timed speech and exact clicks. [SPEECH_ONLY.md](docs/SPEECH_ONLY.md) is a clean teleprompter version. A Word copy is included as `docs/ChainGuard_Demo_Script.docx`.

1. Open the app at 1440×1000 or a similar desktop size. Set zoom to 90–100%.
2. Click **Reset demo → Reset demo**. All counters should be zero.
3. Run the four main cards from left to right.
4. For human approval: **Run scenario → Switch to finance reviewer → Approve as finance reviewer → Execute with recheck**.
5. Show **Audit trail** and **Export evidence**.
6. If time permits, show the **Stale approval** edge case.

A new scenario always starts as the demo operator; the interface switches back automatically if you were reviewing as finance. Finance and operator are intentionally selectable demo sessions. They demonstrate server-side role checks, not real authentication.

### Scenarios and expected observations

| Scenario | What to do | Expected result |
| --- | --- | --- |
| Valid transaction | Run | ₹48,000 request created and verified; tool invoked once |
| Unverified bank | Run | Blocked; bank verification pending; tool invoked zero times |
| Human approval | Run, switch role, approve, execute | ₹7,50,000 held until approval; one invocation after execution |
| Prompt injection | Run; read the open invoice | Malicious text cannot override pending bank verification; zero invocations |
| Stale approval | Choose edge case; run; switch role; approve; change beneficiary; execute | Old approval rejected with `APPROVAL_STALE`; zero invocations; fresh approval can resume |
| Invoice mismatch | Choose edge case; run | Invoice ₹60,000 versus order ₹48,000; blocked |
| Missing evidence | Choose edge case; run | Source unavailable; held without dispatch |
| Duplicate prevention | Choose edge case; run; retry | Existing request returned; invocation count stays at one |

The threshold applies to **reversible mock payment-request creation**. Actual payment settlement is not implemented. This distinction allows a small legitimate request to complete automatically without claiming that an irreversible payment bypasses human review.

## Validate

```bash
npm test
npm run check
npm run build
```

The test suite includes 23 automated policy, persistence, failure and Web Request/Response handler tests. The actual Next.js HTTP server is also exercised during browser verification. See [VALIDATION.md](docs/VALIDATION.md) for the recorded results and limitations.

## How it works

```text
Deterministic scenario actors
  invoice-agent → matching-agent → payment-agent
                            │
                    Structured intent
                            │
        Supplier + PO + receipt + invoice (mock records)
                            │
               Versioned deterministic policy
                            │
                    Enforcement gate
                 BLOCK / HOLD / ALLOW
                            │
            Action-bound human review if required
                            │
           Private mock payment tool, no HTTP route
                            │
               SQLite ledger read-back + audit
```

- `engine.js`: fixtures, baseline, policy checks, approval fingerprinting, private protected tool, audit and SQLite storage.
- `app/layout.jsx` and `app/page.jsx`: Next.js App Router layout, metadata and dashboard page.
- `components/Dashboard.jsx`: React components for the scenarios, evidence, decisions, audit and policies; hooks manage state and mutations.
- `app/api/[...path]/route.js`: Node-runtime Next.js route handlers for the demo API.
- `lib/api.js`: Web Request/Response API, cookie sessions, server-side demo roles and CSRF/origin checks.
- `lib/runtime.js`: server-only SQLite connection and session lifetime, preserved during development reloads.
- `app/globals.css` and `public/favicon.svg`: responsive styling and local brand asset.
- `package-lock.json`: exact dependency lockfile for reproducible installation.
- `test/`: behavior tests for successful execution and prevention of unsafe side effects.
- `docs/`: speech, recording instructions, technical notes and validation results.
- `data/chainguard.sqlite`: generated local state, ignored by Git. Persists after restart.

Approvals use a SHA-256 fingerprint of the action, relevant records, policy version, requester and agent. They expire after five minutes. Every execution rechecks policy. Policy evaluation and mock dispatch run synchronously inside a SQLite transaction; unique invoice and operation keys prevent duplicate creation.

The comparison baseline is implemented in `permissionOnlyBaseline()`: it checks only whether the payment agent can invoke the tool. It deliberately does not check business records. The comparison does **not** establish that an ERP or commercial governance product would fail.

The audit export includes transaction and trace identifiers, causal parent event IDs, identities, policy version, source references and snapshots, action and approval fingerprints, decisions, dispatch results and read-back outcomes.

## Scope and limitations

- SQLite and demo sessions run in one local Node process. This is not configured for multi-instance or serverless deployment.
- The gate protects the mock tool exposed by this application. Real connectors would need independent credential and network boundaries.
- The identity selector is for demonstration. Anyone with local dashboard access can select the finance role; do not present it as production login.
- Fixture source records are server-owned simulation state, not independently authenticated enterprise data.
- Document isolation demonstrates one controlled injection attempt. There is no live extraction model and no general prompt-injection detector.
- No actual settlement, rollback of real payments, distributed transaction handling or external system failure recovery is implemented.
- Logs are persistent but editable by the local machine owner. They are not cryptographically signed or tamper-proof.
- On storage failure, SQLite rolls back the attempted operation; the HTTP server returns a failure. A failed database write cannot also be guaranteed an audit record in that unavailable database.
- Policy checks use whole rupees and exact matching, suitable for these fixtures; production needs minor currency units, taxes, tolerances and partial receipt rules.
- The small fixed tests establish these behaviors only, not general safety, compliance or commercial uniqueness.

## Submission handoff

The MVP, script and repository-ready source are provided. You still need to record the video, upload it to your chosen Drive location, push the source to your own repository and place those links in the prescribed contest presentation. No external upload or repository publication has been performed.
