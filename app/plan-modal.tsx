import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { PlanContent } from "@/components/plan/PlanContent";

export default function PlanModalScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
        paddingTop: insets.top,
      }}
    >
      <PlanContent showCloseButton={true} onClose={() => router.back()} />
    </View>
  );
}
