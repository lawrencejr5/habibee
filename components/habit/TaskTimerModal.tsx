import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  Text,
  View,
  Platform,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";
import {
  scheduleTimerCompletedNotification,
  cancelTimerCompletedNotification,
} from "../../services/notifications";

interface TaskTimerModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habit?: HabitType;
  onFirstStreakOfDay?: () => void;
  onGoalCompleted?: (habit: HabitType) => void;
}

// ─── AsyncStorage helpers ────────────────────────────────────────────────────

interface TimerStorageState {
  isRunning: boolean;
  startTime: number | null;
  elapsed: number;
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

const TaskTimerModal: React.FC<TaskTimerModalProps> = ({
  visible,
  setVisible,
  habit,
  onFirstStreakOfDay,
  onGoalCompleted,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible && habit) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, habit]);

  const today = new Date().toLocaleDateString("en-CA");
  const week_day = new Date().toLocaleDateString("en-US", {
    weekday: "short",
  });

  const record_streak = useMutation(api.habits.record_streak);
  const update_timer = useMutation(api.habits.update_habit_timer);

  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [restartModalVisible, setRestartModalVisible] = useState<boolean>(false);

  // Local state to make the timer UI feel instantaneous, snappy, and responsive
  const [localIsRunning, setLocalIsRunning] = useState(false);
  const [localStartTime, setLocalStartTime] = useState<number | null>(null);
  const [localElapsed, setLocalElapsed] = useState(0);
  const notificationSentRef = useRef(false);

  // Initialize timer — AsyncStorage is the primary source of truth.
  // Convex data is used only as a fallback (e.g. first install, new device).
  useEffect(() => {
    if (!visible || !habit) return;

    const initTimer = async () => {
      const stored = await loadTimerFromStorage(habit._id);

      if (stored) {
        // AsyncStorage has data — use it directly, ignore Convex timer fields
        setLocalIsRunning(stored.isRunning);
        setLocalStartTime(stored.startTime);
        setLocalElapsed(stored.elapsed);

        if (stored.isRunning) {
          const currentSession = stored.startTime
            ? Math.floor((Date.now() - stored.startTime) / 1000)
            : 0;
          const currentTotal = stored.elapsed + currentSession;
          const maxSeconds = (habit.duration ?? 0) * 60;
          if (maxSeconds > 0 && currentTotal >= maxSeconds) {
            notificationSentRef.current = true;
          } else {
            notificationSentRef.current = false;
            // Schedule background notification
            const remainingSeconds = maxSeconds - currentTotal;
            await scheduleTimerCompletedNotification(habit._id, habit.habit, remainingSeconds);
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
        // Auto-start on fresh open
        const now = Date.now();
        const newState: TimerStorageState = {
          isRunning: true,
          startTime: now,
          elapsed: 0,
        };
        setLocalIsRunning(true);
        setLocalStartTime(now);
        setLocalElapsed(0);
        notificationSentRef.current = false;

        // Schedule background notification
        const maxSeconds = (habit.duration ?? 0) * 60;
        if (maxSeconds > 0) {
          await scheduleTimerCompletedNotification(habit._id, habit.habit, maxSeconds);
        }

        // Persist locally first, then sync to cloud
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
            // Schedule background notification
            const remainingSeconds = maxSeconds - currentTotal;
            await scheduleTimerCompletedNotification(habit._id, habit.habit, remainingSeconds);
          }
        } else {
          notificationSentRef.current = false;
        }

        // Persist the Convex state locally so future opens use AsyncStorage
        await saveTimerToStorage(habit._id, {
          isRunning: isTimerActive,
          startTime: start ?? null,
          elapsed,
        });
      }
    };

    initTimer();
  }, [visible, habit?._id]);

  const calculateTotalSeconds = () => {
    if (!habit) return 0;
    const currentSession = localStartTime
      ? Math.floor((Date.now() - localStartTime) / 1000)
      : 0;
    const total = localElapsed + currentSession;
    const maxSeconds = (habit?.duration ?? 0) * 60;

    // If no duration set (or 0), act as stopwatch (no limit)
    if (maxSeconds === 0) return total;

    return Math.min(total, maxSeconds);
  };

  const [displaySeconds, setDisplaySeconds] = useState(0);

  const snapPoints = useMemo(() => ["90%"], []);

  const isRunning = localIsRunning;

  // Update display timer locally when running
  useEffect(() => {
    if (!visible || !habit) return;

    // Sync immediately
    setDisplaySeconds(calculateTotalSeconds());

    let interval: any;
    if (localIsRunning) {
      interval = setInterval(() => {
        setDisplaySeconds(calculateTotalSeconds());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [localIsRunning, localStartTime, localElapsed, visible]);



  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        bottomSheetRef.current?.close();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [visible, setVisible]);

  const toggleTimer = async () => {
    if (!habit) return;
    haptics.impact("light");
    const currentTotal = calculateTotalSeconds();

    if (localIsRunning) {
      // Pause: update local state
      const newState: TimerStorageState = {
        isRunning: false,
        startTime: null,
        elapsed: currentTotal,
      };
      setLocalIsRunning(false);
      setLocalStartTime(null);
      setLocalElapsed(currentTotal);

      // Persist locally first (guaranteed even if offline)
      await saveTimerToStorage(habit._id, newState);

      // Cancel background notification
      await cancelTimerCompletedNotification(habit._id);

      // Best-effort cloud sync
      update_timer({
        habit_id: habit._id,
        timer_elapsed: currentTotal,
        timer_start_time: null,
      }).catch((err) => console.error("Pause cloud sync failed", err));
    } else {
      // Resume/Start: update local state
      const now = Date.now();
      const newState: TimerStorageState = {
        isRunning: true,
        startTime: now,
        elapsed: currentTotal,
      };
      setLocalIsRunning(true);
      setLocalStartTime(now);

      // Reset notificationSentRef when starting/resuming
      const maxSeconds = (habit.duration ?? 0) * 60;
      if (maxSeconds > 0 && currentTotal >= maxSeconds) {
        notificationSentRef.current = true;
      } else {
        notificationSentRef.current = false;
        // Schedule background notification
        const remainingSeconds = maxSeconds - currentTotal;
        await scheduleTimerCompletedNotification(habit._id, habit.habit, remainingSeconds);
      }

      // Persist locally first (guaranteed even if offline)
      await saveTimerToStorage(habit._id, newState);

      // Best-effort cloud sync
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

    // 1. Update React local states
    setLocalStartTime(now);
    setLocalElapsed(0);
    setDisplaySeconds(0);
    notificationSentRef.current = false;

    // 2. Schedule or cancel background notification
    if (localIsRunning) {
      const maxSeconds = (habit!.duration ?? 0) * 60;
      await scheduleTimerCompletedNotification(habit!._id, habit!.habit, maxSeconds);
    } else {
      await cancelTimerCompletedNotification(habit!._id);
    }

    // 3. Persist to AsyncStorage
    const newState: TimerStorageState = {
      isRunning: localIsRunning,
      startTime: now,
      elapsed: 0,
    };
    await saveTimerToStorage(habit!._id, newState);

    // 4. Best-effort Convex sync
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

  const handleFinish = async () => {
    if (!habit) return;
    haptics.impact("success");
    setBtnLoading(true);
    try {
      const res = await record_streak({
        habit_id: habit._id,
        current_date: today,
        week_day,
      });

      // Reset timer locally and on database
      setLocalIsRunning(false);
      setLocalStartTime(null);
      setLocalElapsed(0);

      // Cancel background notification
      await cancelTimerCompletedNotification(habit._id);

      // Clear local storage for this habit's timer
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
        onGoalCompleted(habit);
      } else if (res?.isFirstOfDay && onFirstStreakOfDay) {
        onFirstStreakOfDay();
      }
    } catch (err) {
      console.log(err);
      showCustomAlert("Couldn't count this streak", "danger");
    } finally {
      setBtnLoading(false);
      bottomSheetRef.current?.close();
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onDismiss={() => setVisible(false)}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: Colors[theme].surface,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 5,
        backgroundColor: "grey",
        marginTop: 10,
        borderRadius: 10,
      }}
    >
      {habit ? (
        <>
          <BottomSheetView
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              height: "100%",
              borderTopLeftRadius: 50,
              borderTopRightRadius: 50,
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

            <View style={{ justifyContent: "center", alignItems: "center" }}>
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

            {/* Absolute Restart Button at Bottom Right of the Circle */}
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
            onPress={handleFinish}
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
      </BottomSheetView>

      {/* Mini Custom Confirmation Modal for Restarting */}
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
            {/* Header */}
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
                style={{
                  padding: 4,
                  borderRadius: 20,
                }}
              >
                <Feather name="x" size={20} color={Colors[theme].text_secondary} />
              </Pressable>
            </View>

            {/* Description */}
            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 16,
                color: Colors[theme].text_secondary,
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              Are you sure you want to restart the timer? This will reset the elapsed time back to 0.
            </Text>

            {/* Action Row */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
              }}
            >
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
        </>
      ) : null}
    </BottomSheetModal>
  );
};

export default TaskTimerModal;
