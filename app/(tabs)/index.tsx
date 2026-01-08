import { Image, Pressable, StyleSheet } from "react-native";

import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";

import Colors from "@/constants/Colors";

import AddButton from "@/components/AddButton";
import { habitIcons } from "@/data/habits";

import HabitDetaillsModal from "@/components/habit/HabitDetaillsModal";
import TaskTimerModal from "@/components/habit/TaskTimerModal";
import AddModal from "@/components/home/AddModal";
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";

import { useLoadingContext } from "@/context/LoadingContext";
import { useMotivationalContext } from "@/context/MotivationContext";
import Loading from "@/components/Loading";
import { useUser } from "@/context/UserContext";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";
import AIChatModal from "@/components/home/AIChatModal";

import { getFirstDayOfTheWeek } from "@/convex/utils";

const Home = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const haptics = useHapitcs();

  const { signedIn } = useUser();
  const today = new Date().toLocaleDateString("en-CA");

  const habitData = useQuery(api.habits.get_user_habits);
  const weekly_stats = useQuery(api.weekly_stats.get_user_weekly_stats);

  const pathname = usePathname();

  const { appLoading } = useLoadingContext();
  const { isLoading: authLoading } = useConvexAuth();
  const { motivationalMsgs } = useMotivationalContext();

  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [aiChatModalVisible, setAiChatModalVisible] = useState<boolean>(false);
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

  // Typing animation effect
  useEffect(() => {
    if (!isOnIndexPage) return;

    const currentMessage = motivationalMsgs?.[currentMessageIndex]?.text;
    let currentIndex = 0;

    if (isTyping && currentMessage) {
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
              (prevIndex) => (prevIndex + 1) % motivationalMsgs!.length
            );
            setIsTyping(true);
          }, 3000);
        }
      }, 50); // Typing speed

      return () => clearInterval(typingInterval);
    }
  }, [currentMessageIndex, isTyping, motivationalMsgs]);

  const open = () => {
    setAddModalVisible(true);
    haptics.impact();
  };

  const modalOpen =
    timerModalVisible ||
    addModalVisible ||
    detailsModalVisible ||
    aiChatModalVisible;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const loading =
    appLoading || authLoading || !habitData || !signedIn || !weekly_stats;

  if (loading) return <Loading />;

  return (
    <View style={{ flex: 1 }}>
      {/* User - Fixed Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 10,
          paddingHorizontal: 10,
          backgroundColor: Colors[theme].background,
          zIndex: modalOpen ? 0 : 2,
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
              Morning, {signedIn.username}
            </ThemedText>
            <Text
              style={[
                styles.date_time,
                { color: Colors[theme].text_secondary },
              ]}
            >
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                day: "2-digit", // '10' (Day of the month)
                month: "short", // 'March' (Full month name)
                year: "numeric",
              })}
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
              color:
                signedIn.last_streak_date === today
                  ? Colors[theme].accent1
                  : Colors[theme].text_secondary,
            }}
          >
            {signedIn.streak ?? 0}
          </Text>
          <Image
            source={require("../../assets/icons/fire.png")}
            style={{
              width: 20,
              height: 20,
              tintColor:
                signedIn.last_streak_date === today
                  ? undefined
                  : Colors[theme].text_secondary,
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
          {weekDays.map((weekday, i) => {
            return <StreakDay key={i} day={weekday} />;
          })}
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
            <ThemedText
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 18,
                textTransform: "capitalize",
              }}
            >
              Hello {signedIn.username}! 👋
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
                  motivationalMsgs![currentMessageIndex].text.length && (
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
            {habitData.length > 0 ? (
              habitData?.map((habit) => (
                <HabitCard
                  key={habit._id}
                  id={habit._id}
                  duration={String(habit.duration)}
                  title={habit.habit}
                  done={
                    habit.lastCompleted ===
                    new Date().toLocaleDateString("en-CA")
                  }
                  streak={habit.current_streak}
                  habitType={habit.icon ?? "default"}
                  themeColor={habit.theme ?? "#eee"}
                  onFireIconPress={() => {
                    // setSelectedHabit({
                    //   title: habit.habit,
                    //   duration: String(habit.duration),
                    // });
                    // setTimerModalVisible(true);
                  }}
                  onCardPress={() => {
                    haptics.impact();
                    setSelectedHabitId(habit._id);
                    setDetailsModalVisible(true);
                  }}
                />
              ))
            ) : (
              <View
                style={{
                  backgroundColor: Colors[theme].surface,
                  borderColor: Colors[theme].border,
                  borderWidth: 3,
                  borderRadius: 20,
                  height: 250,
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 20,
                  paddingHorizontal: 20,
                }}
              >
                <Image
                  source={require("../../assets/icons/empty.png")}
                  style={{
                    width: 70,
                    height: 70,
                    tintColor: Colors[theme].text_secondary,
                  }}
                />

                <Text
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 20,
                    color: Colors[theme].text,
                    marginTop: 20,
                  }}
                >
                  No habits yet!
                </Text>
                <Text
                  style={{
                    fontFamily: "NunitoMedium",
                    fontSize: 14,
                    color: Colors[theme].text_secondary,
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  Let's get started with a new habit and bring out the best
                  verion of you.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      {!modalOpen && (
        <AddButton
          onPress={open}
          onAiPress={() => {
            setAiChatModalVisible(true);
            haptics.impact();
          }}
        />
      )}
      <AddModal visible={addModalVisible} setVisible={setAddModalVisible} />
      <AIChatModal
        visible={aiChatModalVisible}
        setVisible={setAiChatModalVisible}
      />
      <TaskTimerModal
        visible={timerModalVisible}
        setVisible={setTimerModalVisible}
        habit={
          habitData.find((habit) => habit._id === selectedHabitId) as HabitType
        }
      />
      <HabitDetaillsModal
        visible={detailsModalVisible}
        setVisible={setDetailsModalVisible}
        habit_id={selectedHabitId!}
      />
    </View>
  );
};

const StreakDay: React.FC<{ day: string }> = ({ day }) => {
  const { theme } = useTheme();
  const weekly_stats = useQuery(api.weekly_stats.get_user_weekly_stats);
  const sunday = getFirstDayOfTheWeek();
  const week_done = weekly_stats
    ?.filter((stat) => stat.date >= sunday)
    .map((stat) => stat.week_day);

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
          week_done?.includes(day)
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
                {duration} min(s)
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
                  tintColor: !done ? Colors[theme].text_secondary : undefined,
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
            tintColor: !done ? Colors[theme].text_secondary : undefined,
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
    textTransform: "capitalize",
    width: "100%",
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
