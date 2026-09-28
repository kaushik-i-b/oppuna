import { beginVoiceNetworkWindow, endVoiceNetworkWindow } from '@/services/networkGuard';

let overrideBaseUrl: string | null = null;

/** Phone builds cannot use 127.0.0.1. The screen sets the computer that runs the token server. */
export function setVoiceTokenBaseUrl(url: string): void {
  const trimmed = url.trim().replace(/\/$/, '');
  overrideBaseUrl = trimmed.length > 0 ? trimmed : null;
}

export function voiceTokenBaseUrl(): string {
  return (overrideBaseUrl ?? process.env.EXPO_PUBLIC_VOICE_TOKEN_URL ?? 'http://127.0.0.1:8787').replace(
    /\/$/,
    '',
  );
}

/** Public token endpoint. The AssemblyAI API key stays on the token server. */
export function voiceTokenEndpoint(): string {
  return `${voiceTokenBaseUrl()}/voice/token`;
}

export async function fetchVoiceToken(): Promise<{ token: string }> {
  const endpoint = voiceTokenEndpoint();
  let host = '127.0.0.1';
  try {
    host = new URL(endpoint).hostname;
  } catch {
    host = '127.0.0.1';
  }
  beginVoiceNetworkWindow([host, 'agents.assemblyai.com']);
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(
        'Could not start a voice session. Run npm run voice:token with ASSEMBLYAI_API_KEY set, then try again.',
      );
    }
    const body = (await response.json()) as { token?: string };
    if (!body.token) {
      throw new Error('The voice token server did not return a token.');
    }
    return { token: body.token };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Could not start')) throw error;
    if (error instanceof Error && error.message.includes('token')) throw error;
    throw new Error(
      'Could not reach the voice token server. Start it with npm run voice:token, then try again.',
    );
  } finally {
    endVoiceNetworkWindow();
  }
}
