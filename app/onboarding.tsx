import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  ImageSourcePropType,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  FadeOutUp,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

const IMAGE_WIDTH = SCREEN_WIDTH * 0.78;
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.42;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

interface OnboardingSlide {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
}

const slides: OnboardingSlide[] = [
  {
    image: require("@/assets/onbarding/onboarding_1.png"),
    title: "Total Organization.",
    subtitle: "All your goals, categorized and easy to manage.",
  },
  {
    image: require("@/assets/onbarding/onboarding_2.png"),
    title: "Break It Down.",
    subtitle: "Turn big goals into manageable, atomic steps.",
  },
  {
    image: require("@/assets/onbarding/onboarding_3.png"),
    title: "Visualize Your Growth.",
    subtitle:
      "Track your consistency with an elegant, interactive progress grid.",
  },
  {
    image: require("@/assets/onbarding/onboarding_4.png"),
    title: "Habibee AI at your disposal.",
    subtitle:
      "Let AI build and manage the perfect routine tailored to your lifestyle.",
  },
  {
    image: require("@/assets/onbarding/onboarding_5.png"),
    title: "Focus in the Moment.",
    subtitle:
      "Use the precision timer to crush your habits without distractions.",
  },
  {
    image: require("@/assets/onbarding/onboarding_6.png"),
    title: "Build Your Hive.",
    subtitle:
      "Stay accountable with your inner circle and buzz friends to stay on track.",
  },
];

const ONBOARDING_KEY = "habibee_onboarding_seen";

const OnboardingScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[theme];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const isSwipingRef = useRef(false);

  const translateX = useSharedValue(0);

  const isLastSlide = currentIndex === slides.length - 1;
  const isFirstSlide = currentIndex === 0;

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(auth)/signin");
  }, []);

  const goToNext = useCallback(() => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    setDirection("forward");
    setAnimKey((k) => k + 1);
    setCurrentIndex((i) => i + 1);
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 400);
  }, []);

  const goToPrev = useCallback(() => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    setDirection("backward");
    setAnimKey((k) => k + 1);
    setCurrentIndex((i) => i - 1);
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 400);
  }, []);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      finishOnboarding();
    } else {
      goToNext();
    }
  }, [isLastSlide, finishOnboarding, goToNext]);

  const handleSkip = useCallback(() => {
    finishOnboarding();
  }, [finishOnboarding]);

  const handleDotPress = useCallback(
    (index: number) => {
      if (index === currentIndex || isSwipingRef.current) return;
      isSwipingRef.current = true;
      setDirection(index > currentIndex ? "forward" : "backward");
      setAnimKey((k) => k + 1);
      setCurrentIndex(index);
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 400);
    },
    [currentIndex]
  );

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      // Clamp drag if at boundaries
      if (isFirstSlide && event.translationX > 0) {
        translateX.value = event.translationX * 0.15; // rubber band
      } else if (isLastSlide && event.translationX < 0) {
        translateX.value = event.translationX * 0.15;
      } else {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const swipedLeft = event.translationX < -SWIPE_THRESHOLD;
      const swipedRight = event.translationX > SWIPE_THRESHOLD;

      if (swipedLeft && !isLastSlide) {
        runOnJS(goToNext)();
      } else if (swipedRight && !isFirstSlide) {
        runOnJS(goToPrev)();
      }

      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const slide = slides[currentIndex];

  // Animation configs for enter/leave based on direction
  const imageEntering =
    direction === "forward"
      ? SlideInRight.duration(500).springify().damping(18).stiffness(120)
      : SlideInLeft.duration(500).springify().damping(18).stiffness(120);

  const imageExiting =
    direction === "forward"
      ? SlideOutLeft.duration(300)
      : SlideOutRight.duration(300);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <StatusBar style={theme === "dark" ? "light" : "dark"} />

        {/* Header area */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}
        >
          <Image
            source={
              theme === "dark"
                ? require("@/assets/images/name-logo-black.png")
                : require("@/assets/images/name-logo-white.png")
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Screenshot image with curved borders */}
        <Animated.View style={[styles.imageSection, dragStyle]}>
          <Animated.View
            key={`image-${animKey}`}
            entering={imageEntering}
            exiting={imageExiting}
            style={[
              styles.imageWrapper,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Image
              source={slide.image}
              style={styles.screenshotImage}
              resizeMode="cover"
            />
          </Animated.View>
        </Animated.View>

        {/* Dot indicators */}
        <Animated.View
          entering={FadeIn.duration(400).delay(300)}
          style={styles.dotsContainer}
        >
          {slides.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <Pressable
                key={index}
                onPress={() => handleDotPress(index)}
                hitSlop={8}
              >
                <Animated.View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isActive
                        ? colors.primary
                        : theme === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.12)",
                      width: isActive ? 28 : 8,
                    },
                  ]}
                />
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Text content */}
        <View style={styles.textSection}>
          <Animated.Text
            key={`title-${animKey}`}
            entering={FadeInUp.duration(500).delay(150).springify().damping(16)}
            exiting={FadeOutUp.duration(200)}
            style={[styles.title, { color: colors.text }]}
          >
            {slide.title}
          </Animated.Text>
          <Animated.Text
            key={`subtitle-${animKey}`}
            entering={FadeInUp.duration(500).delay(250).springify().damping(16)}
            exiting={FadeOutDown.duration(200)}
            style={[styles.subtitle, { color: colors.text_secondary }]}
          >
            {slide.subtitle}
          </Animated.Text>
        </View>

        {/* Bottom controls */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(400)}
          style={[
            styles.bottomControls,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          {/* Skip button */}
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Text style={[styles.skipText, { color: colors.text_secondary }]}>
              Skip
            </Text>
          </Pressable>

          {/* Next button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.nextButton,
              {
                backgroundColor: colors.primary,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            <Animated.View
              key={`btn-${animKey}`}
              entering={ZoomIn.duration(300)}
              style={styles.nextButtonInner}
            >
              <Text style={styles.nextText}>
                {isLastSlide ? "Get Started" : "Next"}
              </Text>
              <Text style={styles.arrowIcon}>→</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 140,
    height: 36,
  },
  imageSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    maxHeight: IMAGE_HEIGHT + 40,
    marginTop: 20,
  },
  imageWrapper: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 24,
    borderWidth: 2,
    overflow: "hidden",
    // Shadow for depth
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  screenshotImage: {
    width: "100%",
    height: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  textSection: {
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 24,
    minHeight: 110,
  },
  title: {
    fontSize: 26,
    fontFamily: "NunitoExtraBold",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "NunitoMedium",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 28,
    marginTop: "auto",
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "NunitoSemiBold",
    letterSpacing: 0.2,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  nextButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nextText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "NunitoBold",
  },
  arrowIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "NunitoBold",
  },
});
