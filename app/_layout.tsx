import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    GoogleSans: require("../assets/fonts/GoogleSans/GoogleSansFlex.ttf"),
    FredokaBold: require("../assets/fonts/Fredoka/Fredoka-Bold.ttf"),
    FredokaLight: require("../assets/fonts/Fredoka/Fredoka-Light.ttf"),
    FredokaMedium: require("../assets/fonts/Fredoka/Fredoka-Medium.ttf"),
    FredokaRegular: require("../assets/fonts/Fredoka/Fredoka-Regular.ttf"),
    FredokaSemiBold: require("../assets/fonts/Fredoka/Fredoka-SemiBold.ttf"),
    FredokaExtraBold: require("../assets/fonts/Fredoka/Fredoka-Bold.ttf"),
    NunitoBold: require("../assets/fonts/Nunito/Nunito-Bold.ttf"),
    NunitoLight: require("../assets/fonts/Nunito/Nunito-Light.ttf"),
    NunitoMedium: require("../assets/fonts/Nunito/Nunito-Medium.ttf"),
    NunitoRegular: require("../assets/fonts/Nunito/Nunito-Regular.ttf"),
    NunitoSemiBold: require("../assets/fonts/Nunito/Nunito-SemiBold.ttf"),
    NunitoExtraBold: require("../assets/fonts/Nunito/Nunito-ExtraBold.ttf"),
    ManropeBold: require("../assets/fonts/Manrope/Manrope-Bold.ttf"),
    ManropeLight: require("../assets/fonts/Manrope/Manrope-Light.ttf"),
    ManropeMedium: require("../assets/fonts/Manrope/Manrope-Medium.ttf"),
    ManropeRegular: require("../assets/fonts/Manrope/Manrope-Regular.ttf"),
    ManropeSemiBold: require("../assets/fonts/Manrope/Manrope-SemiBold.ttf"),
    ManropeExtraBold: require("../assets/fonts/Manrope/Manrope-ExtraBold.ttf"),
    GeistBold: require("../assets/fonts/Geist/Geist-Bold.ttf"),
    GeistLight: require("../assets/fonts/Geist/Geist-Light.ttf"),
    GeistMedium: require("../assets/fonts/Geist/Geist-Medium.ttf"),
    GeistRegular: require("../assets/fonts/Geist/Geist-Regular.ttf"),
    GeistSemiBold: require("../assets/fonts/Geist/Geist-SemiBold.ttf"),
    GeistExtraBold: require("../assets/fonts/Geist/Geist-ExtraBold.ttf"),
    MontserratBold: require("../assets/fonts/Montserrat/Montserrat-Bold.ttf"),
    MontserratLight: require("../assets/fonts/Montserrat/Montserrat-Light.ttf"),
    MontserratMedium: require("../assets/fonts/Montserrat/Montserrat-Medium.ttf"),
    MontserratRegular: require("../assets/fonts/Montserrat/Montserrat-Regular.ttf"),
    MontserratSemiBold: require("../assets/fonts/Montserrat/Montserrat-SemiBold.ttf"),
    MontserratExtraBold: require("../assets/fonts/Montserrat/Montserrat-ExtraBold.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
