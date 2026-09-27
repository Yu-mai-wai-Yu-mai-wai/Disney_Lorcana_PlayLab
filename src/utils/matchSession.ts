// localStorage is shared by every tab of the browser, so rejoin data must be keyed by account:
// with one shared key, two tabs playing each other overwrote each other's role and rejoin took the wrong seat.
export const activeSessionKey = (username?: string | null) => `lorcana_active_session_${username || 'guest'}`;
