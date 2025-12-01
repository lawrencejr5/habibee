import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useColorScheme } from "@/components/useColorScheme";
import { StatusBar } from "expo-status-bar";

const SplashScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <Image
        source={
          theme === "dark"
            ? require("../assets/images/splash-screen-black.png")
            : require("../assets/images/splash-screen-light.png")
        }
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({});
