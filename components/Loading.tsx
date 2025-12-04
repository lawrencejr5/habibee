import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import React from "react";

import { Text as ThemedText, View as ThemedView } from "./Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

const Loading = () => {
  const { theme } = useTheme();
  return (
    <ThemedView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <ThemedText style={{ fontFamily: "NunitoMedium", fontSize: 16 }}>
          If I'm loading, ur gay
        </ThemedText>
        <ActivityIndicator
          color={Colors[theme].text}
          size={"small"}
          style={{ marginTop: 3 }}
        />
      </View>
    </ThemedView>
  );
};

export default Loading;

const styles = StyleSheet.create({});
