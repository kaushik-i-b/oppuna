export interface ParsedToolCall {
  callId: string;
  name: string;
  arguments: unknown;
}

export type ParsedServerEvent =
  | { type: 'session.ready'; sessionId: string }
  | { type: 'session.updated' }
  | { type: 'session.ended' }
  | { type: 'session.error'; message: string; code: string }
  | { type: 'input.speech.started' }
  | { type: 'input.speech.stopped' }
  | { type: 'transcript.user.delta'; delta: string }
  | { type: 'transcript.user'; text: string }
  | { type: 'reply.started'; replyId: string }
  | { type: 'reply.audio'; data: string }
  | { type: 'transcript.agent'; text: string; replyId: string; interrupted: boolean }
  | { type: 'reply.done'; status: 'completed' | 'interrupted' }
  | { type: 'tool.call'; call: ParsedToolCall }
  | { type: 'unknown'; rawType: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseServerEvent(raw: string): ParsedServerEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const event = asRecord(parsed);
  if (!event || typeof event.type !== 'string') return null;

  switch (event.type) {
    case 'session.ready':
      return { type: 'session.ready', sessionId: String(event.session_id ?? '') };
    case 'session.updated':
      return { type: 'session.updated' };
    case 'session.ended':
      return { type: 'session.ended' };
    case 'session.error':
      return {
        type: 'session.error',
        message: typeof event.message === 'string' ? event.message : 'Voice session error',
        code: typeof event.error_code === 'string' ? event.error_code : 'session_error',
      };
    case 'input.speech.started':
      return { type: 'input.speech.started' };
    case 'input.speech.stopped':
      return { type: 'input.speech.stopped' };
    case 'transcript.user.delta':
      return {
        type: 'transcript.user.delta',
        delta: typeof event.delta === 'string' ? event.delta : '',
      };
    case 'transcript.user':
      return { type: 'transcript.user', text: typeof event.text === 'string' ? event.text : '' };
    case 'reply.started':
      return { type: 'reply.started', replyId: String(event.reply_id ?? '') };
    case 'reply.audio':
      return {
        type: 'reply.audio',
        data: typeof event.data === 'string' ? event.data : '',
      };
    case 'transcript.agent':
      return {
        type: 'transcript.agent',
        text: typeof event.text === 'string' ? event.text : '',
        replyId: String(event.reply_id ?? ''),
        interrupted: event.interrupted === true,
      };
    case 'reply.done':
      return {
        type: 'reply.done',
        status: event.status === 'interrupted' ? 'interrupted' : 'completed',
      };
    case 'tool.call':
      if (typeof event.call_id !== 'string' || typeof event.name !== 'string') return null;
      return {
        type: 'tool.call',
        call: { callId: event.call_id, name: event.name, arguments: event.arguments ?? {} },
      };
    default:
      return { type: 'unknown', rawType: event.type };
  }
}

export function toolResultMessage(callId: string, result: unknown): string {
  return JSON.stringify({
    type: 'tool.result',
    call_id: callId,
    result: JSON.stringify(result),
  });
}
