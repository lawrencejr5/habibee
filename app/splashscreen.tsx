import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { useColorScheme } from "@/components/useColorScheme";

const SplashScreen = () => {
  const theme = useColorScheme();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {theme === "dark" ? (
        <Image
          source={require("../assets/images/splash-screen-black.png")}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Image
          source={require("../assets/images/splash-screen-light.png")}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({});
