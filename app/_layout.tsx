import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import CustomSplash from "./splashscreen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import { api } from "@/convex/_generated/api";

// 1. Remove ConvexProvider, keep only ConvexAuthProvider and useConvexAuth
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import DeviceThemeProvider, { useTheme } from "@/context/ThemeContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import HapticsProvider from "@/context/HapticsContext";
import LoadingProvider, { useLoadingContext } from "@/context/LoadingContext";
import MotivationMsgProvider from "@/context/MotivationContext";
import UserProvider, { useUser } from "@/context/UserContext";
import { CustomAlertProvider } from "@/context/AlertContext";

export { ErrorBoundary } from "expo-router";

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

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return (
    <ConvexAuthProvider client={convex} storage={AsyncStorage}>
      <DeviceThemeProvider>
        <HapticsProvider>
          <CustomAlertProvider>
            <LoadingProvider>
              <UserProvider>
                <MotivationMsgProvider>
                  <NavigationWithTheme loaded={loaded} />
                </MotivationMsgProvider>
              </UserProvider>
            </LoadingProvider>
          </CustomAlertProvider>
        </HapticsProvider>
      </DeviceThemeProvider>
    </ConvexAuthProvider>
  );
}

function NavigationWithTheme({ loaded }: { loaded: boolean }) {
  const { theme } = useTheme();
  const { setAppLoading } = useLoadingContext();
  const segments = useSegments();
  const appState = useRef(AppState.currentState);

  const checkStreak = useMutation(api.habits.check_streak_and_reset);
  const performStreakCheck = async () => {
    // setAppLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await checkStreak({ today });
    } catch (err) {
      console.log(err);
    }
    // finally {
    //   setAppLoading(false);
    // }
  };

  useEffect(() => {
    performStreakCheck();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground!
        console.log("App active - Checking for dead streaks...");
        performStreakCheck();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // 4. Move useConvexAuth HERE (Child of Provider)
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signedIn } = useUser();
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Handle Splash Screen hiding
  useEffect(() => {
    if (loaded) {
      // Wait a tiny bit to ensure smooth transition
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
        setShowSplash(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  // 5. Handle Auth Navigation Logic HERE
  useEffect(() => {
    // Wait until fonts are loaded and auth is done loading
    if (!loaded || isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/signin");
    } else if (isAuthenticated && inAuthGroup) {
      if (signedIn?.username === undefined) {
        router.replace("/(auth)/addUsername");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, segments, loaded, isLoading]);

  // Show Custom Splash until fonts load AND Auth determines state
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
              presentation: "card",
              animation: "ios_from_right",
            }}
          />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
