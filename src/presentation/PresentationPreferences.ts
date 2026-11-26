import type { WorkspaceSettings } from '../domain/workspace/settings';

/** Presentation-only preference. Saved state and OS accessibility preferences both take effect. */
export function applyPresentationSettings(settings: WorkspaceSettings): void {
  document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
}
export function prefersReducedMotion(): boolean {
  return document.documentElement.dataset.reducedMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
}
