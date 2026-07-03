import { useEffect, useState } from 'react';

import { getModelState, subscribeToModelState } from '@/ai/modelManager';
import type { ModelState } from '@/ai/types';

/** React hook that tracks on-device LLM model lifecycle state. */
export function useModelStatus(): ModelState {
  const [modelState, setModelState] = useState<ModelState>(getModelState);

  useEffect(() => subscribeToModelState(setModelState), []);

  return modelState;
}
