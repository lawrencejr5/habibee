import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getPendingStreaks,
  removePendingStreak,
  clearLocalLastCompletedForHabit,
} from "@/store/offlineStreakStore";

/**
 * Watches `isOnline`. When the device transitions from offline → online,
 * flushes the MMKV pending-streak queue by calling `record_streak` for each
 * entry.  Entries are removed from the queue individually on success so that
 * a partial network failure leaves unsynced entries intact for the next retry.
 *
 * The hook also accepts an optional `onSyncComplete` callback that is invoked
 * after all pending entries have been attempted.  The home screen uses this to
 * gate the `check_streak_and_reset` call.
 */
export function useSyncPendingStreaks({
  isOnline,
  onSyncComplete,
}: {
  isOnline: boolean;
  onSyncComplete?: () => void;
}) {
  const record_streak = useMutation(api.habits.record_streak);
  const prevOnlineRef = useRef<boolean>(isOnline);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    const nowOnline = isOnline;
    prevOnlineRef.current = isOnline;

    // Only trigger sync when transitioning offline → online
    // (or on first mount if we're already online with a pending queue)
    const shouldSync = nowOnline && (wasOffline || prevOnlineRef.current === isOnline);

    if (!shouldSync || isSyncingRef.current) return;

    const pending = getPendingStreaks();
    if (pending.length === 0) {
      // Nothing to sync — run the gate callback immediately
      onSyncComplete?.();
      return;
    }

    isSyncingRef.current = true;

    const syncAll = async () => {
      for (const entry of pending) {
        try {
          await record_streak({
            habit_id: entry.habit_id as Id<"habits">,
            current_date: entry.current_date,
            week_day: entry.week_day,
          });
          // Success — remove from queue and clear local completion guard
          removePendingStreak(entry.habit_id, entry.current_date);
          clearLocalLastCompletedForHabit(entry.habit_id);
        } catch (err: any) {
          const msg: string = err?.data ?? err?.message ?? "";
          if (msg.includes("Streak already counted")) {
            // Already synced (e.g. flaky connection re-sent the mutation)
            removePendingStreak(entry.habit_id, entry.current_date);
            clearLocalLastCompletedForHabit(entry.habit_id);
          }
          // Any other error — leave in queue for next attempt
        }
      }

      isSyncingRef.current = false;
      // Notify caller that all sync attempts are done
      onSyncComplete?.();
    };

    syncAll();
  }, [isOnline]);
}
