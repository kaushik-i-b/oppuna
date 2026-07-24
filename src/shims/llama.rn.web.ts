/**
 * Web stub for llama.rn — native GGUF inference is not available in browsers.
 * Metro resolves `llama.rn` to this file when platform === 'web'.
 */

export type TokenData = {
  token: string;
};

export type NativeCompletionResult = {
  text: string;
  content?: string;
};

export type LlamaContext = {
  gpu: boolean;
  completion: (
    params: Record<string, unknown>,
    onToken?: (data: TokenData) => void,
  ) => Promise<NativeCompletionResult>;
  stopCompletion: () => Promise<void> | void;
  release: () => Promise<void>;
};

export async function initLlama(_params?: Record<string, unknown>): Promise<LlamaContext> {
  throw new Error('llama.rn is not available on web');
}

export default {
  initLlama,
};
