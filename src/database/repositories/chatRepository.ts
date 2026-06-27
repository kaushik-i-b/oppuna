import { getDatabase } from '@/database/client';
import { createId } from '@/utils/id';
import type { ChatMessage, ChatRole, ChatSession, MoodKey } from '@/types';

interface SessionRow {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  intent: string | null;
  mood: string | null;
  created_at: number;
}

function rowToSession(row: SessionRow): ChatSession {
  return { id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at };
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role as ChatRole,
    content: row.content,
    intent: row.intent,
    mood: (row.mood as MoodKey | null) ?? null,
    createdAt: row.created_at,
  };
}

export interface AddMessageInput {
  sessionId: string;
  role: ChatRole;
  content: string;
  intent?: string | null;
  mood?: MoodKey | null;
}

export const chatRepository = {
  async createSession(title = 'Conversation'): Promise<ChatSession> {
    const now = Date.now();
    const session: ChatSession = { id: createId(), title, createdAt: now, updatedAt: now };
    const db = getDatabase();
    await db.runAsync(
      'INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [session.id, session.title, session.createdAt, session.updatedAt],
    );
    return session;
  },

  async listSessions(): Promise<ChatSession[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<SessionRow>(
      'SELECT * FROM chat_sessions ORDER BY updated_at DESC',
    );
    return rows.map(rowToSession);
  },

  async addMessage(input: AddMessageInput): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: createId(),
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      intent: input.intent ?? null,
      mood: input.mood ?? null,
      createdAt: Date.now(),
    };
    const db = getDatabase();
    await db.runAsync(
      'INSERT INTO chat_messages (id, session_id, role, content, intent, mood, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [message.id, message.sessionId, message.role, message.content, message.intent, message.mood, message.createdAt],
    );
    await db.runAsync('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', [
      message.createdAt,
      message.sessionId,
    ]);
    return message;
  },

  async listMessages(sessionId: string): Promise<ChatMessage[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<MessageRow>(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId],
    );
    return rows.map(rowToMessage);
  },

  async clearSession(sessionId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM chat_messages WHERE session_id = ?', [sessionId]);
  },
};
