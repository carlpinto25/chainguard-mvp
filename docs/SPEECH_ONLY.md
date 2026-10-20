# ChainGuard — speech only

Hello, we’re [team name], and this is ChainGuard for PS 2.1: AI Agent Safety and Control.

An AI agent may have permission to request a payment, but permission alone does not tell us whether the purchase order, goods receipt, invoice and supplier details agree.

ChainGuard checks that complete transaction before the protected action executes.

This is our working local MVP. The agent roles and enterprise systems are simulated, but the backend policy checks, approval flow, ledger and audit trail are implemented.

The agent proposes an action. Deterministic policy decides whether it can proceed.

First, a legitimate forty-eight-thousand-rupee request. The order, receipt and invoice match, and the supplier is verified.

ChainGuard allows the request, invokes the mock tool once, and reads the result back from the ledger. No real money moves.

Now the payment agent still has permission, and the invoice still matches. But the supplier’s bank-account change is pending verification.

Our permission-only baseline would allow this call. ChainGuard checks the supplier record and blocks it before execution.

The protected-tool count is zero. This demonstrates our transaction-context check against that simple baseline.

This seven-lakh-fifty-thousand-rupee request exceeds our review threshold, so it stays on hold.

I’ll switch to the separate demo finance reviewer and approve it. The approval is tied to this exact action and its source records.

Execution rechecks the policy before creating the request. These selectable identities demonstrate role enforcement; they are not production authentication.

This invoice tells the agent to ignore policy and skip verification.

Those instructions are untrusted document content. They cannot change the authoritative supplier status or grant approval.

The bank remains unverified, so the gate blocks the request with zero tool invocations. This demonstrates isolation for this fixture, not a claim that all prompt injection is solved.

The audit trail links the transaction, requester, source evidence, policy version, approval and verified outcome.

Our twenty-three automated tests pass, including changed approvals, duplicate retries, missing evidence and unauthorized approval attempts.

Our focus is transaction integrity across a business workflow. We are not claiming that existing enterprise controls cannot do this.

The next step is to connect a real agent and procurement sandbox, then evaluate more workflows.

ChainGuard’s goal is practical: keep useful automation moving, pause uncertain actions, and make every decision explainable. Thank you.
