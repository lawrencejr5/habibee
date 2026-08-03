import React from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import TaskTimerContent from "@/components/habit/TaskTimerContent";
import { Id } from "@/convex/_generated/dataModel";
import { HabitType } from "@/constants/Types";
import { eventBus, EVENTS } from "@/services/eventBus";

export default function TaskTimerModalScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (!habitId) return null;

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].surface,
        paddingTop: insets.top,
      }}
    >
      <TaskTimerContent
        habitId={habitId as Id<"habits">}
        onClose={handleClose}
        onFirstStreakOfDay={() => {
          eventBus.emit(EVENTS.FIRST_STREAK_OF_DAY);
        }}
        onGoalCompleted={(habit: HabitType) => {
          eventBus.emit(EVENTS.GOAL_COMPLETED, habit);
        }}
      />
    </View>
  );
}
