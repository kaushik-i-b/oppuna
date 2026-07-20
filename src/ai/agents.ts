/**
 * AI agents (personas) for the Oppuna chat.
 *
 * An agent is a named persona with its own system-prompt persona block. All
 * agents run on the same on-device llama.rn model and share the same hard
 * safety rules — the persona only steers tone and focus, never guardrails.
 * The safety engine and response validator remain the enforcement layers.
 */

export type AgentId = 'companion' | 'mental_health';

export interface AgentDefinition {
  id: AgentId;
  /** Translation keys used by the chat UI. */
  nameKey: `chat.agents.${AgentId}.name`;
  descriptionKey: `chat.agents.${AgentId}.description`;
  /** Emoji shown next to the agent name in the picker. */
  icon: string;
  /**
   * Persona block injected at the top of the system prompt. Steers tone and
   * technique only — the shared hard rules are appended after it and always
   * take precedence.
   */
  persona: string;
}

/** The original Oppuna wellness companion — the default agent. */
export const COMPANION_AGENT: AgentDefinition = {
  id: 'companion',
  nameKey: 'chat.agents.companion.name',
  descriptionKey: 'chat.agents.companion.description',
  icon: '🌿',
  persona: [
    'You are Oppuna, a warm offline wellness companion running entirely on the user’s device.',
    'Style: talk like a caring friend, not a script. Acknowledge what they said in your own words.',
  ].join('\n'),
};

/**
 * Mental health support agent — a specialised persona focused on emotional
 * support with light evidence-informed self-help techniques (CBT-style
 * reframing, grounding, breathing, journaling). Runs on the same on-device
 * llama model; it is explicitly NOT therapy and never overrides safety.
 */
export const MENTAL_HEALTH_AGENT: AgentDefinition = {
  id: 'mental_health',
  nameKey: 'chat.agents.mental_health.name',
  descriptionKey: 'chat.agents.mental_health.description',
  icon: '💚',
  persona: [
    'You are Oppuna’s mental health support companion, running entirely offline on the user’s device.',
    'Your focus: help the user notice, name, and sit with feelings, and gently offer one small evidence-informed self-help step when it fits — such as reframing an unhelpful thought, a grounding exercise (like 5-4-3-2-1), slow breathing, or a short journaling prompt.',
    'Validate first, suggest second. Never push a technique on someone who just wants to be heard.',
    'If the user mentions persistent or worsening distress, gently encourage them to talk to a mental health professional — as a caring suggestion, not an instruction.',
  ].join('\n'),
};

export const AGENTS: readonly AgentDefinition[] = [COMPANION_AGENT, MENTAL_HEALTH_AGENT];

export const DEFAULT_AGENT_ID: AgentId = 'companion';

/** Resolve an agent by id, falling back to the default companion. */
export function getAgent(id?: AgentId | null): AgentDefinition {
  return AGENTS.find((agent) => agent.id === id) ?? COMPANION_AGENT;
}

export function isAgentId(value: unknown): value is AgentId {
  return AGENTS.some((agent) => agent.id === value);
}
