import React from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import EditHabitContent from "@/components/habit/EditHabitContent";
import { Id } from "@/convex/_generated/dataModel";

export default function EditHabitModalScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (!habitId) return null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
        paddingTop: insets.top,
      }}
    >
      <EditHabitContent
        habitId={habitId as Id<"habits">}
        onClose={() => router.back()}
      />
    </View>
  );
}
