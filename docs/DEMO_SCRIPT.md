# ChainGuard selection video

**Target length:** about 3 minutes, including brief pauses and clicks.  
**Presentation style:** one presenter, screen recording, calm delivery.  
**Opening:** start on the Control room with all counters at zero.

This script describes the implemented demo. Replace `[team name]` with your team name. Rehearse once; timing depends on speaking pace.

## 0:00–0:25 — The problem

**On screen:** Control room; show the four scenario cards.

**Say:**

“Hello, we’re [team name], and this is ChainGuard for PS 2.1: AI Agent Safety and Control.

An AI agent may have permission to request a payment, but permission alone does not tell us whether the purchase order, goods receipt, invoice and supplier details agree.

ChainGuard checks that complete transaction before the protected action executes.”

## 0:25–0:42 — What is actually built

**On screen:** Point at the workflow from Invoice agent to Payment tool.

**Say:**

“This is our working local MVP. The agent roles and enterprise systems are simulated, but the backend policy checks, approval flow, ledger and audit trail are implemented.

The agent proposes an action. Deterministic policy decides whether it can proceed.”

## 0:42–1:00 — Legitimate automation

**Clicks:** Select **Valid transaction → Run scenario**. Scroll slightly to show the evidence, gate decision and tool counter.

**Say:**

“First, a legitimate forty-eight-thousand-rupee request. The order, receipt and invoice match, and the supplier is verified.

ChainGuard allows the request, invokes the mock tool once, and reads the result back from the ledger. No real money moves.”

**Visible evidence:** “Allowed · request verified”; protected-tool invocations = **1**.

## 1:00–1:25 — A cross-system violation

**Clicks:** Select **Unverified bank → Run scenario**. Show supplier bank status and gate decision.

**Say:**

“Now the payment agent still has permission, and the invoice still matches. But the supplier’s bank-account change is pending verification.

Our permission-only baseline would allow this call. ChainGuard checks the supplier record and blocks it before execution.

The protected-tool count is zero. This demonstrates our transaction-context check against that simple baseline.”

**Visible evidence:** bank status **PENDING**; “Blocked before execution”; invocations = **0**.

## 1:25–1:55 — Human oversight

**Clicks:** Select **Human approval → Run scenario**. Show zero invocations. Click **Switch to finance reviewer → Approve as finance reviewer → Execute with recheck**.

**Say:**

“This seven-lakh-fifty-thousand-rupee request exceeds our review threshold, so it stays on hold.

I’ll switch to the separate demo finance reviewer and approve it. The approval is tied to this exact action and its source records.

Execution rechecks the policy before creating the request. These selectable identities demonstrate role enforcement; they are not production authentication.”

**Visible evidence:** held at **0**, approved but still **0**, then verified at **1**.

## 1:55–2:20 — Untrusted invoice instructions

**Clicks:** Select **Prompt injection → Run scenario**. Scroll to show the expanded invoice text alongside the decision.

**Say:**

“This invoice tells the agent to ignore policy and skip verification.

Those instructions are untrusted document content. They cannot change the authoritative supplier status or grant approval.

The bank remains unverified, so the gate blocks the request with zero tool invocations. This demonstrates isolation for this fixture, not a claim that all prompt injection is solved.”

## 2:20–2:40 — Evidence and validation

**Clicks:** Click **Audit trail**. Expand one **POLICY** event; optionally click **Export evidence**.

**Say:**

“The audit trail links the transaction, requester, source evidence, policy version, approval and verified outcome.

Our twenty-three automated tests pass, including changed approvals, duplicate retries, missing evidence and unauthorized approval attempts.”

**Visible evidence:** expandable event JSON, transaction and trace IDs, record snapshots and policy decision. Only state the test result after running `npm test` successfully on the final source.

## 2:40–3:00 — Why it matters

**Clicks:** Return to **Control room**; leave the counters visible.

**Say:**

“Our focus is transaction integrity across a business workflow. We are not claiming that existing enterprise controls cannot do this.

The next step is to connect a real agent and procurement sandbox, then evaluate more workflows.

ChainGuard’s goal is practical: keep useful automation moving, pause uncertain actions, and make every decision explainable. Thank you.”

## Optional 35-second extension — Stale approval

Use this only if the video can exceed three minutes, or replace part of the standard approval segment.

**Clicks:**

1. In **Explore edge cases**, choose **Stale approval**.
2. **Run scenario → Switch to finance reviewer → Approve as finance reviewer**.
3. Click **Change beneficiary**.
4. Click **Execute with recheck**.
5. Show **approval stale** and **zero** tool invocations.
6. Optionally approve again, then execute to show recovery.

**Say:**

“Approval is not a permanent green light. Here finance approved one beneficiary, but the source record changes before execution.

When we try to execute, the old approval no longer matches. ChainGuard pauses the request and requires a fresh approval. The tool has still never been invoked.

This is the difference between storing an approved flag and verifying what was actually approved.”

## Recording checklist

- Run `npm test` and `npm run check` before recording.
- Use a desktop browser, around 1440×1000 or 1920×1080; 90–100% zoom.
- Reset the demo immediately before recording.
- Keep the microphone close and disable desktop notifications.
- Move the pointer slowly. Pause on the zero-invocation counter after each block.
- Scroll down enough to show the evidence and decision; return to the scenario cards between cases.
- Complete approvals within five minutes; otherwise fresh approval is intentionally required.
- Do not say “payment completed.” Say “mock payment request created and verified.”
- Do not claim real LLM integration, general attack detection, commercial uniqueness or tamper-proof logs.
- Record the screen and voice; this deliverable supplies the app and script, not a finished narrated video.
- Upload the recording and repository yourself, then verify the required sharing permissions.
