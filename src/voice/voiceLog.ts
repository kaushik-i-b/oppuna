import { logger } from '@/utils/logger';

/** Development-only voice milestones. Bodies of transcripts are never logged. */
export function voiceLog(event: string, extra?: Record<string, string | number | boolean>): void {
  if (!__DEV__) return;
  logger.info(event, extra);
}
