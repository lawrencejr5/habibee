/**
 * TaskTimerContent
 * ─────────────────────────────────────────────────────────────────────────────
 * Platform-agnostic timer UI. Shared between:
 *  - TaskTimerModal.tsx (Android) — wrapped in BottomSheetModal
 *  - app/task-timer-modal.tsx (iOS) — rendered inside a Stack.Screen
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  Image,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { HabitType } from "@/constants/Types";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";
import {
  scheduleTimerCompletedNotification,
  cancelTimerCompletedNotification,
} from "../../services/notifications";

// ─── AsyncStorage helpers (same as TaskTimerModal) ───────────────────────────

interface TimerStorageState {
  isRunning: boolean;
  startTime: number | null;
  elapsed: number;
  autoComplete?: boolean;
}

const timerStorageKey = (habitId: string) => `habibee:timer:${habitId}`;

const saveTimerToStorage = async (
  habitId: string,
  state: TimerStorageState,
) => {
  try {
    await AsyncStorage.setItem(timerStorageKey(habitId), JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save timer to storage", err);
  }
};

const loadTimerFromStorage = async (
  habitId: string,
): Promise<TimerStorageState | null> => {
  try {
    const raw = await AsyncStorage.getItem(timerStorageKey(habitId));
    if (!raw) return null;
    return JSON.parse(raw) as TimerStorageState;
  } catch (err) {
    console.error("Failed to load timer from storage", err);
    return null;
  }
};

const clearTimerFromStorage = async (habitId: string) => {
  try {
    await AsyncStorage.removeItem(timerStorageKey(habitId));
  } catch (err) {
    console.error("Failed to clear timer from storage", err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export interface TaskTimerContentProps {
  habitId: Id<"habits">;
  onClose: () => void;
  onFirstStreakOfDay?: () => void;
  onGoalCompleted?: (habit: HabitType) => void;
}

const TaskTimerContent: React.FC<TaskTimerContentProps> = ({
  habitId,
  onClose,
  onFirstStreakOfDay,
  onGoalCompleted,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  // Fetch habit directly — no prop needed
  const habitsData = useQuery(api.habits.get_user_habits);
  const archivedHabits = useQuery(api.habits.get_archived_habits);
  const habit =
    habitsData?.find((h) => h._id === habitId) ||
    archivedHabits?.find((h) => h._id === habitId);

  const today = new Date().toLocaleDateString("en-CA");
  const week_day = new Date().toLocaleDateString("en-US", {
    weekday: "short",
  });

  const record_streak = useMutation(api.habits.record_streak);
  const update_timer = useMutation(api.habits.update_habit_timer);

  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [restartModalVisible, setRestartModalVisible] = useState<boolean>(false);

  const [localIsRunning, setLocalIsRunning] = useState(false);
  const [localStartTime, setLocalStartTime] = useState<number | null>(null);
  const [localElapsed, setLocalElapsed] = useState(0);
  const [autoComplete, setAutoComplete] = useState(false);
  const notificationSentRef = useRef(false);

  const calculateTotalSeconds = () => {
    if (!habit) return 0;
    const currentSession = localStartTime
      ? Math.floor((Date.now() - localStartTime) / 1000)
      : 0;
    const total = localElapsed + currentSession;
    const maxSeconds = (habit?.duration ?? 0) * 60;
    if (maxSeconds === 0) return total;
    return Math.min(total, maxSeconds);
  };

  const [displaySeconds, setDisplaySeconds] = useState(0);
  const isRunning = localIsRunning;

  // Initialize timer from storage/Convex
  useEffect(() => {
    if (!habit) return;

    const initTimer = async () => {
      const stored = await loadTimerFromStorage(habit._id);

      if (stored) {
        setLocalIsRunning(stored.isRunning);
        setLocalStartTime(stored.startTime);
        setLocalElapsed(stored.elapsed);
        setAutoComplete(!!stored.autoComplete);

        if (stored.isRunning) {
          const currentSession = stored.startTime
            ? Math.floor((Date.now() - stored.startTime) / 1000)
            : 0;
          const currentTotal = stored.elapsed + currentSession;
          const maxSeconds = (habit.duration ?? 0) * 60;
          if (maxSeconds > 0 && currentTotal >= maxSeconds) {
            notificationSentRef.current = true;
            if (stored.autoComplete) {
              const endTime =
                (stored.startTime ?? Date.now()) +
                (maxSeconds - stored.elapsed) * 1000;
              const customDate = new Date(endTime).toLocaleDateString("en-CA");
              const customWeekDay = new Date(endTime).toLocaleDateString(
                "en-US",
                { weekday: "short" },
              );
              await handleFinish(customDate, customWeekDay);
              return;
            }
          } else {
            notificationSentRef.current = false;
            const remainingSeconds = maxSeconds - currentTotal;
            await scheduleTimerCompletedNotification(
              habit._id,
              habit.habit,
              remainingSeconds,
            );
          }
        } else {
          notificationSentRef.current = false;
        }
        return;
      }

      // No local storage found — fall back to Convex data
      const isTimerActive = !!habit.timer_start_time;
      const start = habit.timer_start_time;
      const elapsed = habit.timer_elapsed || 0;

      if (!isTimerActive && elapsed === 0) {
        const now = Date.now();
        const newState: TimerStorageState = {
          isRunning: true,
          startTime: now,
          elapsed: 0,
          autoComplete: false,
        };
        setLocalIsRunning(true);
        setLocalStartTime(now);
        setLocalElapsed(0);
        setAutoComplete(false);
        notificationSentRef.current = false;

        const maxSeconds = (habit.duration ?? 0) * 60;
        if (maxSeconds > 0) {
          await scheduleTimerCompletedNotification(
            habit._id,
            habit.habit,
            maxSeconds,
          );
        }

        await saveTimerToStorage(habit._id, newState);
        update_timer({
          habit_id: habit._id,
          timer_elapsed: 0,
          timer_start_time: now,
        }).catch((err) => console.error("Auto-start cloud sync failed", err));
      } else {
        setLocalIsRunning(isTimerActive);
        setLocalStartTime(start!);
        setLocalElapsed(elapsed);
        setAutoComplete(false);

        if (isTimerActive) {
          const currentSession = start
            ? Math.floor((Date.now() - start) / 1000)
            : 0;
          const currentTotal = elapsed + currentSession;
          const maxSeconds = (habit.duration ?? 0) * 60;
          if (maxSeconds > 0 && currentTotal >= maxSeconds) {
            notificationSentRef.current = true;
          } else {
            notificationSentRef.current = false;
            const remainingSeconds = maxSeconds - currentTotal;
            await scheduleTimerCompletedNotification(
              habit._id,
              habit.habit,
              remainingSeconds,
            );
          }
        } else {
          notificationSentRef.current = false;
        }

        await saveTimerToStorage(habit._id, {
          isRunning: isTimerActive,
          startTime: start ?? null,
          elapsed,
          autoComplete: false,
        });
      }
    };

    initTimer();
  }, [habit?._id]);

  // Update display timer locally when running
  useEffect(() => {
    if (!habit) return;

    const initialSecs = calculateTotalSeconds();
    setDisplaySeconds(initialSecs);

    const maxSeconds = (habit.duration ?? 0) * 60;
    if (
      localIsRunning &&
      maxSeconds > 0 &&
      initialSecs >= maxSeconds &&
      autoComplete &&
      !btnLoading
    ) {
      const completionTime = localStartTime
        ? localStartTime + (maxSeconds - localElapsed) * 1000
        : Date.now();
      const customDate = new Date(completionTime).toLocaleDateString("en-CA");
      const customWeekDay = new Date(completionTime).toLocaleDateString(
        "en-US",
        { weekday: "short" },
      );
      handleFinish(customDate, customWeekDay);
      return;
    }

    let interval: any;
    if (localIsRunning) {
      interval = setInterval(() => {
        const secs = calculateTotalSeconds();
        setDisplaySeconds(secs);

        if (
          maxSeconds > 0 &&
          secs >= maxSeconds &&
          autoComplete &&
          !btnLoading
        ) {
          clearInterval(interval);
          const completionTime = localStartTime
            ? localStartTime + (maxSeconds - localElapsed) * 1000
            : Date.now();
          const customDate = new Date(completionTime).toLocaleDateString(
            "en-CA",
          );
          const customWeekDay = new Date(completionTime).toLocaleDateString(
            "en-US",
            { weekday: "short" },
          );
          handleFinish(customDate, customWeekDay);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [localIsRunning, localStartTime, localElapsed, autoComplete, btnLoading]);

  const handleToggleAutoComplete = async () => {
    if (!habit) return;
    const nextVal = !autoComplete;
    setAutoComplete(nextVal);
    haptics.impact("light");

    const newState: TimerStorageState = {
      isRunning: localIsRunning,
      startTime: localStartTime,
      elapsed: localElapsed,
      autoComplete: nextVal,
    };
    await saveTimerToStorage(habit._id, newState);
  };

  const toggleTimer = async () => {
    if (!habit) return;
    haptics.impact("light");
    const currentTotal = calculateTotalSeconds();

    if (localIsRunning) {
      const newState: TimerStorageState = {
        isRunning: false,
        startTime: null,
        elapsed: currentTotal,
        autoComplete,
      };
      setLocalIsRunning(false);
      setLocalStartTime(null);
      setLocalElapsed(currentTotal);

      await saveTimerToStorage(habit._id, newState);
      await cancelTimerCompletedNotification(habit._id);

      update_timer({
        habit_id: habit._id,
        timer_elapsed: currentTotal,
        timer_start_time: null,
      }).catch((err) => console.error("Pause cloud sync failed", err));
    } else {
      const now = Date.now();
      const newState: TimerStorageState = {
        isRunning: true,
        startTime: now,
        elapsed: currentTotal,
        autoComplete,
      };
      setLocalIsRunning(true);
      setLocalStartTime(now);

      const maxSeconds = (habit.duration ?? 0) * 60;
      if (maxSeconds > 0 && currentTotal >= maxSeconds) {
        notificationSentRef.current = true;
      } else {
        notificationSentRef.current = false;
        const remainingSeconds = maxSeconds - currentTotal;
        await scheduleTimerCompletedNotification(
          habit._id,
          habit.habit,
          remainingSeconds,
        );
      }

      await saveTimerToStorage(habit._id, newState);

      update_timer({
        habit_id: habit._id,
        timer_elapsed: currentTotal,
        timer_start_time: now,
      }).catch((err) => console.error("Resume cloud sync failed", err));
    }
  };

  const handleRestart = () => {
    haptics.impact("medium");
    setRestartModalVisible(true);
  };

  const confirmRestart = async () => {
    haptics.impact("success");
    setRestartModalVisible(false);
    const now = localIsRunning ? Date.now() : null;

    setLocalStartTime(now);
    setLocalElapsed(0);
    setDisplaySeconds(0);
    notificationSentRef.current = false;

    if (localIsRunning) {
      const maxSeconds = (habit!.duration ?? 0) * 60;
      await scheduleTimerCompletedNotification(
        habit!._id,
        habit!.habit,
        maxSeconds,
      );
    } else {
      await cancelTimerCompletedNotification(habit!._id);
    }

    const newState: TimerStorageState = {
      isRunning: localIsRunning,
      startTime: now,
      elapsed: 0,
      autoComplete,
    };
    await saveTimerToStorage(habit!._id, newState);

    update_timer({
      habit_id: habit!._id,
      timer_elapsed: 0,
      timer_start_time: now,
    }).catch((err) => console.error("Restart cloud sync failed", err));

    showCustomAlert("Timer restarted", "success");
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0",
    )}`;
  };

  const handleFinish = async (customDate?: string, customWeekDay?: string) => {
    if (!habit) return;
    haptics.impact("success");
    setBtnLoading(true);
    try {
      const res = await record_streak({
        habit_id: habit._id,
        current_date: customDate ?? today,
        week_day: customWeekDay ?? week_day,
      });

      setLocalIsRunning(false);
      setLocalStartTime(null);
      setLocalElapsed(0);

      await cancelTimerCompletedNotification(habit._id);
      await clearTimerFromStorage(habit._id);

      await update_timer({
        habit_id: habit._id,
        timer_elapsed: 0,
        timer_start_time: null,
      });

      showCustomAlert("Streak increased for this habit", "success");

      if (
        res?.newStreak &&
        res?.goal &&
        res.newStreak >= res.goal &&
        onGoalCompleted &&
        habit
      ) {
        onGoalCompleted(habit as HabitType);
      } else if (res?.isFirstOfDay && onFirstStreakOfDay) {
        onFirstStreakOfDay();
      }
    } catch (err) {
      console.log(err);
      showCustomAlert("Couldn't count this streak", "danger");
    } finally {
      setBtnLoading(false);
      onClose();
    }
  };

  if (!habit) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors[theme].primary} />
      </View>
    );
  }

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 20 : 20,
        paddingBottom: insets.bottom + 20,
        flex: 1,
        backgroundColor: Colors[theme].surface,
        borderTopLeftRadius: Platform.OS === "android" ? 50 : 0,
        borderTopRightRadius: Platform.OS === "android" ? 50 : 0,
      }}
    >
      {/* Header */}
      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Text
          style={{
            fontFamily: "NunitoExtraBold",
            fontSize: 24,
            color: Colors[theme].text,
          }}
        >
          {habit.habit}
        </Text>
        <Text
          style={{
            fontFamily: "NunitoRegular",
            fontSize: 14,
            color: Colors[theme].text_secondary,
            marginTop: 5,
          }}
        >
          Target: {habit.duration} min(s)
        </Text>
      </View>

      {/* Timer Display */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 280,
            height: 280,
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* SVG Progress Circle */}
          <Svg width={280} height={280} style={{ position: "absolute" }}>
            <Circle
              cx={140}
              cy={140}
              r={132}
              stroke={Colors[theme].border}
              strokeWidth={12}
              fill={Colors[theme].surface}
            />
            <Circle
              cx={140}
              cy={140}
              r={132}
              stroke={habit.theme ?? Colors[theme].primary}
              strokeWidth={12}
              strokeDasharray={`${2 * Math.PI * 132} ${2 * Math.PI * 132}`}
              strokeDashoffset={
                2 *
                Math.PI *
                132 *
                (1 -
                  ((habit.duration ?? 0) * 60 > 0
                    ? Math.min(
                        displaySeconds / ((habit.duration ?? 0) * 60),
                        1,
                      )
                    : 1))
              }
              strokeLinecap="round"
              fill="none"
              transform="rotate(-90 140 140)"
            />
          </Svg>

          <View
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: displaySeconds >= 3600 ? 46 : 64,
                color: Colors[theme].text,
              }}
            >
              {formatTime(displaySeconds)}
            </Text>
            <Text
              style={{
                fontFamily: "NunitoMedium",
                fontSize: 16,
                color: Colors[theme].text_secondary,
                marginTop: 10,
              }}
            >
              {isRunning ? "In Progress..." : "Paused"}
            </Text>
          </View>

          {/* Restart Button */}
          <Pressable
            onPress={handleRestart}
            style={({ pressed }) => ({
              position: "absolute",
              bottom: 0,
              right: -20,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors[theme].surface,
              borderWidth: 2,
              borderColor: Colors[theme].border,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Feather
              name="rotate-ccw"
              size={18}
              color={Colors[theme].text_secondary}
            />
          </Pressable>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={{ gap: 15 }}>
        {(habit.duration ?? 0) > 0 && (
          <Pressable
            onPress={handleToggleAutoComplete}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 10,
              marginBottom: 5,
              marginLeft: 10,
              alignSelf: "flex-start",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: autoComplete
                  ? (habit.theme ?? Colors[theme].primary)
                  : Colors[theme].text_secondary,
                backgroundColor: autoComplete
                  ? (habit.theme ?? Colors[theme].primary)
                  : "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {autoComplete && (
                <Image
                  source={require("../../assets/icons/check-fill.png")}
                  style={{ width: 12, height: 12, tintColor: "#fff" }}
                />
              )}
            </View>
            <Text
              style={{
                fontFamily: "NunitoMedium",
                fontSize: 14,
                color: Colors[theme].text,
              }}
            >
              Complete habit when timer ends
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={toggleTimer}
          style={{
            backgroundColor: Colors[theme].surface,
            paddingVertical: 15,
            borderRadius: 50,
            alignItems: "center",
            borderWidth: 2,
            borderColor: Colors[theme].border,
          }}
        >
          <Text
            style={{
              fontFamily: "NunitoBold",
              fontSize: 16,
              color: Colors[theme].text,
            }}
          >
            {isRunning ? "Pause" : "Resume"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleFinish()}
          disabled={
            btnLoading ||
            (habit.strict &&
              (habit.duration ?? 0) > 0 &&
              displaySeconds < (habit.duration ?? 0) * 60)
          }
          style={{
            backgroundColor: habit.theme ?? Colors[theme].primary,
            paddingVertical: 15,
            borderRadius: 50,
            alignItems: "center",
            opacity:
              btnLoading ||
              (habit.strict &&
                (habit.duration ?? 0) > 0 &&
                displaySeconds < (habit.duration ?? 0) * 60)
                ? 0.5
                : 1,
          }}
        >
          {btnLoading ? (
            <ActivityIndicator color={"#eee"} />
          ) : (
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 16,
                color: "#fff",
              }}
            >
              Finished Task
            </Text>
          )}
        </Pressable>
      </View>

      {/* Restart Confirmation Modal */}
      <Modal
        visible={restartModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestartModalVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
          onPress={() => setRestartModalVisible(false)}
        >
          <Pressable
            style={{
              width: "85%",
              backgroundColor: Colors[theme].surface,
              borderRadius: 20,
              padding: 24,
              borderWidth: 2,
              borderColor: Colors[theme].border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
            }}
            onPress={() => {}}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 20,
                  color: Colors[theme].text,
                }}
              >
                Restart Timer
              </Text>
              <Pressable
                onPress={() => setRestartModalVisible(false)}
                style={{ padding: 4, borderRadius: 20 }}
              >
                <Feather
                  name="x"
                  size={20}
                  color={Colors[theme].text_secondary}
                />
              </Pressable>
            </View>

            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 16,
                color: Colors[theme].text_secondary,
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              Are you sure you want to restart the timer? This will reset the
              elapsed time back to 0.
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setRestartModalVisible(false)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: Colors[theme].border,
                  backgroundColor: Colors[theme].surface,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 15,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={confirmRestart}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: habit.theme ?? Colors[theme].primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 15,
                    color: "#fff",
                  }}
                >
                  Restart
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default TaskTimerContent;
