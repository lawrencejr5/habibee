import { Tabs, useNavigation } from "expo-router";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import React, { useEffect, useRef } from "react";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Image, View, Platform } from "react-native";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";

const TABS = [
  {
    name: "index",
    label: "Home",
    sf: { default: "house", selected: "house.fill" },
    icon: require("../../assets/icons/home.png"),
  },
  {
    name: "hive",
    label: "Hive",
    sf: { default: "circle.grid.hex", selected: "circle.grid.hex.fill" },
    icon: require("../../assets/icons/hive.png"),
  },
  {
    name: "account",
    label: "Account",
    sf: { default: "person.crop.circle", selected: "person.crop.circle.fill" },
    icon: require("../../assets/images/avatar.png"),
  },
];

const IOSTabsLayout = () => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const navigation = useNavigation();
  const lastState = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", () => {
      const state = navigation.getState();
      if (state) {
        const activeRoute = state.routes[state.index]?.name;
        if (activeRoute && activeRoute !== lastState.current) {
          if (lastState.current !== null) {
            haptics.impact();
          }
          lastState.current = activeRoute;
        }
      }
    });
    return unsubscribe;
  }, [navigation, haptics]);

  const selectedColor = Colors[theme].primary;
  const defaultColor = theme === "dark" ? "#797979" : "#8e8e93";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
      }}
    >
      <NativeTabs
        tintColor={selectedColor}
        iconColor={{
          default: defaultColor,
          selected: selectedColor,
        }}
        labelStyle={{
          default: {
            color: defaultColor,
            fontFamily: "NunitoSemiBold",
            fontSize: 10,
          },
          selected: {
            color: selectedColor,
            fontFamily: "NunitoSemiBold",
            fontSize: 10,
          },
        }}
        backgroundColor={Colors[theme].background}
        blurEffect={
          theme === "dark"
            ? "systemChromeMaterialDark"
            : "systemChromeMaterialLight"
        }
        shadowColor="transparent"
      >
        {TABS.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <Label>{tab.label}</Label>
            <Icon sf={tab.sf as any} />
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    </View>
  );
};

const AndroidTabsLayout = () => {
  const colorScheme = useColorScheme();
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const { signedIn } = useUser();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
      }}
    >
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
            height: 80,
            elevation: 0,
            borderTopWidth: 0,
            backgroundColor: Colors[theme].background,
          },
          tabBarLabelStyle: {
            marginTop: 10,
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
                  marginTop: 15,
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
          name="hive"
          options={{
            title: "Hive",
            tabBarIcon: ({ focused }) => (
              <Image
                source={require("../../assets/icons/hive.png")}
                style={{
                  marginTop: 15,
                  height: 30,
                  width: 30,
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
                source={
                  signedIn?.profile_url
                    ? { uri: signedIn.profile_url }
                    : require("../../assets/images/avatar.png")
                }
                style={{
                  height: 35,
                  width: 35,
                  borderRadius: 25,
                  alignSelf: "center",
                  marginTop: 30,
                  borderColor: focused
                    ? Colors[theme].text
                    : Colors[theme].text_secondary,
                  borderWidth: focused ? 2 : 1,
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
};

export default function TabLayout() {
  if (Platform.OS === "ios") {
    return <IOSTabsLayout />;
  }
  return <AndroidTabsLayout />;
}
