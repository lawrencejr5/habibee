/**
 * useAutoCompleteTimers
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans AsyncStorage for ALL running habit timers that have:
 *   • autoComplete = true
 *   • elapsed time ≥ the habit's duration (timer has finished)
 *
 * For each such timer, it calls `record_streak` with the **correct historical
 * date** (the exact moment the timer actually ended, derived from startTime +
 * remaining seconds), then clears the timer from storage.
 *
 * This hook must be called (and awaited via the returned `scanAndComplete`
 * function) BEFORE `check_streak_and_reset` runs so that `lastCompleted` is
 * updated and no streak freeze is incorrectly consumed.
 *
 * Usage:
 *   const { scanAndComplete } = useAutoCompleteTimers(habitsMap);
 *   // Call scanAndComplete() before check_streak_and_reset
 */

import { useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimerStorageState {
  isRunning: boolean;
  startTime: number | null;
  elapsed: number;
  autoComplete?: boolean;
}

/**
 * A lightweight map of { habitId → durationInMinutes } so the hook can
 * calculate maxSeconds without fetching Convex data itself.
 */
export type HabitDurationMap = Record<string, number>;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAutoCompleteTimers(habitDurationMap: HabitDurationMap) {
  const record_streak = useMutation(api.habits.record_streak);
  const update_timer = useMutation(api.habits.update_habit_timer);
  const isScanningRef = useRef(false);

  // Always keep a ref to the latest map so scanAndComplete closures can
  // access it even if the Convex data arrived after the first call.
  const mapRef = useRef<HabitDurationMap>(habitDurationMap);
  mapRef.current = habitDurationMap;

  /**
   * Scans ALL AsyncStorage keys with the timer prefix and completes any
   * auto-complete timers that have elapsed. Returns a promise that resolves
   * when all applicable timers have been processed.
   *
   * @param waitForDataMs - If the duration map is still empty (habits not yet
   *   loaded from Convex), poll up to this many ms before giving up.
   *   Defaults to 10 000 ms (10 s).
   */
  const scanAndComplete = async (waitForDataMs = 10_000): Promise<void> => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    try {
      // ── 1. Wait for habit data to be available ─────────────────────────────
      // On app foreground the Convex query may not have resolved yet.
      // Poll every 500 ms until the map has at least one entry or we time out.
      const deadline = Date.now() + waitForDataMs;
      while (
        Object.keys(mapRef.current).length === 0 &&
        Date.now() < deadline
      ) {
        await new Promise<void>((r) => setTimeout(r, 500));
      }

      const currentMap = mapRef.current;
      if (Object.keys(currentMap).length === 0) {
        // No habits loaded — nothing to scan against, give up gracefully.
        console.log("[AutoComplete] No habit duration data available — skipping scan.");
        return;
      }

      // ── 2. Scan AsyncStorage for timer keys ────────────────────────────────
      const allKeys = await AsyncStorage.getAllKeys();
      const timerKeys = allKeys.filter((k) =>
        k.startsWith("habibee:timer:"),
      );

      if (timerKeys.length === 0) return;

      // Load all timer states at once for efficiency
      const pairs = await AsyncStorage.multiGet(timerKeys);

      for (const [key, raw] of pairs) {
        if (!raw) continue;

        let state: TimerStorageState;
        try {
          state = JSON.parse(raw) as TimerStorageState;
        } catch {
          continue;
        }

        // Only process running timers with autoComplete enabled
        if (!state.isRunning || !state.autoComplete || !state.startTime) {
          continue;
        }

        // Extract habitId from key: "habibee:timer:{habitId}"
        const habitId = key.replace("habibee:timer:", "");

        // Look up duration — skip if not found (habit may have been deleted)
        const durationMinutes = currentMap[habitId];
        if (!durationMinutes || durationMinutes <= 0) continue;

        const maxSeconds = durationMinutes * 60;

        // Calculate how many seconds have elapsed since the timer started
        const currentSession = Math.floor(
          (Date.now() - state.startTime) / 1000,
        );
        const totalElapsed = state.elapsed + currentSession;

        // Only proceed if the timer has actually finished
        if (totalElapsed < maxSeconds) continue;

        // Calculate the exact timestamp when the timer completed:
        //   startTime + (maxSeconds − already-elapsed-at-start) * 1000
        const completionTimestamp =
          state.startTime + (maxSeconds - state.elapsed) * 1000;

        const completionDate = new Date(completionTimestamp).toLocaleDateString(
          "en-CA",
        );
        const completionWeekDay = new Date(
          completionTimestamp,
        ).toLocaleDateString("en-US", { weekday: "short" });

        try {
          await record_streak({
            habit_id: habitId as Id<"habits">,
            current_date: completionDate,
            week_day: completionWeekDay,
          });
          console.log(
            `[AutoComplete] ✅ Streak recorded for habit ${habitId} on ${completionDate}`,
          );

          // Reset the Convex-side timer fields so the home-screen habit card
          // reverts from showing the elapsed time (e.g. "5:00") back to
          // the static duration label (e.g. "5 mins").
          update_timer({
            habit_id: habitId as Id<"habits">,
            timer_elapsed: 0,
            timer_start_time: null,
          }).catch((err) =>
            console.warn(`[AutoComplete] Timer reset failed for ${habitId}:`, err),
          );
        } catch (err: any) {
          const msg: string = err?.data ?? err?.message ?? "";
          if (msg.includes("Streak already counted")) {
            // Already recorded (e.g. user opened the modal manually first) —
            // just clean up the stale storage entry.
            console.log(
              `[AutoComplete] Already counted for ${habitId} on ${completionDate} — cleaning up.`,
            );
          } else {
            // Unknown error — leave storage intact so the user can still
            // manually finish the habit from the timer modal.
            console.warn(
              `[AutoComplete] Failed to record streak for ${habitId}:`,
              err,
            );
            continue;
          }
        }

        // Clear the timer from AsyncStorage so the modal shows a fresh state
        try {
          await AsyncStorage.removeItem(key);
        } catch (err) {
          console.warn(
            `[AutoComplete] Failed to remove timer key ${key}:`,
            err,
          );
        }
      }
    } catch (err) {
      console.warn("[AutoComplete] Scan failed:", err);
    } finally {
      isScanningRef.current = false;
    }
  };

  return { scanAndComplete };
}
