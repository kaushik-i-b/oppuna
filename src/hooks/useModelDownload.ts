import { useEffect, useState } from 'react';

import { getModelDownloadState, subscribeToModelDownload } from '@/ai/modelDownloader';
import type { ModelDownloadState } from '@/ai/modelDownloader';

/** React hook that tracks the on-device model download lifecycle. */
export function useModelDownload(): ModelDownloadState {
  const [downloadState, setDownloadState] = useState<ModelDownloadState>(getModelDownloadState);

  useEffect(() => subscribeToModelDownload(setDownloadState), []);

  return downloadState;
}
