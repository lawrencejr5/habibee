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
import { useColorScheme } from "../useColorScheme";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface TaskTimerModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habit: any;
}

const TaskTimerModal: React.FC<TaskTimerModalProps> = ({
  visible,
  setVisible,
  habit,
}) => {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const [btnLoading, setBtnLoading] = useState<boolean>(false);

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
        setSeconds((prev) => prev + 1);
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
      await record_streak({ habit_id: habit._id });
    } catch (err) {
      console.log(err);
    } finally {
      setBtnLoading(false);
      setIsRunning(false);
      // setVisible(false);
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
              borderColor: Colors[theme].primary,
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
            disabled={btnLoading}
            style={{
              backgroundColor: Colors[theme].primary,
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
