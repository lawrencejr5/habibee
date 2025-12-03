import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router"; // Added useSegments
import * as SplashScreen from "expo-splash-screen";
import CustomSplash from "./splashscreen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { ConvexProvider, ConvexReactClient } from "convex/react";

import DeviceThemeProvider, { useTheme } from "@/context/ThemeContext";

import { useColorScheme } from "@/components/useColorScheme";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import HapticsProvider from "@/context/HapticsContext";
import LoadingProvider from "@/context/LoadingContext";
import MotivationMsgProvider from "@/context/MotivationContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    NunitoBold: require("../assets/fonts/Nunito/Nunito-Bold.ttf"),
    NunitoLight: require("../assets/fonts/Nunito/Nunito-Light.ttf"),
    NunitoMedium: require("../assets/fonts/Nunito/Nunito-Medium.ttf"),
    NunitoRegular: require("../assets/fonts/Nunito/Nunito-Regular.ttf"),
    NunitoSemiBold: require("../assets/fonts/Nunito/Nunito-SemiBold.ttf"),
    NunitoExtraBold: require("../assets/fonts/Nunito/Nunito-ExtraBold.ttf"),
  });

  // Track the current route segment to prevent infinite loops
  const segments = useSegments();

  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/signin");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, loaded]);

  return (
    <ConvexProvider client={convex}>
      <DeviceThemeProvider>
        <HapticsProvider>
          <LoadingProvider>
            <MotivationMsgProvider>
              <NavigationWithTheme loaded={loaded} showSplash={showSplash} />
            </MotivationMsgProvider>
          </LoadingProvider>
        </HapticsProvider>
      </DeviceThemeProvider>
    </ConvexProvider>
  );
}

function NavigationWithTheme({
  loaded,
  showSplash,
}: {
  loaded: boolean;
  showSplash: boolean;
}) {
  const { theme } = useTheme();

  if (!loaded || showSplash) {
    return <CustomSplash />;
  }

  return (
    <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <StatusBar style={theme === "dark" ? "light" : "dark"} />

          <Stack
            screenOptions={{
              headerShown: false,
              presentation: "modal",
              animation: "ios_from_right",
            }}
          />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
