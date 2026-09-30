/**
 * Czy status jest równy wskazanemu progowi lub dalszy w procesie.
 * Statusy spoza listy (np. nieznane z CRM) nigdy nie spełniają warunku.
 */
export function isStatusAtOrBeyond(status: string, threshold: string, pipeline: readonly string[]): boolean {
  const statusIndex = pipeline.indexOf(status);
  const thresholdIndex = pipeline.indexOf(threshold);
  if (thresholdIndex === -1) {
    throw new Error(`Status progowy „${threshold}” nie istnieje w konfiguracji procesu`);
  }
  return statusIndex !== -1 && statusIndex >= thresholdIndex;
}

export function isCancelled(status: string, cancelled: readonly string[]): boolean {
  return cancelled.includes(status);
}
