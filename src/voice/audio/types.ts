export interface VoiceAudioPort {
  readonly supportsStreaming: boolean;
  startCapture(onChunk: (base64Pcm: string) => void): Promise<void>;
  stopCapture(): Promise<void>;
  playPcm16Base64(base64Pcm: string, sampleRate: number): void;
  stopPlayback(): void;
}
