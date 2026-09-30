/**
 * Mints a one-time AssemblyAI Voice Agent token.
 * The API key stays in the server environment and is never sent to the app.
 *
 *   ASSEMBLYAI_API_KEY=... node server/voice-token-server.mjs
 */
import http from 'node:http';

const PORT = Number(process.env.VOICE_TOKEN_PORT || 8787);
const HOST = process.env.VOICE_TOKEN_HOST || '127.0.0.1';

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': new TextEncoder().encode(payload).length,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }
  if (req.method !== 'GET' || url.pathname !== '/voice/token') {
    send(res, 404, { error: 'not_found' });
    return;
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    send(res, 500, { error: 'missing_api_key' });
    return;
  }

  const tokenUrl = new URL('https://agents.assemblyai.com/v1/token');
  tokenUrl.searchParams.set('expires_in_seconds', '300');
  tokenUrl.searchParams.set('max_session_duration_seconds', '1800');

  try {
    const response = await fetch(tokenUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const text = await response.text();
    if (!response.ok) {
      send(res, 502, { error: 'assemblyai_token_failed' });
      return;
    }
    const parsed = JSON.parse(text);
    if (!parsed.token) {
      send(res, 502, { error: 'assemblyai_token_missing' });
      return;
    }
    send(res, 200, {
      token: parsed.token,
      expiresInSeconds: 300,
      websocketUrl: 'wss://agents.assemblyai.com/v1/ws',
    });
  } catch {
    send(res, 502, { error: 'assemblyai_unreachable' });
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Oppuna voice token server listening on http://${HOST}:${PORT}/voice/token\n`);
});
