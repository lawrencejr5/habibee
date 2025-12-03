import { Image, Pressable, StyleSheet } from "react-native";

import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";

import Colors from "@/constants/Colors";

import AddButton from "@/components/AddButton";
import { habitIcons, habitsData } from "@/data/habits";

import HabitDetaillsModal from "@/components/habit/HabitDetaillsModal";
import TaskTimerModal from "@/components/habit/TaskTimerModal";
import AddModal from "@/components/home/AddModal";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";

import { api } from "@/convex/_generated/api";
import { useStableQuery } from "@/components/convex/useStableQuery";

const motivationalMessages = [
  "Your future self will thank you! Start building habits today 🚀",
  "Small steps today lead to big changes tomorrow! 💪",
  "Every habit is a vote for who you want to become ✨",
  "Success is the sum of small efforts repeated daily 🌟",
  "The best time to start is now! Let's get going ⏰",
  "Transform your life one habit at a time! You've got this 🎯",
];

const Home = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const pathname = usePathname();

  const haptics = useHapitcs();

  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [timerModalVisible, setTimerModalVisible] = useState<boolean>(false);
  const [selectedHabit, setSelectedHabit] = useState<{
    title: string;
    duration: string;
  } | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] =
    useState<boolean>(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Check if we're on the index page
  const isOnIndexPage = pathname === "/" || pathname === "/(tabs)";

  const motivational_messages = useStableQuery(api.motivationa_messages.get);

  // Typing animation effect
  useEffect(() => {
    if (!isOnIndexPage) return;

    const currentMessage = motivationalMessages![currentMessageIndex];
    let currentIndex = 0;

    if (isTyping) {
      const typingInterval = setInterval(() => {
        if (currentIndex <= currentMessage.length) {
          setDisplayedText(currentMessage.slice(0, currentIndex));
          // Add haptic feedback for each character typed only when on index page
          // if (currentIndex > 0 && isOnIndexPage) {
          //   haptics.impact("rigid");
          // }
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
  }, [currentMessageIndex, isTyping, isOnIndexPage]);

  const open = () => {
    setAddModalVisible(true);
    haptics.impact();
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
          zIndex:
            timerModalVisible || addModalVisible || detailsModalVisible ? 0 : 2,
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
                id={habit.id}
                duration={habit.duration}
                title={habit.title}
                done={habit.done}
                streak={habit.streak}
                habitType={habit.habitType}
                themeColor={habit.themeColor}
                onFireIconPress={() => {
                  setSelectedHabit({
                    title: habit.title,
                    duration: habit.duration,
                  });
                  setTimerModalVisible(true);
                }}
                onCardPress={() => {
                  haptics.impact();
                  setSelectedHabitId(habit.id);
                  setDetailsModalVisible(true);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      {!timerModalVisible && !addModalVisible && !detailsModalVisible && (
        <AddButton onPress={open} />
      )}
      <AddModal visible={addModalVisible} setVisible={setAddModalVisible} />
      <TaskTimerModal
        visible={timerModalVisible}
        setVisible={setTimerModalVisible}
        duration={selectedHabit?.duration || "30 mins"}
        habitTitle={selectedHabit?.title || ""}
      />
      <HabitDetaillsModal
        visible={detailsModalVisible}
        setVisible={setDetailsModalVisible}
        habit_id={selectedHabitId!}
      />
    </View>
  );
};

const StreakDay: React.FC<{ day: string; done: boolean }> = ({ day, done }) => {
  const { theme } = useTheme();
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
  id: string;
  onFireIconPress: () => void;
  onCardPress: () => void;
}> = ({
  duration,
  title,
  done,
  streak,
  habitType,
  themeColor,
  id,
  onFireIconPress,
  onCardPress,
}) => {
  const { theme } = useTheme();

  const haptics = useHapitcs();

  return (
    <Pressable
      onPress={onCardPress}
      onLongPress={() => {
        haptics.impact();
      }}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        backgroundColor: Colors[theme].surface,
        paddingVertical: 15,
        paddingHorizontal: 5,
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
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 10,
            backgroundColor: themeColor + "20",
            justifyContent: "center",
            alignItems: "center",
            // borderWidth: 0.5,
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
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
              }}
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
      <Pressable
        onPress={() => {
          haptics.impact();
          onFireIconPress();
        }}
        style={{
          borderLeftWidth: 3,
          borderColor: Colors[theme].border,
          width: 50,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          height: "100%",
          paddingHorizontal: 10,
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
      </Pressable>
    </Pressable>
  );
};

export default Home;

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
