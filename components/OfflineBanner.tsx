import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OfflineBannerProps {
  isOnline: boolean;
}

/**
 * A simple, non-animated banner that sits at the top of the page layout
 * when the device is offline.
 */
const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Colors[theme].surface,
          paddingTop: insets.top,
        },
      ]}
    >
      <Text style={[styles.text, { color: Colors[theme].text }]}>
        You're offline
      </Text>
    </View>
  );
};

export default OfflineBanner;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "transparent", // Default, can be themed if needed
  },
  text: {
    fontFamily: "NunitoBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
