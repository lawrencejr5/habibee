/**
 * Lightweight module-level event bus for cross-screen communication.
 * Used to relay streak/goal events from iOS modal screens back to the
 * home screen without requiring callback props across navigation boundaries.
 */
type Listener<T = any> = (payload: T) => void;

const registry: Record<string, Listener[]> = {};

export const eventBus = {
  on<T>(event: string, cb: Listener<T>): () => void {
    if (!registry[event]) registry[event] = [];
    registry[event].push(cb as Listener);
    return () => this.off(event, cb as Listener);
  },
  off(event: string, cb: Listener): void {
    registry[event] = (registry[event] ?? []).filter((l) => l !== cb);
  },
  emit<T>(event: string, payload?: T): void {
    (registry[event] ?? []).forEach((l) => l(payload));
  },
};

// ─── Event type constants ─────────────────────────────────────────────────────
export const EVENTS = {
  FIRST_STREAK_OF_DAY: "firstStreakOfDay",
  GOAL_COMPLETED: "goalCompleted",
} as const;
