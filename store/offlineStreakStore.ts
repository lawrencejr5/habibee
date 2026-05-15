// react-native-mmkv v4 exports MMKV as a type only — we use require() inside
// the lazy getter so that:
//  1. The native module is only touched at runtime (not during Metro bundling)
//  2. We avoid the "MMKV only refers to a type" TS error from the ES import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _storage: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStorage(): any {
  if (!_storage) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require("react-native-mmkv");
    _storage = new MMKV({ id: "habibee-offline-store" });
  }
  return _storage;
}


const PENDING_STREAKS_KEY = "pending_streaks";
const LOCAL_LAST_COMPLETED_KEY = "local_last_completed";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PendingStreak {
  habit_id: string;
  current_date: string; // "YYYY-MM-DD" — always the original completion date
  week_day: string; // "Mon", "Tue", etc.
}

// Map of habit_id → last locally-completed date ("YYYY-MM-DD")
type LocalLastCompleted = Record<string, string>;

// ─── Pending Streak Queue ────────────────────────────────────────────────────

export function getPendingStreaks(): PendingStreak[] {
  try {
    const raw = getStorage().getString(PENDING_STREAKS_KEY);
    return raw ? (JSON.parse(raw) as PendingStreak[]) : [];
  } catch {
    return [];
  }
}

export function enqueuePendingStreak(entry: PendingStreak): void {
  const current = getPendingStreaks();

  // Avoid duplicates: same habit on same date
  const alreadyQueued = current.some(
    (e) =>
      e.habit_id === entry.habit_id && e.current_date === entry.current_date,
  );
  if (alreadyQueued) return;

  getStorage().set(PENDING_STREAKS_KEY, JSON.stringify([...current, entry]));
}

export function removePendingStreak(habit_id: string, date: string): void {
  const updated = getPendingStreaks().filter(
    (e) => !(e.habit_id === habit_id && e.current_date === date),
  );
  getStorage().set(PENDING_STREAKS_KEY, JSON.stringify(updated));
}

export function clearPendingStreaks(): void {
  getStorage().set(PENDING_STREAKS_KEY, JSON.stringify([]));
}

// ─── Local Last Completed Map ────────────────────────────────────────────────
// Used to guard against check_streak_and_reset wiping a streak before sync.

export function getLocalLastCompleted(): LocalLastCompleted {
  try {
    const raw = getStorage().getString(LOCAL_LAST_COMPLETED_KEY);
    return raw ? (JSON.parse(raw) as LocalLastCompleted) : {};
  } catch {
    return {};
  }
}

export function setLocalLastCompleted(habitId: string, date: string): void {
  const map = getLocalLastCompleted();
  map[habitId] = date;
  getStorage().set(LOCAL_LAST_COMPLETED_KEY, JSON.stringify(map));
}

export function clearLocalLastCompletedForHabit(habitId: string): void {
  const map = getLocalLastCompleted();
  delete map[habitId];
  getStorage().set(LOCAL_LAST_COMPLETED_KEY, JSON.stringify(map));
}

/**
 * Returns true if this habitId has a local completion for `date` stored
 * in MMKV, meaning it shouldn't be treated as missed by the reset logic.
 */
export function hasLocalCompletionForDate(
  habitId: string,
  date: string,
): boolean {
  const map = getLocalLastCompleted();
  return map[habitId] === date;
}
