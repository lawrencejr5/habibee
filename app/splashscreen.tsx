import { StyleSheet, View, Image } from "react-native";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { StatusBar } from "expo-status-bar";

interface Props {
  onReady?: () => void;
}

const SplashScreen = ({ onReady }: Props) => {
  const { theme } = useTheme();

  return (
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      onLayout={onReady}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <Image
        source={
          theme === "dark"
            ? require("../assets/images/splash-screen-black.png")
            : require("../assets/images/splash-screen-light.png")
        }
        style={{ width: "100%", height: "100%" }}
        fadeDuration={0}
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({});
