/**
 * Voice session controller — deterministic state machine + transcript +
 * interruption + reflection drafting for "Talk to Oppuna".
 *
 * States: IDLE → CONNECTING → LISTENING ⇄ (THINKING → SPEAKING),
 * INTERRUPTED (SPEAKING → LISTENING on barge-in), SAVING, ERROR.
 * All transitions funnel through `transition()`, which enforces the allowed
 * graph and emits dev-observable logs. One session = one controller = one
 * ToolExecutor, so state can never leak between sessions.
 *
 * Interruption: `interrupt()` stops audio immediately, bumps the generation
 * counter (late replies are dropped and can never overwrite newer state),
 * and preserves context for the new turn.
 */

import { createId } from '@/utils/id';
import { composeVoiceReply, extractMemoryCandidates } from '@/voice/conversationEngine';
import { reflectionRepository } from '@/voice/reflectionRepository';
import { ToolExecutor } from '@/voice/tools';
import type {
  MemoryCandidate,
  ReflectionDraft,
  TranscriptSegment,
  VoiceState,
} from '@/voice/types';
import { logVoiceEvent } from '@/voice/voiceLogger';

export interface VoiceSpeaker {
  speak(text: string): Promise<void>;
  stop(): void;
}

export interface VoiceServiceLike {
  setEvents(events: {
    onPartial?: (text: string) => void;
    onFinal?: (text: string, turnId: number) => void;
    onError?: (message: string, recoverable: boolean) => void;
  }): void;
  connect(): Promise<unknown>;
  disconnect(): Promise<void>;
}

const ALLOWED: Record<VoiceState, VoiceState[]> = {
  IDLE: ['CONNECTING'],
  CONNECTING: ['LISTENING', 'ERROR', 'IDLE'],
  LISTENING: ['THINKING', 'SAVING', 'ERROR', 'IDLE'],
  THINKING: ['SPEAKING', 'LISTENING', 'ERROR', 'IDLE'],
  SPEAKING: ['INTERRUPTED', 'LISTENING', 'ERROR', 'IDLE'],
  INTERRUPTED: ['LISTENING', 'THINKING', 'ERROR', 'IDLE'],
  SAVING: ['LISTENING', 'ERROR', 'IDLE'],
  ERROR: ['IDLE', 'CONNECTING'],
};

export interface VoiceSessionSnapshot {
  state: VoiceState;
  segments: TranscriptSegment[];
  livePartial: string;
  draft: ReflectionDraft | null;
  savedReflectionId: string | null;
  errorMessage: string | null;
  crisis: boolean;
}

type Listener = (snapshot: VoiceSessionSnapshot) => void;

const THEME_KEYWORDS: { theme: string; words: string[] }[] = [
  { theme: 'work', words: ['work', 'manager', 'boss', 'deadline', 'meeting', 'job', 'colleague'] },
  { theme: 'sleep', words: ['sleep', 'insomnia', 'tired', 'exhausted', 'rest'] },
  { theme: 'family', words: ['family', 'partner', 'kids', 'mom', 'dad', 'mother', 'father'] },
  { theme: 'health', words: ['health', 'anxious', 'anxiety', 'stress', 'worried', 'panic'] },
  { theme: 'movement', words: ['walk', 'exercise', 'run', 'yoga', 'gym'] },
];

const MOOD_WORDS = [
  'exhausted', 'stressed', 'anxious', 'sad', 'overwhelmed', 'tired', 'heavy',
  'calm', 'hopeful', 'okay', 'good', 'lighter', 'better', 'low', 'rough',
];

export function detectMoodWord(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of MOOD_WORDS) {
    if (lower.includes(word)) return word;
  }
  return null;
}

