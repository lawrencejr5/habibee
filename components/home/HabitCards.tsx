import React, { useState, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text as ThemedText } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { habitIcons } from "@/data/habits";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { formatTime12h } from "@/components/habit/AddSubHabitModal";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const HabitCard: React.FC<{
  duration: string;
  title: string;
  done: boolean;
  streak: number;
  habitType: string;
  themeColor: string;
  id: string;
  onFireIconPress: () => void;
  onCardPress: () => void;
  timer_start_time?: number;
  timer_elapsed?: number;
  target_duration?: number;
  subHabits?: any[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  reminder_time?: string;
  onReminderPress?: () => void;
  onRemoveReminder?: () => void;
}> = ({
  duration,
  title,
  done,
  streak,
  habitType,
  themeColor,
  onFireIconPress,
  onCardPress,
  timer_start_time,
  timer_elapsed,
  target_duration,
  subHabits = [],
  isExpanded = false,
  onToggleExpand,
  reminder_time,
  onReminderPress,
  onRemoveReminder,
}) => {
  const { theme } = useTheme();

  const haptics = useHapitcs();

  const [currentTime, setCurrentTime] = useState<number>(0);

  const calculateCurrentTime = () => {
    const elapsed = timer_elapsed || 0;
    const currentSession = timer_start_time
      ? Math.floor((Date.now() - timer_start_time) / 1000)
      : 0;
    const total = elapsed + currentSession;
    const maxSeconds = (target_duration || 0) * 60;
    if (maxSeconds === 0) return total;
    return Math.min(total, maxSeconds);
  };

  const isRunning = !!timer_start_time;
  useEffect(() => {
    // Periodic update if the timer is running
    setCurrentTime(calculateCurrentTime());
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentTime(calculateCurrentTime());
        // console.log(calculateCurrentTime());
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCurrentTime(calculateCurrentTime());
    }
  }, [timer_start_time, timer_elapsed, target_duration, isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0",
    )}`;
  };

  const isTimerActive = !!timer_start_time || (timer_elapsed || 0) > 0;
  const subHabitsCount = subHabits.length;
  const completedSubHabits = subHabits.filter((s) => s.completed).length;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  return (
    <Animated.View style={[{ marginTop: 15, width: "100%" }, animatedStyle]}>
      {/* Reminder Extension Tab */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          if (onReminderPress) onReminderPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: Colors[theme].surface,
          borderWidth: 2,
          borderColor: Colors[theme].border,
          borderBottomWidth: 0,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          paddingHorizontal: 10,
          paddingBottom: 4,
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: -2,
          zIndex: 10,
        }}
      >
        <Feather
          name={reminder_time ? "clock" : "plus"}
          size={12}
          color={Colors[theme].text}
          style={{ paddingTop: 6 }}
        />
        <Text
          style={{
            fontSize: 10,
            fontFamily: "NunitoBold",
            color: Colors[theme].text,
            paddingTop: 6,
          }}
        >
          {reminder_time ? formatTime12h(reminder_time) : "Add reminder"}
        </Text>
        {reminder_time && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              if (onRemoveReminder) onRemoveReminder();
            }}
            style={{
              marginLeft: 4,
              paddingLeft: 15,
              paddingTop: 6,
            }}
          >
            <Feather name="x" size={14} color={Colors[theme].text_secondary} />
          </Pressable>
        )}
      </Pressable>

      <AnimatedPressable
        onPress={onCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => {
          haptics.impact();
          if (subHabitsCount > 0 && onToggleExpand) {
            onToggleExpand();
          }
        }}
        style={[
          {
            width: "100%",
            backgroundColor: Colors[theme].surface,
            borderTopRightRadius: 15,
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
            borderTopLeftRadius: 0,
            borderWidth: 2,
            borderColor: Colors[theme].border,
            paddingTop: 15,
            paddingBottom: 15,
            position: "relative",
            zIndex: 1,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 5,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 15,
              marginLeft: 5,
              flex: 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: themeColor + "20",
                justifyContent: "center",
                alignItems: "center",
                borderColor: themeColor,
              }}
            >
              <Image
                source={habitIcons[habitType]}
                style={{
                  width: 20,
                  height: 20,
                  tintColor: themeColor,
                }}
              />
            </View>

            <View>
              <ThemedText
                numberOfLines={1}
                style={{ fontFamily: "NunitoBold", fontSize: 14, width: 180 }}
              >
                {title}
              </ThemedText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 15,
                  marginTop: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    width: 80,
                  }}
                >
                  {subHabitsCount > 0 && !isTimerActive ? (
                    <Pressable
                      onPress={onToggleExpand}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                        paddingRight: 10,
                      }}
                    >
                      <Image
                        source={require("../../assets/icons/check-outline.png")}
                        style={{
                          tintColor: Colors[theme].text_secondary,
                          width: 14,
                          height: 14,
                        }}
                      />
                      <ThemedText
                        style={{
                          fontFamily: "NunitoBold",
                          fontSize: 12,
                          color: Colors[theme].text_secondary,
                        }}
                      >
                        {completedSubHabits}/{subHabitsCount}
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <>
                      {duration && duration !== "undefined" ? (
                        <Image
                          source={require("../../assets/icons/clock.png")}
                          style={{
                            tintColor: Colors[theme].text_secondary,
                            width: 14,
                            height: 14,
                          }}
                        />
                      ) : (
                        <Image
                          source={require("../../assets/icons/calendar.png")}
                          style={{
                            tintColor: Colors[theme].text_secondary,
                            width: 14,
                            height: 14,
                          }}
                        />
                      )}
                      <ThemedText
                        style={{
                          fontFamily: "NunitoBold",
                          fontSize: 12,
                          color: Colors[theme].text_secondary,
                        }}
                      >
                        {isTimerActive
                          ? formatTime(currentTime)
                          : duration && duration !== "undefined"
                            ? `${duration} min(s)`
                            : "Daily"}
                      </ThemedText>
                    </>
                  )}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Image
                    source={require("../../assets/icons/fire.png")}
                    style={{
                      tintColor: !done
                        ? Colors[theme].text_secondary
                        : undefined,
                      width: 14,
                      height: 14,
                    }}
                  />
                  <ThemedText
                    style={{
                      color: done
                        ? Colors[theme].accent1
                        : Colors[theme].text_secondary,
                      fontFamily: "NunitoBold",
                    }}
                  >
                    {streak}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => {
              haptics.impact("light");
              onFireIconPress();
            }}
            disabled={done}
            style={{
              borderLeftWidth: 3,
              borderColor: Colors[theme].border,
              width: 50,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              paddingHorizontal: 10,
            }}
          >
            <Image
              source={require("../../assets/icons/fire.png")}
              style={{
                tintColor: !done ? Colors[theme].text_secondary : undefined,
                width: 30,
                height: 30,
              }}
            />
          </Pressable>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

export const SubHabitItem: React.FC<{
  subHabit: any;
  onToggle: () => void;
  themeColor: string;
  isLast: boolean;
}> = ({ subHabit, onToggle, themeColor, isLast }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* L-shaped connector */}
      <View
        style={{
          width: 30,
          height: 40,
          borderBottomLeftRadius: 10,
          borderLeftWidth: 1,
          borderBottomWidth: 1,
          borderColor: Colors[theme].border,
          marginBottom: 20,
        }}
      />
      <AnimatedPressable
        onPress={() => {
          haptics.impact();
          onToggle();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={subHabit.completed}
        style={[
          {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors[theme].surface,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors[theme].border,
            marginRight: 5,
            marginVertical: 5,
            opacity: subHabit.completed ? 0.6 : 1,
          },
          animatedStyle,
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "NunitoMedium",
              fontSize: 14,
              color: Colors[theme].text,
              textDecorationLine: subHabit.completed ? "line-through" : "none",
            }}
          >
            {subHabit.name}
          </Text>
          {subHabit.reminder_time && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
              }}
            >
              <Feather name="clock" size={11} color={themeColor} />
              <Text
                style={{
                  fontFamily: "NunitoMedium",
                  fontSize: 11,
                  color: themeColor,
                }}
              >
                {formatTime12h(subHabit.reminder_time)}
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: subHabit.completed
              ? themeColor
              : Colors[theme].text_secondary,
            backgroundColor: subHabit.completed ? themeColor : "transparent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {subHabit.completed && (
            <Image
              source={require("../../assets/icons/check-fill.png")}
              style={{
                width: 14,
                height: 14,
                tintColor: "#fff",
              }}
            />
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
};
