import React, {
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Text as ThemedText } from "../Themed";

import Colors from "@/constants/Colors";
import { Entypo, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "../useColorScheme";

import { habitIcons } from "@/data/habits";
import TaskTimerModal from "./TaskTimerModal";
import EditHabitModal from "./EditHabitModal";
import DeleteHabitModal from "./DeleteHabitModal"; // Import the new modal
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";

interface HabitDetailsModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habit_id: string;
}

const HabitDetaillsModal: FC<HabitDetailsModalProps> = ({
  visible,
  setVisible,
  habit_id,
}) => {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();

  const today = new Date().toLocaleDateString("en-CA");

  const habitsData = useQuery(api.habits.get_user_habits);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  // Generate heat map data (365 days) — memoized so it only runs when `habit_id` changes
  const heatMapData = useMemo(() => {
    const data: { date: string; completed: number }[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Random completion for demo (0 = not done, 1 = done)
      const completed = Math.random() > 0.3 ? 1 : 0;
      data.push({
        date: date.toISOString().split("T")[0],
        completed,
      });
    }
    return data;
  }, [habit_id]);

  // Group heat map data by weeks (7 days each) — memoized from heatMapData
  const weeks: any[][] = useMemo(() => {
    const out: any[][] = [];
    for (let i = 0; i < heatMapData.length; i += 7) {
      out.push(heatMapData.slice(i, i + 7));
    }
    return out;
  }, [heatMapData]);

  const [timerModalVisible, setTimerModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [showEditButton, setShowEditButton] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false); // State for delete modal

  const handleStart = () => {
    haptics.impact();
    setTimerModalVisible(true);
  };

  // Render nothing when not visible to avoid mounting BottomSheet in a closed/half state
  if (!visible) return null;

  // Find the habit by id
  const habit = habitsData?.find((h) => h._id === habit_id);
  const isDone = habit?.lastCompleted === today;

  if (!habit) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Habit not found</Text>
      </View>
    );
  }

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onClose={() => setVisible(false)}
        backgroundStyle={{
          backgroundColor: Colors[theme].background,
        }}
        handleIndicatorStyle={{
          width: 0,
          height: 0,
          backgroundColor: "grey",
          marginTop: 10,
          borderRadius: 30,
        }}
      >
        <BottomSheetView
          style={{
            flex: 1,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: Colors[theme].background,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {/* Header */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Pressable
                  style={{
                    padding: 8,
                  }}
                  onPress={() => {
                    haptics.impact();
                    bottomSheetRef.current?.close();
                  }}
                >
                  <Feather
                    name="chevron-down"
                    size={30}
                    color={Colors[theme].text}
                  />
                </Pressable>
                <Pressable
                  style={{
                    padding: 10,
                  }}
                  onPress={() => {
                    haptics.impact();
                    setShowEditButton(!showEditButton);
                  }}
                >
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={25}
                    color={Colors[theme].text}
                  />
                </Pressable>
                {showEditButton && (
                  <View
                    style={{
                      position: "absolute",
                      right: 60,
                      top: 20,
                      backgroundColor: Colors[theme].surface,
                      borderColor: Colors[theme].border,
                      borderWidth: 2,
                      paddingHorizontal: 15,
                      width: 150,
                      borderRadius: 8,
                    }}
                  >
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingVertical: 10,
                      }}
                      onPress={() => {
                        haptics.impact();
                        setEditModalVisible(true);
                        setShowEditButton(false);
                      }}
                    >
                      <Feather
                        name="edit"
                        size={16}
                        color={Colors[theme].text}
                      />
                      <Text
                        style={{
                          color: Colors[theme].text,
                          fontFamily: "NunitoMedium",
                          fontSize: 14,
                        }}
                      >
                        Edit habit
                      </Text>
                    </Pressable>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingVertical: 10,
                      }}
                      onPress={() => {
                        haptics.impact();
                        setEditModalVisible(true);
                        setDeleteModalVisible(true); // Open delete modal
                      }}
                    >
                      <Feather
                        name="trash-2"
                        size={16}
                        color={Colors[theme].danger}
                      />
                      <Text
                        style={{
                          color: Colors[theme].danger,
                          fontFamily: "NunitoMedium",
                          fontSize: 14,
                        }}
                      >
                        Delete habit
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Icon and Color */}
              <View style={{ alignItems: "center", marginTop: 30 }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: habit.theme + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: habit.theme,
                  }}
                >
                  <Image
                    source={habitIcons[habit.icon ?? "default"]}
                    style={{
                      width: 50,
                      height: 50,
                      tintColor: habit.theme,
                    }}
                  />
                </View>

                <ThemedText
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 24,
                    marginTop: 20,
                  }}
                >
                  {habit.habit}
                </ThemedText>

                <Text
                  style={{
                    fontFamily: "NunitoRegular",
                    fontSize: 14,
                    color: Colors[theme].text_secondary,
                    marginTop: 5,
                  }}
                >
                  {String(habit.duration)} min(s) daily
                </Text>
              </View>

              {/* Progress Card */}
              <View
                style={{
                  marginHorizontal: 20,
                  marginTop: 30,
                  backgroundColor: Colors[theme].surface,
                  borderWidth: 2,
                  borderColor: Colors[theme].border,
                  borderRadius: 15,
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontFamily: "NunitoBold",
                        fontSize: 14,
                        color: Colors[theme].text_secondary,
                      }}
                    >
                      Current Streak
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 5,
                        gap: 5,
                      }}
                    >
                      <ThemedText
                        style={{
                          fontFamily: "NunitoExtraBold",
                          fontSize: 32,
                        }}
                      >
                        {habit.current_streak}
                      </ThemedText>
                      <Image
                        source={require("@/assets/icons/fire.png")}
                        style={{ width: 24, height: 24 }}
                      />
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontFamily: "NunitoBold",
                        fontSize: 14,
                        color: Colors[theme].text_secondary,
                      }}
                    >
                      Goal Progress
                    </Text>
                    <ThemedText
                      style={{
                        fontFamily: "NunitoExtraBold",
                        fontSize: 32,
                        marginTop: 5,
                      }}
                    >
                      {Math.min(
                        Math.ceil((habit.current_streak / habit.goal) * 100),
                        100
                      )}
                      %
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Heat Map */}
              <View style={{ marginHorizontal: 20, marginTop: 30 }}>
                <ThemedText
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 18,
                    marginBottom: 15,
                  }}
                >
                  Activity
                </ThemedText>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={{ flexDirection: "row", gap: 3 }}>
                      {weeks.map((week, weekIndex) => (
                        <View key={weekIndex} style={{ gap: 3 }}>
                          {week.map((day, dayIndex) => (
                            <View
                              key={dayIndex}
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 2,
                                backgroundColor: day.completed
                                  ? habit.theme + "cc"
                                  : Colors[theme].border,
                              }}
                            />
                          ))}
                        </View>
                      ))}
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "NunitoRegular",
                          fontSize: 10,
                          color: Colors[theme].text_secondary,
                        }}
                      >
                        Jan
                      </Text>
                      <Text
                        style={{
                          fontFamily: "NunitoRegular",
                          fontSize: 10,
                          color: Colors[theme].text_secondary,
                        }}
                      >
                        Dec
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </ScrollView>

            {/* Start Button - Fixed at bottom */}
            <View
              style={{
                position: "absolute",
                bottom: insets.bottom + 20,
                left: 20,
                right: 20,
              }}
            >
              <Pressable
                onPress={handleStart}
                disabled={isDone}
                style={{
                  backgroundColor: habit.theme,
                  paddingVertical: 16,
                  borderRadius: 50,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 4,
                  },
                  shadowOpacity: 0.3,
                  shadowRadius: 4.65,
                  elevation: 8,
                  opacity: isDone ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 16,
                    color: "#fff",
                  }}
                >
                  {isDone ? "Completed for today" : "Start task"}
                </Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
      <TaskTimerModal
        visible={timerModalVisible}
        setVisible={setTimerModalVisible}
        habit={habit as HabitType}
      />
      <EditHabitModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        habit={habit as HabitType}
      />
      {/* Delete Habit Modal */}
      <DeleteHabitModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setVisible(false);
        }}
        habit={habit as HabitType}
      />
    </>
  );
};

export default HabitDetaillsModal;

const styles = StyleSheet.create({});
