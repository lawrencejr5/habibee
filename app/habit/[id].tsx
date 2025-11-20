import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TaskTimerModal from "@/components/habit/TaskTimerModal";
import { Text as ThemedText } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { habitIcons, habitsData } from "@/data/habits";
import * as Haptics from "expo-haptics";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [timerModalVisible, setTimerModalVisible] = useState(false);

  // Find the habit by id
  const habit = habitsData.find((h) => h.id === id);

  if (!habit) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Habit not found</Text>
      </View>
    );
  }

  // Generate heat map data (365 days)
  const generateHeatMapData = () => {
    const data = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Random completion for demo (0 = not done, 1 = done)
      const completed = Math.random() > 0.3 ? 1 : 0;
      data.push({
        date: date.toISOString().split("T")[0],
        completed,
      });
    }
    return data;
  };

  const heatMapData = generateHeatMapData();

  // Group heat map data by weeks (7 days each)
  const weeks: any[][] = [];
  for (let i = 0; i < heatMapData.length; i += 7) {
    weeks.push(heatMapData.slice(i, i + 7));
  }

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimerModalVisible(true);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              padding: 8,
              borderRadius: 50,
              backgroundColor: Colors[theme].surface,
              borderWidth: 2,
              borderColor: Colors[theme].border,
            }}
          >
            <Feather name="arrow-left" size={20} color={Colors[theme].text} />
          </Pressable>

          <Pressable
            style={{
              padding: 8,
              borderRadius: 50,
              backgroundColor: Colors[theme].surface,
              borderWidth: 2,
              borderColor: Colors[theme].border,
            }}
          >
            <Feather
              name="more-vertical"
              size={20}
              color={Colors[theme].text}
            />
          </Pressable>
        </View>

        {/* Icon and Color */}
        <View style={{ alignItems: "center", marginTop: 30 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: habit.themeColor + "20",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: habit.themeColor,
            }}
          >
            <Image
              source={habitIcons[habit.habitType]}
              style={{
                width: 50,
                height: 50,
                tintColor: habit.themeColor,
              }}
            />
          </View>

          <ThemedText
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 24,
              marginTop: 20,
            }}
          >
            {habit.title}
          </ThemedText>

          <Text
            style={{
              fontFamily: "NunitoRegular",
              fontSize: 14,
              color: Colors[theme].text_secondary,
              marginTop: 5,
            }}
          >
            {habit.duration} daily
          </Text>
        </View>

        {/* Progress Card */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 30,
            backgroundColor: Colors[theme].surface,
            borderWidth: 2,
            borderColor: Colors[theme].border,
            borderRadius: 15,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                }}
              >
                Current Streak
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 5,
                  gap: 5,
                }}
              >
                <ThemedText
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 32,
                  }}
                >
                  {habit.streak}
                </ThemedText>
                <Image
                  source={require("@/assets/icons/fire.png")}
                  style={{ width: 24, height: 24 }}
                />
              </View>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                }}
              >
                Goal Progress
              </Text>
              <ThemedText
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 32,
                  marginTop: 5,
                }}
              >
                {Math.floor((habit.streak / 365) * 100)}%
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Heat Map */}
        <View style={{ marginHorizontal: 20, marginTop: 30 }}>
          <ThemedText
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 18,
              marginBottom: 15,
            }}
          >
            Activity
          </ThemedText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={{ flexDirection: "row", gap: 3 }}>
                {weeks.map((week, weekIndex) => (
                  <View key={weekIndex} style={{ gap: 3 }}>
                    {week.map((day, dayIndex) => (
                      <View
                        key={dayIndex}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: day.completed
                            ? Colors[theme].accent1
                            : Colors[theme].border,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoRegular",
                    fontSize: 10,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  Jan
                </Text>
                <Text
                  style={{
                    fontFamily: "NunitoRegular",
                    fontSize: 10,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  Dec
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Start Button - Fixed at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          left: 20,
          right: 20,
        }}
      >
        <Pressable
          onPress={handleStart}
          style={{
            backgroundColor: Colors[theme].primary,
            paddingVertical: 16,
            borderRadius: 50,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 16,
              color: "#fff",
            }}
          >
            Start Task
          </Text>
        </Pressable>
      </View>

      <TaskTimerModal
        visible={timerModalVisible}
        setVisible={setTimerModalVisible}
        duration={habit.duration}
        habitTitle={habit.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
