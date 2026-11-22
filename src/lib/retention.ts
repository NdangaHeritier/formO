/** Workspace retention policy helpers. NULL always means "keep forever". */
export function resolveRetentionDays(
  workspaceDays: number | null | undefined,
  envDays: number | null | undefined
): number | null {
  return workspaceDays ?? envDays ?? null;
}

export function retentionCutoff(days: number | null, now: Date = new Date()): Date | null {
  if (days === null) return null;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
