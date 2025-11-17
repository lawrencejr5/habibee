import { Tabs } from "expo-router";
import React from "react";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Image } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useColorScheme() ?? "light";

  return (
    <Tabs
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
        name="friends"
        options={{
          title: "Friends",
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
                marginBottom: -12,
                borderColor: Colors[theme].primary,
                // borderWidth: focused ? 2 : 0,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
