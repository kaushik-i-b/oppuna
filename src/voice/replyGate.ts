/**
 * Drops audio that belongs to an interrupted or superseded reply.
 * A newer reply cannot be overwritten by chunks from an older one.
 */
export function createReplyGate(): {
  beginReply: () => number;
  interrupt: (replyGeneration: number) => void;
  acceptAudio: (replyGeneration: number) => boolean;
  current: () => number;
} {
  let generation = 0;
  let silenced = false;

  return {
    beginReply() {
      generation += 1;
      silenced = false;
      return generation;
    },
    interrupt(replyGeneration: number) {
      if (replyGeneration === generation) silenced = true;
    },
    acceptAudio(replyGeneration: number) {
      return replyGeneration === generation && !silenced;
    },
    current() {
      return generation;
    },
  };
}
