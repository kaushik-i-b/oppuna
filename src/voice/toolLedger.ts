/** Ensures a tool call id executes at most once. Repeats reuse the first result. */
export function createToolLedger(): {
  claim: (callId: string) => { duplicate: boolean; priorResult?: string };
  complete: (callId: string, result: string) => void;
  remember: (callId: string, result: string) => void;
} {
  const results = new Map<string, string>();
  const inFlight = new Set<string>();

  return {
    claim(callId: string) {
      const prior = results.get(callId);
      if (prior !== undefined) return { duplicate: true, priorResult: prior };
      if (inFlight.has(callId)) return { duplicate: true };
      inFlight.add(callId);
      return { duplicate: false };
    },
    complete(callId: string, result: string) {
      inFlight.delete(callId);
      results.set(callId, result);
    },
    remember(callId: string, result: string) {
      inFlight.delete(callId);
      if (!results.has(callId)) results.set(callId, result);
    },
  };
}
