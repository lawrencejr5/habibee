import { Tabs } from "expo-router";
import React from "react";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Image } from "react-native";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useTheme();

  const haptics = useHapitcs();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          haptics.impact();
        },
      }}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].primary,
        headerShown: useClientOnlyValue(false, false),
        tabBarStyle: {
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: Colors[theme].background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/icons/home.png")}
              style={{
                height: 22,
                width: 22,
                tintColor: focused ? Colors[theme].primary : "#797979",
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: "Connect",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/icons/friends.png")}
              style={{
                height: 22,
                width: 22,
                tintColor: focused ? Colors[theme].primary : "#797979",
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/images/avatar.png")}
              style={{
                height: 40,
                width: 40,
                borderRadius: 25,
                alignSelf: "center",
                marginBottom: -15,
                borderColor: Colors[theme].border,
                borderWidth: focused ? 3 : 1,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
