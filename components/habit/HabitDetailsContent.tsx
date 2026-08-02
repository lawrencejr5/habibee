/**
 * HabitDetailsContent
 * ─────────────────────────────────────────────────────────────────────────────
 * Platform-agnostic habit details UI. Shared between:
 *  - HabitDetaillsModal.tsx (Android) — wrapped in BottomSheetModal
 *  - app/habit-details-modal.tsx (iOS) — rendered inside a Stack.Screen
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Text as ThemedText } from "../Themed";
import Colors from "@/constants/Colors";
import { Entypo, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { habitIcons } from "@/data/habits";
import { useHapitcs } from "@/context/HapticsContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/context/ThemeContext";
import { useCustomAlert } from "@/context/AlertContext";
import { HabitType } from "@/constants/Types";
import { usePremium } from "@/context/PremiumContext";

// Nested modal components (these stay bottom sheets on all platforms)
import TaskTimerModal from "./TaskTimerModal";
import EditHabitModal from "./EditHabitModal";
import DeleteHabitModal from "./DeleteHabitModal";
import CheckSubHabitModal from "./CheckSubHabitModal";
import UpgradeModal from "@/components/account/UpgradeModal";

export interface HabitDetailsContentProps {
  habitId: Id<"habits">;
  onClose: () => void;
  onFirstStreakOfDay?: () => void;
  onGoalCompleted?: (habit: HabitType) => void;
}

const HabitDetailsContent: React.FC<HabitDetailsContentProps> = ({
  habitId,
  onClose,
  onFirstStreakOfDay,
  onGoalCompleted,
}) => {
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();
  const { theme } = useTheme();

  const habitsData = useQuery(api.habits.get_user_habits);
  const archivedHabits = useQuery(api.habits.get_archived_habits);
  const habit =
    habitsData?.find((h) => h._id === habitId) ||
    archivedHabits?.find((h) => h._id === habitId);

  const heatMapScrollRef = useRef<ScrollView>(null);

  const today = new Date().toLocaleDateString("en-CA");
  const habitEnteries = useQuery(api.habits.get_habit_enteries, {
    habit_id: habitId,
  });

  const weeks = useMemo(() => {
    if (!habitEnteries) return [];

    const grid: { date: string; completed: boolean }[][] = [];
    let currentWeek: { date: string; completed: boolean }[] = [];
    const totalDays = 364;

    const completedSet = new Set(
      habitEnteries.filter((e) => e.status === "completed").map((e) => e.date),
    );

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = 6 - dayOfWeek;
    const gridEndDate = new Date(today);
    gridEndDate.setDate(today.getDate() + daysUntilSaturday);

    const startDate = new Date(gridEndDate);
    startDate.setDate(gridEndDate.getDate() - totalDays + 1);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toLocaleDateString("en-CA");
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
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [checkSubHabitModalVisible, setCheckSubHabitModalVisible] =
    useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const { isPremium } = usePremium();
  const [upgradeModalVisible, setUpgradeModalVisible] =
    useState<boolean>(false);

  const subHabits = useQuery(api.sub_habits.get_sub_habits, {
    parent_habit_id: habitId,
  });

  const record_streak = useMutation(api.habits.record_streak);
  const restore_habit = useMutation(api.habits.restore_habit);

  const router = useRouter();

  const handleStart = async () => {
    if (!habit) return;
    haptics.impact();

    if (subHabits && subHabits.length > 0) {
      const allCompleted = subHabits.every((sh) => sh.completed);
      if (!allCompleted) {
        setCheckSubHabitModalVisible(true);
        showCustomAlert("Complete your sub-habits first!", "warning");
        return;
      }
    }

    if (habit && !habit?.duration) {
      setIsRecording(true);
      try {
        const res = await record_streak({
          habit_id: habit._id,
          current_date: today,
          week_day: new Date().toLocaleDateString("en-US", {
            weekday: "short",
          }),
        });
        showCustomAlert("Streak recorded", "success");
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
      } catch (error) {
        console.log(error);
      } finally {
        setIsRecording(false);
      }
    } else {
      if (Platform.OS === "ios") {
        router.push({
          pathname: "/task-timer-modal",
          params: { habitId: habit._id },
        });
      } else {
        setTimerModalVisible(true);
      }
    }
  };

  const handleRestore = async () => {
    haptics.impact();
    if (!isPremium && habitsData && habitsData.length >= 3) {
      setUpgradeModalVisible(true);
      return;
    }
    setIsRecording(true);
    try {
      const today = new Date().toLocaleDateString("en-CA");
      await restore_habit({ habit_id: habitId, today });
      showCustomAlert("Habit restored", "success");
      onClose();
    } catch (error) {
      showCustomAlert("Failed to restore habit", "danger");
    } finally {
      setIsRecording(false);
    }
  };

  const isDone = habit?.lastCompleted === today;

  if (!habit) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors[theme].primary} />
      </View>
    );
  }

  return (
    <>
      <View
        style={{
          flex: 1,
          height: "100%",
          backgroundColor: Colors[theme].background,
        }}
      >
        {showEditButton && (
          <Pressable
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 1, backgroundColor: "transparent" },
            ]}
            onPress={() => setShowEditButton(false)}
          />
        )}

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <Pressable
            style={{ padding: 8 }}
            onPress={() => {
              haptics.impact();
              onClose();
            }}
          >
            <Feather
              name={"chevron-down"}
              size={28}
              color={Colors[theme].text}
            />
          </Pressable>
          <Pressable
            style={{ padding: 10 }}
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
                top: Platform.OS === "ios" ? 20 : 20,
                backgroundColor: Colors[theme].surface,
                borderColor: Colors[theme].border,
                borderWidth: 2,
                paddingHorizontal: 15,
                width: 150,
                borderRadius: 8,
                zIndex: 2,
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
                  setShowEditButton(false);
                  if (Platform.OS === "ios") {
                    router.push({
                      pathname: "/edit-habit-modal",
                      params: { habitId },
                    });
                  } else {
                    setEditModalVisible(true);
                  }
                }}
              >
                <Feather name="edit" size={16} color={Colors[theme].text} />
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

        {/* Main content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
        >
          {/* Icon and Color */}
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: (habit.theme ?? Colors[theme].primary) + "20",
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
                    fontSize: 10,
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
                    style={{ fontFamily: "NunitoExtraBold", fontSize: 20 }}
                  >
                    {habit.current_streak}
                  </ThemedText>
                  <Image
                    source={require("@/assets/icons/fire.png")}
                    style={{ width: 18, height: 18 }}
                  />
                </View>
              </View>

              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 10,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  Highest Streak
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
                    style={{ fontFamily: "NunitoExtraBold", fontSize: 20 }}
                  >
                    {habit.highest_streak}
                  </ThemedText>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={18}
                    color="#FFD700"
                  />
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 10,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  Goal Progress
                </Text>
                <ThemedText
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 20,
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
                  {subHabits === undefined
                    ? "Loading..."
                    : subHabits.length > 0
                      ? habit.archived
                        ? `${subHabits.length}/${subHabits.length} completed`
                        : `${subHabits.filter((s) => s.completed).length}/${subHabits.length} completed`
                      : "Add sub habits"}
                </Text>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={24}
              color={Colors[theme].text_secondary}
            />
          </Pressable>

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
                  width: "100%",
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <ActivityIndicator color={Colors[theme].text_secondary} />
              </View>
            ) : (
              <ScrollView
                horizontal
                ref={heatMapScrollRef}
                showsHorizontalScrollIndicator={false}
                onContentSizeChange={() =>
                  heatMapScrollRef.current?.scrollToEnd({ animated: false })
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
                                ? (habit.theme ?? Colors[theme].primary) + "cc"
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

        {/* Action Button */}
        <View
          style={{
            position: "absolute",
            bottom: habit.archived ? 30 : 0,
            backgroundColor: Colors[theme].background,
            paddingVertical: 50,
            left: 20,
            right: 20,
          }}
        >
          <Pressable
            onPress={habit.archived ? handleRestore : handleStart}
            disabled={(isDone && !habit.archived) || isRecording}
            style={{
              backgroundColor: habit.theme ?? Colors[theme].primary,
              paddingVertical: 16,
              borderRadius: 50,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              opacity: (isDone && !habit.archived) || isRecording ? 0.5 : 1,
            }}
          >
            {isRecording ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : habit.archived ? (
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 16,
                  color: "#fff",
                }}
              >
                Restore Habit
              </Text>
            ) : habit.duration ? (
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

      {/* Nested modals — stay as BottomSheets on Android, Stack on iOS */}
      {Platform.OS === "android" && (
        <TaskTimerModal
          visible={timerModalVisible}
          setVisible={setTimerModalVisible}
          habit={habit as HabitType}
          onFirstStreakOfDay={onFirstStreakOfDay}
          onGoalCompleted={onGoalCompleted}
        />
      )}
      {Platform.OS === "android" && (
        <EditHabitModal
          visible={editModalVisible}
          setVisible={setEditModalVisible}
          habit={habit as HabitType}
        />
      )}
      <DeleteHabitModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        habit={habit as HabitType}
      />
      <CheckSubHabitModal
        visible={checkSubHabitModalVisible}
        setVisible={setCheckSubHabitModalVisible}
        habit_id={habitId}
        themeColor={habit.theme ?? Colors[theme].primary}
      />
      <UpgradeModal
        visible={upgradeModalVisible}
        setVisible={setUpgradeModalVisible}
      />
    </>
  );
};

export default HabitDetailsContent;

const styles = StyleSheet.create({});
