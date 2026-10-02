/** Event pages that may send players to log in and get them back afterwards. */
export const EVENT_RETURN_PATHS = ['/evento/agro', '/evento/jardin'] as const;
export type ReturnTo = '/juego' | (typeof EVENT_RETURN_PATHS)[number];

/** Validates a `?next=` value; anything unknown falls back to the lobby. */
export function parseReturnTo(next: string | null | undefined): ReturnTo {
  return EVENT_RETURN_PATHS.find((path) => path === next) ?? '/juego';
}

/** Appends `next=` to an auth link when the player should return to an event. */
export function withReturnTo(href: string, returnTo: ReturnTo) {
  if (returnTo === '/juego') return href;
  return `${href}${href.includes('?') ? '&' : '?'}next=${encodeURIComponent(returnTo)}`;
}
