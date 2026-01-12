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
  habit: HabitType;
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

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [isStrict, setIsStrict] = useState(habit ? habit.strict : false);

  const record_streak = useMutation(api.habits.record_streak);

  const snapPoints = useMemo(() => ["90%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
      setSeconds(0);
      setIsRunning(true);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  useEffect(() => {
    let interval: any;
    if (isRunning && visible) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const duration = habit.duration * 60;
          const new_second = prev + 1;

          if (new_second >= duration) {
            clearInterval(interval);
            setIsStrict(false);
          }

          return new_second;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, visible]);

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
    haptics.impact("success");
    setBtnLoading(true);
    try {
      await record_streak({
        habit_id: habit._id,
        current_date: today,
        week_day,
      });
      showCustomAlert("Streak increased for this habit", "success");
    } catch (err) {
      console.log(err);
      showCustomAlert("Couldn't count this streak", "danger");
    } finally {
      setBtnLoading(false);
      setIsRunning(false);
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

  if (!visible) return null;

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
              borderColor: habit.theme,
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
              {formatTime(seconds)}
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
            onPress={() => {
              setIsRunning(!isRunning);
              haptics.impact("light");
            }}
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
            disabled={btnLoading || isStrict}
            style={{
              backgroundColor: habit.theme,
              paddingVertical: 15,
              borderRadius: 50,
              alignItems: "center",
              opacity: btnLoading || isStrict ? 0.5 : 1,
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
