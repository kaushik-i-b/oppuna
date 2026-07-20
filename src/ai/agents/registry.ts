/**
 * Agent registry — maps agent ids to chat companions.
 */

import type { ChatAgent } from '@/ai/agents/types';
import { mentalHealthAgent } from '@/ai/agents/mentalHealthAgent';

const agents = new Map<string, ChatAgent>([[mentalHealthAgent.id, mentalHealthAgent]]);

/** Default agent used by the chat screen. */
export const DEFAULT_AGENT_ID = mentalHealthAgent.id;

export function getAgent(id: string = DEFAULT_AGENT_ID): ChatAgent {
  const agent = agents.get(id);
  if (!agent) {
    throw new Error(`Unknown chat agent: ${id}`);
  }
  return agent;
}

export function listAgents(): ChatAgent[] {
  return [...agents.values()];
}

export function registerAgent(agent: ChatAgent): void {
  agents.set(agent.id, agent);
}