/** Parse "don't include (the part about) X" into an excluded topic. Pure. */
export function parseExcludedTopic(text: string): string | null {
  const match = text.match(
    /(?:don't|do not|dont)\s+include\s+(?:the\s+part\s+about\s+|about\s+)?(.+?)(?:[.!?]|$)/i,
  );
  const topic = match?.[1]?.trim();
  return topic && topic.length > 1 ? topic : null;
}

export class VoiceSessionController {
  private state: VoiceState = 'IDLE';
  private segments: TranscriptSegment[] = [];
  private partialId: string | null = null;
  private draft: ReflectionDraft | null = null;
  private savedReflectionId: string | null = null;
  private errorMessage: string | null = null;
  private crisis = false;
  private sessionId: string | null = null;
  private generation = 0;
  private lastFinalText = '';
  private lastFinalAt = 0;
  private readonly listeners = new Set<Listener>();
  private readonly tools = new ToolExecutor();

  constructor(
    private readonly service: VoiceServiceLike,
    private readonly speaker: VoiceSpeaker,
    private readonly relayCrisis?: (category: string) => void,
  ) {
    this.service.setEvents({
      onPartial: (text) => this.applyPartial(text),
      onFinal: (text) => void this.applyFinal(text),
      onError: (message) => this.fail(message),
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  snapshot(): VoiceSessionSnapshot {
    const livePartial = this.partialId
      ? (this.segments.find((s) => s.id === this.partialId)?.text ?? '')
      : '';
    return {
      state: this.state,
      segments: [...this.segments],
      livePartial,
      draft: this.draft,
      savedReflectionId: this.savedReflectionId,
      errorMessage: this.errorMessage,
      crisis: this.crisis,
    };
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // UI listeners must never break the session.
      }
    }
  }

  private transition(to: VoiceState, reason?: string): boolean {
    if (this.state === to) return true;
    const allowed = ALLOWED[this.state] ?? [];
    if (!allowed.includes(to)) {
      logVoiceEvent('voice:error', { error: `illegal transition ${this.state}→${to}` });
      return false;
    }
    this.state = to;
    if (to !== 'ERROR') this.errorMessage = null;
    logVoiceEvent(
      to === 'LISTENING' ? 'voice:listening' : to === 'ERROR' ? 'voice:error' : 'voice:turn-detected',
      reason ? { reason } : undefined,
    );
    this.emit();
    return true;
  }

  async start(): Promise<void> {
    if (this.state !== 'IDLE' && this.state !== 'ERROR') return;
    this.errorMessage = null;
    this.transition('CONNECTING', 'user started session');
    try {
      this.sessionId = await reflectionRepository.createVoiceSession();
      await this.service.connect();
      this.transition('LISTENING', 'session established');
    } catch (error) {
      this.fail(error instanceof Error ? error.message : 'Could not start the voice session.');
    }
  }

  /** Partial transcripts update smoothly in place — never duplicated. */
  applyPartial(text: string): void {
    if (this.state !== 'LISTENING' && this.state !== 'INTERRUPTED' && this.state !== 'SPEAKING') return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (this.partialId) {
      const existing = this.segments.find((s) => s.id === this.partialId);
      if (existing) {
        existing.text = trimmed;
        this.emit();
        return;
      }
    }
    const segment: TranscriptSegment = {
      id: createId(),
      speaker: 'USER',
      text: trimmed,
      final: false,
      createdAt: Date.now(),
    };
    this.partialId = segment.id;
    this.segments = [...this.segments, segment];
    this.emit();
  }

  /** Final transcripts replace the partial — duplicates are dropped. */
  async applyFinal(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = Date.now();
    if (trimmed === this.lastFinalText && now - this.lastFinalAt < 2000) return;
    this.lastFinalText = trimmed;
    this.lastFinalAt = now;
    logVoiceEvent('voice:transcript-final');

    if (this.partialId) {
      this.segments = this.segments.filter((s) => s.id !== this.partialId);
      this.partialId = null;
    }
    this.segments = [
      ...this.segments,
      { id: createId(), speaker: 'USER', text: trimmed, final: true, createdAt: now },
    ];

    // Barge-in: a final transcript while speaking is an interruption.
    if (this.state === 'SPEAKING') {
      this.interrupt();
    }
    if (this.state !== 'LISTENING' && this.state !== 'INTERRUPTED') {
      this.emit();
      return;
    }
    await this.respond(trimmed);
  }

  private async respond(userText: string): Promise<void> {
    if (!this.transition('THINKING', 'turn detected')) return;
    const myGeneration = ++this.generation;
    const excluded = parseExcludedTopic(userText);
    if (excluded && this.draft) {
      this.draft = { ...this.draft, excludedTopics: [...this.draft.excludedTopics, excluded] };
    }
    try {
      const reply = await composeVoiceReply(userText, {
        sessionId: this.sessionId ?? 'voice',
        recentUserTexts: this.segments.filter((s) => s.speaker === 'USER' && s.final).map((s) => s.text),
        recentAgentTexts: this.segments.filter((s) => s.speaker === 'OPPUNA').map((s) => s.text),
      });
      if (myGeneration !== this.generation) return; // superseded by interruption
      if (reply.crisis) {
        this.crisis = true;
        this.relayCrisis?.('panic_emergency');
      }
      this.segments = [
        ...this.segments,
        { id: createId(), speaker: 'OPPUNA', text: reply.text, final: true, createdAt: Date.now() },
      ];
      if (!this.transition('SPEAKING', 'agent response started')) return;
      logVoiceEvent('voice:agent-response-started');
      await this.speaker.speak(reply.text);
      if (myGeneration !== this.generation) return; // interrupted mid-speech
      logVoiceEvent('voice:agent-response-spoken');
      this.transition('LISTENING', 'response finished');
    } catch (error) {
      if (myGeneration !== this.generation) return;
      this.fail(error instanceof Error ? error.message : 'I lost my train of thought.');
    }
  }

  /**
   * Barge-in: stop TTS/audio immediately, keep context, go back to listening.
   * Late replies from the interrupted generation are discarded.
   */
  interrupt(): void {
    if (this.state !== 'SPEAKING' && this.state !== 'THINKING') return;
    try {
      this.speaker.stop();
    } catch {
      // Audio teardown is best-effort.
    }
    this.generation += 1;
    logVoiceEvent('voice:interruption');
    this.transition('INTERRUPTED', 'user interrupted');
    this.transition('LISTENING', 'resumed listening');
  }

  /** Build a reviewable reflection draft from the session transcript. */
  buildDraft(): ReflectionDraft | null {
    const userTexts = this.segments.filter((s) => s.speaker === 'USER' && s.final).map((s) => s.text);
    if (userTexts.length === 0) return null;
    const joined = userTexts.join(' ');
    const sentences = joined.match(/[^.!?]+[.!?]+["']?|\S[^.!?]*$/g) ?? [joined];
    const summary = sentences.slice(0, 3).join(' ').trim().slice(0, 600) || joined.slice(0, 600);
    const lower = joined.toLowerCase();
    const themes = THEME_KEYWORDS.filter((t) => t.words.some((w) => lower.includes(w))).map((t) => t.theme);
    const concerns = sentences
      .filter((s) => /\b(worr|anxi|afraid|stuck|can't|cannot|hard to|keep thinking|overwhelm)/i.test(s))
      .map((s) => s.trim())
      .slice(0, 3);
    const positiveMoments = sentences
      .filter((s) => /\b(help|better|grateful|lighter|walk|calm|kind|good moment)/i.test(s))
      .map((s) => s.trim())
      .slice(0, 3);
    const commitments = sentences
      .filter((s) => /\b(i will|i'm going to|i am going to|tomorrow|promise|i'll)\b/i.test(s))
      .map((s) => s.trim())
      .slice(0, 3);
    const mood = detectMoodWord(joined) ?? '';
    const excludedTopics = this.draft?.excludedTopics ?? [];
    // Preserve previously detected exclusions from the live conversation.
    for (const text of userTexts) {
      const topic = parseExcludedTopic(text);
      if (topic && !excludedTopics.includes(topic)) excludedTopics.push(topic);
    }
    const candidates = extractMemoryCandidates(userTexts).map((text) => ({
      id: createId(),
      text,
      approved: true,
      edited: false,
    }));
    this.draft = { summary, mood, themes, concerns, positiveMoments, commitments, excludedTopics, memoryCandidates: candidates };
    this.emit();
    return this.draft;
  }

  setMemoryApproval(candidateId: string, approved: boolean): void {
    if (!this.draft) return;
    this.draft = {
      ...this.draft,
      memoryCandidates: this.draft.memoryCandidates.map((c) =>
        c.id === candidateId ? { ...c, approved } : c,
      ),
    };
    this.emit();
  }

  editMemoryCandidate(candidateId: string, text: string): void {
    if (!this.draft) return;
    this.draft = {
      ...this.draft,
      memoryCandidates: this.draft.memoryCandidates.map((c) =>
        c.id === candidateId ? { ...c, text: text.trim(), edited: true } : c,
      ),
    };
    this.emit();
  }

  updateDraft(patch: Partial<ReflectionDraft>): void {
    if (!this.draft) return;
    this.draft = { ...this.draft, ...patch };
    this.emit();
  }

  addExcludedTopic(topic: string): void {
    if (!this.draft) return;
    const trimmed = topic.trim();
    if (!trimmed || this.draft.excludedTopics.includes(trimmed)) return;
    this.draft = { ...this.draft, excludedTopics: [...this.draft.excludedTopics, trimmed] };
    this.emit();
  }

  /** Persist the user-approved reflection. Idempotent per session+dsummary. */
  async saveDraft(): Promise<string | null> {
    if (!this.draft || !this.sessionId) return null;
    if (!this.transition('SAVING', 'saving reflection')) return null;
    try {
      const draft = this.draft;
      const toolCallId = `save-reflection:${this.sessionId}:${draft.summary.length}:${draft.summary.slice(0, 32)}`;
      const persisted = (await this.tools.execute(
        toolCallId,
        'save_reflection',
        {
          summary: draft.summary,
          mood: draft.mood,
          themes: draft.themes,
          concerns: draft.concerns,
          positiveMoments: draft.positiveMoments,
          commitments: draft.commitments,
          excludedTopics: draft.excludedTopics,
          memoryCandidates: draft.memoryCandidates.filter((c) => c.approved).map((c) => c.text),
        },
        this.sessionId,
      )) as { id: string };
      await reflectionRepository.approveReflection(persisted.id);
      const memories = await reflectionRepository.listMemories(persisted.id);
      const byText = new Map(memories.map((m) => [m.text, m.id]));
      for (const candidate of draft.memoryCandidates) {
        const id = candidate.text ? byText.get(candidate.text) : undefined;
        if (id) {
          await reflectionRepository.setMemoryApproval(id, candidate.approved);
          if (candidate.approved) logVoiceEvent('voice:memory-approved');
        }
      }
      this.savedReflectionId = persisted.id;
      this.transition('LISTENING', 'reflection saved');
      return persisted.id;
    } catch (error) {
      this.fail(error instanceof Error ? error.message : 'Could not save the reflection.');
      return null;
    }
  }

  /** "Forget this conversation" — deletes session context, keeps approved memories. */
  async forget(): Promise<void> {
    try {
      this.speaker.stop();
    } catch {
      // Best-effort.
    }
    this.generation += 1;
    if (this.sessionId) {
      try {
        await reflectionRepository.forgetSession(this.sessionId);
      } catch {
        // Local cleanup below still applies.
      }
    }
    this.segments = [];
    this.partialId = null;
    this.draft = null;
    this.savedReflectionId = null;
    this.crisis = false;
    this.sessionId = null;
    this.lastFinalText = '';
    this.transition('IDLE', 'conversation forgotten');
    // Edge: forget() from CONNECTING/ERROR — force reset without violating graph.
    if (this.state !== 'IDLE') {
      this.state = 'IDLE';
      this.emit();
    }
  }

  async end(): Promise<void> {
    try {
      this.speaker.stop();
    } catch {
      // Best-effort.
    }
    this.generation += 1;
    if (this.sessionId) {
      try {
        await reflectionRepository.saveSessionTranscript(
          this.sessionId,
          JSON.stringify(this.segments.map((s) => ({ speaker: s.speaker, text: s.text, at: s.createdAt }))),
        );
        await reflectionRepository.endVoiceSession(this.sessionId);
      } catch {
        // Ending must succeed even if persistence fails.
      }
      this.sessionId = null;
    }
    try {
      await this.service.disconnect();
    } catch {
      // Disconnect is best-effort.
    }
    logVoiceEvent('voice:session-ended');
    if (this.state !== 'IDLE') {
      if (!this.transition('IDLE', 'session ended')) {
        this.state = 'IDLE';
        this.emit();
      }
    }
  }

  private fail(message: string): void {
    this.errorMessage = message;
    try {
      this.speaker.stop();
    } catch {
      // Best-effort.
    }
    if (!this.transition('ERROR', message)) {
      this.state = 'ERROR';
    }
    this.emit();
  }

  recover(): void {
    this.errorMessage = null;
    this.transition('IDLE', 'recovered');
    if (this.state !== 'IDLE') {
      this.state = 'IDLE';
      this.emit();
    }
  }

  getToolExecutor(): ToolExecutor {
    return this.tools;
  }
}

export type { MemoryCandidate };
