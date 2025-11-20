import { Image, Pressable, StyleSheet } from "react-native";

import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

import AddButton from "@/components/AddButton";
import { habitIcons, habitsData } from "@/data/habits";

import AddModal from "@/components/home/AddModal";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";

const motivationalMessages = [
  "Your future self will thank you! Start building better habits today 🚀",
  "Small steps today lead to big changes tomorrow! Let's get started 💪",
  "Every habit is a vote for the person you want to become ✨",
  "Success is the sum of small efforts repeated daily 🌟",
  "The best time to start was yesterday. The next best time is now! ⏰",
  "Transform your life one habit at a time! You've got this 🎯",
];

export default function TabOneScreen() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();

  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Typing animation effect
  useEffect(() => {
    const currentMessage = motivationalMessages[currentMessageIndex];
    let currentIndex = 0;

    if (isTyping) {
      const typingInterval = setInterval(() => {
        if (currentIndex <= currentMessage.length) {
          setDisplayedText(currentMessage.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
          // Wait 3 seconds before moving to next message
          setTimeout(() => {
            setCurrentMessageIndex(
              (prevIndex) => (prevIndex + 1) % motivationalMessages.length
            );
            setIsTyping(true);
          }, 3000);
        }
      }, 50); // Typing speed

      return () => clearInterval(typingInterval);
    }
  }, [currentMessageIndex, isTyping]);

  const open = () => {
    setAddModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* User - Fixed Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 10,
          backgroundColor: Colors[theme].background,
          zIndex: 2,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={styles.user_container}>
          <Image
            source={require("../../assets/images/avatar.png")}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <View>
            <ThemedText style={styles.greeting_user}>
              Morning, Lawrencejr
            </ThemedText>
            <Text
              style={[
                styles.date_time,
                { color: Colors[theme].text_secondary },
              ]}
            >
              Thur, 10 March 2025
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginTop: 10,
          }}
        >
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 16,
              color: Colors[theme].accent1,
            }}
          >
            365
          </Text>
          <Image
            source={require("../../assets/icons/fire.png")}
            style={{
              width: 20,
              height: 20,
            }}
          />
        </View>
      </View>

      {/* Streak Card */}
      <ThemedView style={[styles.streak_card]}>
        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <StreakDay day="Sun" done={true} />
          <StreakDay day="Mon" done={true} />
          <StreakDay day="Tue" done={true} />
          <StreakDay day="Wed" done={false} />
          <StreakDay day="Thu" done={false} />
          <StreakDay day="Fri" done={false} />
          <StreakDay day="Sat" done={false} />
        </View>
      </ThemedView>

      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: Colors[theme].background,
          },
        ]}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}

        <View
          style={{
            backgroundColor: Colors[theme].surface,
            borderWidth: 3,
            borderColor: Colors[theme].border,
            width: "100%",
            marginTop: 10,
            borderRadius: 15,
            paddingHorizontal: 10,
            paddingVertical: 15,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 15,
          }}
        >
          <Image
            source={
              theme === "light"
                ? require("../../assets/images/icon-nobg-black.png")
                : require("../../assets/images/icon-nobg-white.png")
            }
            style={{ width: 80, height: 80, marginTop: 10 }}
          />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ fontFamily: "NunitoExtraBold", fontSize: 18 }}>
              Hello Lawrencejr! 👋
            </ThemedText>
            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 13,
                color: Colors[theme].text_secondary,
                marginTop: 5,
                minHeight: 40,
              }}
            >
              {displayedText}
              {isTyping &&
                displayedText.length <
                  motivationalMessages[currentMessageIndex].length && (
                  <Text style={{ color: Colors[theme].primary }}>|</Text>
                )}
            </Text>
            <Pressable
              onPress={open}
              style={{
                backgroundColor: Colors[theme].primary,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 7,
                marginTop: 20,
                alignSelf: "flex-end",
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                Add Habit
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tasks */}
        <View style={{ marginTop: 40 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ThemedText style={{ fontFamily: "NunitoExtraBold", fontSize: 20 }}>
              Daily Habibees
            </ThemedText>
            <Pressable
              style={{
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 7,
              }}
            >
              <ThemedText
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                }}
              >
                See all
              </ThemedText>
            </Pressable>
          </View>
          <View>
            {habitsData.map((habit) => (
              <HabitCard
                key={habit.id}
                duration={habit.duration}
                title={habit.title}
                done={habit.done}
                streak={habit.streak}
                habitType={habit.habitType}
                themeColor={habit.themeColor}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <AddButton onPress={open} />
      <AddModal visible={addModalVisible} setVisible={setAddModalVisible} />
    </View>
  );
}

const StreakDay: React.FC<{ day: string; done: boolean }> = ({ day, done }) => {
  const theme = useColorScheme();
  return (
    <View
      style={{
        alignItems: "center",
      }}
    >
      <ThemedText
        style={{
          color: Colors[theme].text_secondary,
          fontFamily: "NunitoBold",
        }}
      >
        {day}
      </ThemedText>
      <Image
        source={
          done
            ? require("../../assets/icons/check-fill.png")
            : require("../../assets/icons/check-outline.png")
        }
        style={{
          tintColor: Colors[theme].primary,
          width: 25,
          marginTop: 15,
          height: 25,
        }}
      />
    </View>
  );
};

const HabitCard: React.FC<{
  duration: string;
  title: string;
  done: boolean;
  streak: number;
  habitType: string;
  themeColor: string;
}> = ({ duration, title, done, streak, habitType, themeColor }) => {
  const theme = useColorScheme();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        backgroundColor: Colors[theme].surface,
        padding: 15,
        marginTop: 15,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: Colors[theme].border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 15,
          marginLeft: 5,
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

        <View>
          <ThemedText
            numberOfLines={1}
            style={{ fontFamily: "NunitoBold", fontSize: 16, width: 200 }}
          >
            {title}
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
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
              <Image
                source={require("../../assets/icons/clock.png")}
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
                {duration}
              </ThemedText>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Image
                source={require("../../assets/icons/fire.png")}
                style={{
                  tintColor: !done ? Colors[theme].text_secondary : "",
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
      <View
        style={{
          borderLeftWidth: 3,
          borderColor: Colors[theme].border,
          width: 50,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Image
          source={require("../../assets/icons/fire.png")}
          style={{
            tintColor: !done ? Colors[theme].text_secondary : "",
            width: 30,
            height: 30,
          }}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  user_container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  greeting_user: {
    fontSize: 16,
    fontFamily: "NunitoExtraBold",
  },
  date_time: {
    fontFamily: "NunitoRegular",
    fontSize: 12,
    marginTop: 5,
  },

  streak_card: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
