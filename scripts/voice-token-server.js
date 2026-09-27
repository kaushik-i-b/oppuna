/**
 * Minimal local token server for "Talk to Oppuna" development.
 *
 * Mints short-lived AssemblyAI realtime temporary tokens so the mobile client
 * NEVER embeds your long-lived API key. Run it on your dev machine and point
 * the app at it with EXPO_PUBLIC_VOICE_TOKEN_URL.
 *
 *   ASSEMBLYAI_API_KEY=aai_... PORT=8787 node scripts/voice-token-server.js
 *
 * Endpoints:
 *   POST /api/voice-token -> { "token": "<temporary token>", "expiresIn": 900 }
 *   GET  /api/health      -> { "ok": true }
 *
 * Production: deploy this (or equivalent) behind your own auth and set
 * EXPO_PUBLIC_VOICE_TOKEN_URL to its public URL. Zero app-code changes needed.
 */

const http = require('http');

const PORT = Number(process.env.PORT ?? 8787);
const API_KEY = process.env.ASSEMBLYAI_API_KEY ?? '';
const TTL = Number(process.env.VOICE_TOKEN_TTL_SECONDS ?? 900);

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function mintToken() {
  const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
    method: 'POST',
    headers: {
      Authorization: API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expires_in_seconds: TTL }),
  });
  if (!response.ok) {
    throw new Error(`AssemblyAI token endpoint returned ${response.status}`);
  }
  const body = await response.json();
  if (!body.token) throw new Error('AssemblyAI returned no token');
  return body.token;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (req.method === 'POST' && req.url === '/api/voice-token') {
      if (!API_KEY) {
        sendJson(res, 500, { error: 'Server misconfigured: ASSEMBLYAI_API_KEY missing' });
        return;
      }
      const token = await mintToken();
      sendJson(res, 200, { token, expiresIn: TTL });
      return;
    }
    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 502, { error: String((error && error.message) || error) });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[voice-token-server] listening on http://localhost:${PORT}`);
});
