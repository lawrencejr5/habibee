import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";

import { Text as ThemedText } from "../Themed";

import Colors from "@/constants/Colors";
import { Entypo, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { habitIcons } from "@/data/habits";
import TaskTimerModal from "./TaskTimerModal";
import EditHabitModal from "./EditHabitModal";
import DeleteHabitModal from "./DeleteHabitModal"; // Import the new modal
import CheckSubHabitModal from "./CheckSubHabitModal";
import { useHapitcs } from "@/context/HapticsContext";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { useTheme } from "@/context/ThemeContext";
import { ActivityIndicator } from "react-native";
import { useCustomAlert } from "@/context/AlertContext";

interface HabitDetailsModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habit_id: Id<"habits">;
}

const HabitDetaillsModal: FC<HabitDetailsModalProps> = ({
  visible,
  setVisible,
  habit_id,
}) => {
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();
  const { theme } = useTheme();

  const scrollViewRef = useRef<ScrollView>(null);

  const today = new Date().toLocaleDateString("en-CA");

  const habitsData = useQuery(api.habits.get_user_habits);
  const habitEnteries = useQuery(api.habits.get_habit_enteries, { habit_id });

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  // Generate heat map data (365 days) — memoized so it only runs when `habit_id` changes
  const weeks = useMemo(() => {
    if (!habitEnteries) return [];

    const grid: { date: string; completed: boolean }[][] = [];
    let currentWeek: { date: string; completed: boolean }[] = [];
    const totalDays = 364; // 52 weeks * 7 days

    // 1. Create the fast lookup set
    const completedSet = new Set(
      habitEnteries.filter((e) => e.status === "completed").map((e) => e.date),
    );

    const today = new Date();

    // 2. Find the "End Date" (This coming Saturday)
    // today.getDay(): 0 = Sun, 1 = Mon ... 3 = Wed ... 6 = Sat
    // If today is Wed (3), we add 3 days to reach Sat (6).
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = 6 - dayOfWeek;

    const gridEndDate = new Date(today);
    gridEndDate.setDate(today.getDate() + daysUntilSaturday);

    // 3. Find the "Start Date" (52 weeks ago Sunday)
    const startDate = new Date(gridEndDate);
    startDate.setDate(gridEndDate.getDate() - totalDays + 1);

    // 4. Loop from Start (Sunday) to End (Saturday)
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const dateStr = d.toLocaleDateString("en-CA");

      // Check the set. Future dates naturally won't be in the set, so they return false.
      const isCompleted = completedSet.has(dateStr);

      currentWeek.push({ date: dateStr, completed: isCompleted });

      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    return grid;
  }, [habitEnteries]);

  const [timerModalVisible, setTimerModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [showEditButton, setShowEditButton] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false); // State for delete modal
  const [checkSubHabitModalVisible, setCheckSubHabitModalVisible] =
    useState<boolean>(false);

  const subHabits = useQuery(api.sub_habits.get_sub_habits, {
    parent_habit_id: habit_id,
  });

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

  const record_streak = useMutation(api.habits.record_streak);

  const handleStart = async () => {
    haptics.impact();
    if (habit && !habit?.duration) {
      try {
        await record_streak({
          habit_id: habit._id,
          current_date: today,
          week_day: new Date().toLocaleDateString("en-US", {
            weekday: "short",
          }),
        });
        showCustomAlert("Streak recorded", "success");
      } catch (error) {
        console.log(error);
      }
    } else {
      setTimerModalVisible(true);
    }
  };

  // Render nothing when not visible to avoid mounting BottomSheet in a closed/half state
  if (!visible) return null;

  // Find the habit by id
  const habit = habitsData?.find((h) => h._id === habit_id);
  const isDone = habit?.lastCompleted === today;

  if (!habit) {
    return null;
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
                        setShowEditButton(false);
                        setDeleteModalVisible(true);
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
              <View style={{ alignItems: "center", marginTop: 0 }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor:
                      (habit.theme ?? Colors[theme].primary) + "20",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 3,
                    borderColor: habit.theme ?? Colors[theme].primary,
                  }}
                >
                  <Image
                    source={habitIcons[habit.icon ?? "default"]}
                    style={{
                      width: 50,
                      height: 50,
                      tintColor: habit.theme ?? Colors[theme].primary,
                    }}
                  />
                </View>

                <ThemedText
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 24,
                    marginTop: 10,
                  }}
                >
                  {habit.habit}
                </ThemedText>

                <Text
                  style={{
                    fontFamily: "NunitoRegular",
                    fontSize: 14,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  {habit.duration
                    ? `${habit.duration} min(s) daily`
                    : "Direct Task"}
                </Text>
              </View>

              {/* Progress Card */}
              <View
                style={{
                  marginHorizontal: 20,
                  marginTop: 20,
                  backgroundColor: Colors[theme].surface,
                  borderWidth: 2,
                  borderColor: Colors[theme].border,
                  borderRadius: 15,
                  paddingHorizontal: 20,
                  paddingVertical: 15,
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
                        fontSize: 12,
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
                          fontSize: 25,
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
                        fontSize: 12,
                        color: Colors[theme].text_secondary,
                      }}
                    >
                      Goal Progress
                    </Text>
                    <ThemedText
                      style={{
                        fontFamily: "NunitoExtraBold",
                        fontSize: 25,
                        marginTop: 5,
                      }}
                    >
                      {Math.min(
                        Math.ceil((habit.current_streak / habit.goal) * 100),
                        100,
                      )}
                      %
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Sub Habits Card */}
              {subHabits && subHabits.length > 0 && (
                <Pressable
                  onPress={() => {
                    haptics.impact();
                    setCheckSubHabitModalVisible(true);
                  }}
                  style={{
                    marginHorizontal: 20,
                    marginTop: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 15,
                    backgroundColor: Colors[theme].surface,
                    borderRadius: 15,
                    borderWidth: 2,
                    borderColor: Colors[theme].border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather
                      name="layers"
                      size={24}
                      color={habit.theme ?? Colors[theme].primary}
                      style={{ marginRight: 15 }}
                    />
                    <View>
                      <Text
                        style={{
                          fontFamily: "NunitoBold",
                          fontSize: 16,
                          color: Colors[theme].text,
                        }}
                      >
                        Sub-Habits
                      </Text>
                      <Text
                        style={{
                          fontFamily: "NunitoMedium",
                          fontSize: 14,
                          color: Colors[theme].text_secondary,
                        }}
                      >
                        {subHabits.filter((s) => s.completed).length}/
                        {subHabits.length} completed
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={24}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
              )}

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

                {weeks.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: Colors[theme].surface,
                      height: 100,
                      width: "100%", // This now works because it's inside a normal View, not a ScrollView
                      borderRadius: 10,
                      justifyContent: "center", // Optional: centers text/icon if you add one
                      alignItems: "center",
                      marginBottom: 15,
                    }}
                  >
                    <ActivityIndicator color={Colors[theme].text_secondary} />
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    ref={scrollViewRef}
                    showsHorizontalScrollIndicator={false}
                    onContentSizeChange={() =>
                      scrollViewRef.current?.scrollToEnd({ animated: false })
                    }
                  >
                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 3,
                          marginBottom: 15,
                        }}
                      >
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
                                    ? (habit.theme ?? Colors[theme].primary) +
                                      "cc"
                                    : Colors[theme].border,
                                }}
                              />
                            ))}
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                )}
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
                  backgroundColor: habit.theme ?? Colors[theme].primary,
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
                {habit.duration ? (
                  <Text
                    style={{
                      fontFamily: "NunitoExtraBold",
                      fontSize: 16,
                      color: "#fff",
                    }}
                  >
                    {isDone
                      ? "Completed for today"
                      : habit.timer_start_time || habit.timer_elapsed
                        ? "Continue timer"
                        : "Start timer"}
                  </Text>
                ) : (
                  <Text
                    style={{
                      fontFamily: "NunitoExtraBold",
                      fontSize: 16,
                      color: "#fff",
                    }}
                  >
                    Record streak
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
      <TaskTimerModal
        visible={timerModalVisible}
        setVisible={setTimerModalVisible}
        habit={habit}
      />
      <EditHabitModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        habit={habit}
      />
      {/* Delete Habit Modal */}
      <DeleteHabitModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
        }}
        habit={habit}
      />
      <CheckSubHabitModal
        visible={checkSubHabitModalVisible}
        setVisible={setCheckSubHabitModalVisible}
        habit_id={habit_id}
        themeColor={habit.theme ?? Colors[theme].primary}
      />
    </>
  );
};

export default HabitDetaillsModal;

const styles = StyleSheet.create({});
