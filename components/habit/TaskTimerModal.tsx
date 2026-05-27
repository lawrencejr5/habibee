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
  Pressable,
  Text,
  View,
  Animated,
} from "react-native";

import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";

interface TaskTimerModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habit?: HabitType;
  onFirstStreakOfDay?: () => void;
  onGoalCompleted?: (habit: HabitType) => void;
}

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

  const bottomSheetRef = useRef<BottomSheet>(null);

  const today = new Date().toLocaleDateString("en-CA");
  const week_day = new Date().toLocaleDateString("en-US", {
    weekday: "short",
  });

  const record_streak = useMutation(api.habits.record_streak);
  const update_timer = useMutation(api.habits.update_habit_timer);

  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  // Local state to make the timer UI feel instantaneous, snappy, and responsive
  const [localIsRunning, setLocalIsRunning] = useState(false);
  const [localStartTime, setLocalStartTime] = useState<number | null>(null);
  const [localElapsed, setLocalElapsed] = useState(0);

  // Animated values for smooth progress and pulsing scale animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Handle smooth timer progress animation
  useEffect(() => {
    const totalSeconds = (habit?.duration ?? 0) * 60;
    if (totalSeconds <= 0) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      return;
    }

    const targetProgress = Math.min(displaySeconds / totalSeconds, 1);

    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: isRunning ? 1000 : 300,
      useNativeDriver: false,
    }).start();
  }, [displaySeconds, habit?.duration, isRunning]);

  // Handle subtle pulsing scale animation while running
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (localIsRunning) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [localIsRunning]);

  // Initialize and auto-start timer locally on fresh open
  useEffect(() => {
    if (visible && habit) {
      const isTimerActive = !!habit.timer_start_time;
      const start = habit.timer_start_time;
      const elapsed = habit.timer_elapsed || 0;

      // Handle auto-start on fresh open:
      if (!isTimerActive && elapsed === 0) {
        const now = Date.now();
        setLocalIsRunning(true);
        setLocalStartTime(now);
        setLocalElapsed(0);

        // Update database in the background
        update_timer({
          habit_id: habit._id,
          timer_elapsed: 0,
          timer_start_time: now,
        }).catch((err) => console.error("Auto-start failed", err));
      } else {
        setLocalIsRunning(isTimerActive);
        setLocalStartTime(start!);
        setLocalElapsed(elapsed);
      }
    }
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

    try {
      if (localIsRunning) {
        // Pause: save accumulated time, clear start time locally first
        setLocalIsRunning(false);
        setLocalStartTime(null);
        setLocalElapsed(currentTotal);

        await update_timer({
          habit_id: habit._id,
          timer_elapsed: currentTotal,
          timer_start_time: null,
        });
      } else {
        // Resume/Start: update locally first
        const now = Date.now();
        setLocalIsRunning(true);
        setLocalStartTime(now);

        await update_timer({
          habit_id: habit._id,
          timer_elapsed: currentTotal,
          timer_start_time: now,
        });
      }
    } catch (err) {
      console.error("Failed to toggle timer", err);
      showCustomAlert("Failed to update timer", "danger");
    }
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

  if (!visible || !habit) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={() => setVisible(false)}
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
          <Animated.View
            style={{
              width: 280,
              height: 280,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: pulseAnim }],
            }}
          >
            {/* SVG Circle Progress */}
            <View style={{ position: "absolute", width: 280, height: 280 }}>
              <Svg width={280} height={280} viewBox="0 0 280 280">
                {/* Background Track Circle */}
                <Circle
                  cx={140}
                  cy={140}
                  r={132}
                  stroke={Colors[theme].border}
                  strokeWidth={10}
                  fill="none"
                />
                {/* Foreground Animated Progress Circle */}
                <AnimatedCircle
                  cx={140}
                  cy={140}
                  r={132}
                  stroke={habit.theme ?? Colors[theme].primary}
                  strokeWidth={10}
                  strokeDasharray={`${2 * Math.PI * 132} ${2 * Math.PI * 132}`}
                  strokeDashoffset={progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2 * Math.PI * 132, 0],
                  })}
                  strokeLinecap="round"
                  fill="none"
                  transform="rotate(-90 140 140)"
                />
              </Svg>
            </View>

            {/* Inner Content (Time & Status) */}
            <View
              style={{
                width: 260,
                height: 260,
                borderRadius: 130,
                backgroundColor: Colors[theme].surface,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 64,
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
          </Animated.View>
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
    </BottomSheet>
  );
};

export default TaskTimerModal;
