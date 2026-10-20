import { randomBytes, timingSafeEqual } from 'node:crypto';
import { IDENTITIES } from '../engine.js';

// The same Web Request/Response handler is used by Next.js and the API tests.
export function createApi(engine) {
  const sessions = new Map();
  return async function handle(request) {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    const send = (status, body) => Response.json(body, { status, headers });
    const url = new URL(request.url);
    const host = request.headers.get('host') || url.host;
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return send(403, { error: 'Local demo accepts only localhost requests.' });
    try {
      const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)cg_session=([a-f0-9]+)/)?.[1];
      let session = sessions.get(cookie);
      if (!session && request.method === 'GET' && url.pathname === '/api/state') {
        const token = randomBytes(24).toString('hex');
        session = { identity: IDENTITIES.operator, csrf: randomBytes(24).toString('hex') };
        sessions.set(token, session);
        headers.set('Set-Cookie', `cg_session=${token}; HttpOnly; SameSite=Strict; Path=/`);
      }
      if (!session) return send(401, { error: 'Open the demo dashboard to start a session.' });
      if (request.method === 'GET' && url.pathname === '/api/state') return send(200, { ...engine.snapshot(), identity: session.identity, csrf: session.csrf });
      if (request.method === 'GET' && url.pathname === '/api/export') {
        headers.set('Content-Disposition', 'attachment; filename="chainguard-audit.json"');
        return send(200, { exportedAt: new Date().toISOString(), simulation: true, ...engine.snapshot() });
      }
      if (request.method !== 'POST') return send(404, { error: 'Route not found. Protected tools have no direct route.' });
      const origin = request.headers.get('origin');
      if (origin && origin !== `http://${host}`) return send(403, { error: 'Cross-origin mutation rejected.' });
      const csrf = Buffer.from(request.headers.get('x-csrf-token') || '');
      const expected = Buffer.from(session.csrf);
      if (csrf.length !== expected.length || !timingSafeEqual(csrf, expected)) return send(403, { error: 'Invalid session token. Refresh the page.' });
      let raw = '';
      if (request.body) {
        const reader = request.body.getReader();
        const decoder = new TextDecoder();
        let size = 0;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 8192) { await reader.cancel(); return send(413, { error: 'Request too large.' }); }
          raw += decoder.decode(value, { stream: true });
        }
        raw += decoder.decode();
      }
      let body;
      try { body = JSON.parse(raw || '{}'); }
      catch { return send(400, { error: 'Invalid JSON.' }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return send(400, { error: 'Expected a JSON object.' });
      let result;
      if (url.pathname === '/api/session') {
        if (!Object.hasOwn(IDENTITIES, body.role)) return send(400, { error: 'Unknown demo identity.' });
        session.identity = IDENTITIES[body.role];
        result = { identity: session.identity };
      } else if (url.pathname === '/api/run') {
        if (session.identity.role !== 'operator') return send(403, { error: 'Start scenarios as the demo operator, then switch to finance for review.' });
        result = engine.start(body.scenario, session.identity);
      } else if (url.pathname === '/api/approve') {
        result = engine.approve(body.id, session.identity);
        if (result.rejected) return send(403, { error: result.rejected });
      } else if (url.pathname === '/api/execute') result = engine.execute(body.id, session.identity);
      else if (url.pathname === '/api/change-beneficiary') result = engine.changeBeneficiary(body.id, session.identity);
      else if (url.pathname === '/api/reset') { engine.reset(); session.identity = IDENTITIES.operator; result = { reset: true }; }
      else return send(404, { error: 'Route not found. Protected tools have no direct route.' });
      return send(200, { result });
    } catch (error) {
      if (!error.status) console.error(error);
      return send(error.status || 500, { error: error.status ? error.message : 'Operation failed closed. No partial change was committed.' });
    }
  };
}
