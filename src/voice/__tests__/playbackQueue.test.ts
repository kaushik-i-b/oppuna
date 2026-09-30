import { createPcmPlaybackQueue } from '@/voice/audio/playbackQueue';
import { pcm16ToBase64 } from '@/voice/pcm';

function chunk(value: number): string {
  return pcm16ToBase64(Int16Array.from([value, value + 1, value + 2, value + 3]));
}

describe('pcm playback queue', () => {
  it('plays chunks in arrival order and records sequence numbers', () => {
    const queue = createPcmPlaybackQueue();
    queue.beginReply('reply-a');
    const first = queue.enqueue('reply-a', chunk(1), 24000);
    const second = queue.enqueue('reply-a', chunk(8), 24000);
    expect(first.sequence).toBe(1);
    expect(second.sequence).toBe(2);
    expect(queue.pull()?.sequence).toBe(1);
    expect(queue.pull()?.sequence).toBe(2);
    expect(queue.pull()).toBeUndefined();
  });

  it('keeps a repeated frame and rejects a flushed reply forever', () => {
    const queue = createPcmPlaybackQueue();
    queue.beginReply('reply-a');
    const audio = chunk(4);
    expect(queue.enqueue('reply-a', audio, 24000).accepted).toBe(true);
    expect(queue.enqueue('reply-a', audio, 24000).accepted).toBe(true);
    expect(queue.enqueue('reply-a', chunk(5), 24000).accepted).toBe(true);
    queue.pull();
    queue.pull();
    queue.pull();
    expect(queue.flush('reply-a').dropped).toBe(0);
    queue.enqueue('reply-a', chunk(9), 24000);
    const stale = queue.enqueue('reply-a', chunk(12), 24000);
    expect(stale.reason).toBe('stale');
    expect(queue.length()).toBe(0);
  });

  it('discards the previous reply when the next one starts and keeps the new chunks', () => {
    const queue = createPcmPlaybackQueue();
    queue.beginReply('reply-a');
    queue.enqueue('reply-a', chunk(1), 24000);
    queue.enqueue('reply-a', chunk(2), 24000);
    const begun = queue.beginReply('reply-b');
    expect(begun.dropped).toBe(2);
    expect(queue.enqueue('reply-a', chunk(3), 24000).reason).toBe('stale');
    expect(queue.enqueue('reply-b', chunk(4), 24000).accepted).toBe(true);
    expect(queue.flush('reply-a').dropped).toBe(0);
    expect(queue.pull()?.replyId).toBe('reply-b');
  });
});
