import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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
}

const TaskTimerModal: React.FC<TaskTimerModalProps> = ({
  visible,
  setVisible,
  habit,
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

  const calculateTotalSeconds = () => {
    if (!habit) return 0;
    const elapsed = habit.timer_elapsed || 0;
    const currentSession = habit.timer_start_time
      ? Math.floor((Date.now() - habit.timer_start_time) / 1000)
      : 0;
    const total = elapsed + currentSession;
    const maxSeconds = habit.duration * 60;
    return Math.min(total, maxSeconds);
  };

  // Auto-start timer on fresh open
  useEffect(() => {
    if (visible && habit && !habit.timer_start_time && (habit.timer_elapsed || 0) === 0) {
      update_timer({
        habit_id: habit._id,
        timer_elapsed: 0,
        timer_start_time: Date.now(),
      }).catch((err) => console.error("Auto-start failed", err));
    }
  }, [visible]);

  const [displaySeconds, setDisplaySeconds] = useState(0);

  const snapPoints = useMemo(() => ["90%"], []);

  const isRunning = !!habit?.timer_start_time;

  // Update display timer locally when running
  useEffect(() => {
    if (!visible || !habit) return;

    // Sync immediately
    setDisplaySeconds(calculateTotalSeconds());

    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setDisplaySeconds(calculateTotalSeconds());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, visible, habit?.timer_start_time, habit?.timer_elapsed]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const toggleTimer = async () => {
    if (!habit) return;
    haptics.impact("light");
    const currentTotal = calculateTotalSeconds();

    try {
      if (isRunning) {
        // Pause: save accumulated time, clear start time
        await update_timer({
          habit_id: habit._id,
          timer_elapsed: currentTotal,
          timer_start_time: null,
        });
      } else {
        // Resume/Start: save current timestamp
        await update_timer({
          habit_id: habit._id,
          timer_elapsed: currentTotal,
          timer_start_time: Date.now(),
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
        "0"
      )}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  const handleFinish = async () => {
    if (!habit) return;
    haptics.impact("success");
    setBtnLoading(true);
    try {
      await record_streak({
        habit_id: habit._id,
        current_date: today,
        week_day,
      });

      // Reset timer on finish
      await update_timer({
        habit_id: habit._id,
        timer_elapsed: 0,
        timer_start_time: null,
      });

      showCustomAlert("Streak increased for this habit", "success");
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
          <View
            style={{
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: Colors[theme].surface,
              borderWidth: 8,
              borderColor: habit.theme ?? Colors[theme].primary,
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
            disabled={btnLoading}
            style={{
              backgroundColor: habit.theme ?? Colors[theme].primary,
              paddingVertical: 15,
              borderRadius: 50,
              alignItems: "center",
              opacity: btnLoading ? 0.5 : 1,
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
