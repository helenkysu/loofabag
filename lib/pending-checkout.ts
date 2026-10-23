// A bag design saved while a logged-out user signs in. Kept in localStorage (not
// sessionStorage) because the magic-link email opens a new tab.

const KEY = 'loofabag_pending_checkout';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // ignore drafts older than a day (e.g. shared computers)

// Where sign-in sends the user back to; the create page restores the draft from here
export const PENDING_CHECKOUT_PATH = '/my-loofas/create?resume=pending';

export function savePendingCheckout(draft: Record<string, unknown>): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), draft }));
    return true;
  } catch {
    return false;
  }
}

// Returns the saved draft (if fresh) and removes it so it is only restored once
export function takePendingCheckout(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return null;
    const { savedAt, draft } = JSON.parse(raw) as { savedAt?: number; draft?: Record<string, unknown> };
    if (!draft || !savedAt || Date.now() - savedAt > MAX_AGE_MS) return null;
    return draft;
  } catch {
    return null;
  }
}
