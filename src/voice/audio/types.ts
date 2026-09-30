export interface VoiceAudioPort {
  readonly supportsStreaming: boolean;
  startCapture(onChunk: (base64Pcm: string) => void): Promise<void>;
  stopCapture(): Promise<void>;
  /** Starts a reply. Audio still queued for a different reply is discarded. */
  beginReply(replyId: string): void;
  playPcm16Base64(base64Pcm: string, sampleRate: number, replyId: string): void;
  /** Drops queued audio for this reply. Other replies keep playing. */
  stopPlayback(replyId?: string): number;
}
