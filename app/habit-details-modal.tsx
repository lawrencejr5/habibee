import React from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import HabitDetailsContent from "@/components/habit/HabitDetailsContent";
import { Id } from "@/convex/_generated/dataModel";
import { HabitType } from "@/constants/Types";
import { eventBus, EVENTS } from "@/services/eventBus";

export default function HabitDetailsModalScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (!habitId) return null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
      }}
    >
      <HabitDetailsContent
        habitId={habitId as Id<"habits">}
        onClose={() => router.back()}
        onFirstStreakOfDay={() => {
          eventBus.emit(EVENTS.FIRST_STREAK_OF_DAY);
          router.back();
        }}
        onGoalCompleted={(habit: HabitType) => {
          eventBus.emit(EVENTS.GOAL_COMPLETED, habit);
          router.back();
        }}
      />
    </View>
  );
}
