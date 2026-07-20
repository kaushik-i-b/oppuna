export type { AgentPromptInput, ChatAgent } from '@/ai/agents/types';
export {
  mentalHealthAgent,
  buildMentalHealthSystemPrompt,
} from '@/ai/agents/mentalHealthAgent';
export {
  DEFAULT_AGENT_ID,
  getAgent,
  listAgents,
  registerAgent,
} from '@/ai/agents/registry';
