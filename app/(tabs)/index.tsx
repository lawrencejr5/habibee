import {
  Image,
  Pressable,
  StyleSheet,
  ScrollView as RNScrollView,
} from "react-native";
import { useRef } from "react";

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

import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AIChatModal from "@/components/home/AIChatModal";

import { getFirstDayOfTheWeek } from "@/convex/utils";
import { useCustomAlert } from "@/context/AlertContext";

const Home = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showCustomAlert } = useCustomAlert();
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
  const [detailsModalVisible, setDetailsModalVisible] =
    useState<boolean>(false);
  const [selectedHabitId, setSelectedHabitId] = useState<Id<"habits"> | null>(
    null,
  );

  const record_streak = useMutation(api.habits.record_streak);
  const toggle_sub_habit = useMutation(api.sub_habits.toggle_sub_habit);

  const subHabitsData = useQuery(api.sub_habits.get_user_sub_habits);
  const [expandedHabits, setExpandedHabits] = useState<Set<string>>(new Set());

  const toggleExpansion = (habitId: string) => {
    haptics.impact();
    setExpandedHabits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(habitId)) {
        newSet.delete(habitId);
      } else {
        newSet.add(habitId);
      }
      return newSet;
    });
  };

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const scrollRef = useRef<RNScrollView | null>(null);
  const tasksSectionY = useRef<number>(0);

  const scrollToTasks = () => {
    haptics.impact();
    scrollRef.current?.scrollTo({
      y: tasksSectionY.current,
      animated: true,
    });
  };

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
              (prevIndex) => (prevIndex + 1) % motivationalMsgs!.length,
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const greeting = getGreeting();

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
            source={
              signedIn.profile_url
                ? { uri: signedIn.profile_url }
                : require("../../assets/images/avatar.png")
            }
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderColor: Colors[theme].text,
              borderWidth: 2,
            }}
          />
          <View>
            <ThemedText style={styles.greeting_user}>
              {greeting}, {signedIn.username}
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
        ref={scrollRef}
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

        {/* Habibee AI Ad Card */}
        <Pressable
          onPress={() => {
            setAiChatModalVisible(true);
            haptics.impact();
          }}
          style={{
            backgroundColor: Colors[theme].surface,
            borderWidth: 1.5,
            borderColor: Colors[theme].primary,
            borderRadius: 15,
            padding: 15,
            marginTop: 15,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Image
            source={require("../../assets/images/ai-icon.png")}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 14,
                color: Colors[theme].text,
              }}
            >
              Try Habibee AI for free! 🚀
            </Text>
            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 12,
                color: Colors[theme].text_secondary,
                marginTop: 2,
              }}
            >
              Get personalized habit recommendations and support.
            </Text>
          </View>
          <Image
            source={require("../../assets/icons/chevron-down.png")}
            style={{
              width: 16,
              height: 16,
              tintColor: Colors[theme].primary,
              transform: [{ rotate: "-90deg" }],
            }}
          />
        </Pressable>

        {/* Tasks */}
        <View
          onLayout={(event) => {
            tasksSectionY.current = event.nativeEvent.layout.y;
          }}
          style={{ marginTop: 40 }}
        >
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
              onPress={scrollToTasks}
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
              habitData?.map((habit) => {
                const habitSubHabits =
                  subHabitsData?.filter(
                    (sh) => sh.parent_habit === habit._id,
                  ) || [];
                const isExpanded = expandedHabits.has(habit._id);

                return (
                  <View key={habit._id}>
                    <HabitCard
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
                      timer_start_time={habit.timer_start_time}
                      timer_elapsed={habit.timer_elapsed}
                      target_duration={habit.duration}
                      subHabits={habitSubHabits}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpansion(habit._id)}
                      onFireIconPress={async () => {
                        haptics.impact();
                        if (!habit.duration) {
                          try {
                            // Check if all sub-habits are completed if any exist
                            if (habitSubHabits.length > 0) {
                              const allCompleted = habitSubHabits.every(
                                (sh) => sh.completed,
                              );
                              if (!allCompleted && habit.strict) {
                                showCustomAlert(
                                  "Complete all sub-habits first!",
                                  "warning",
                                );
                                return;
                              }
                            }

                            await record_streak({
                              habit_id: habit._id,
                              current_date: today,
                              week_day: new Date().toLocaleDateString("en-US", {
                                weekday: "short",
                              }),
                            });
                            showCustomAlert("Streak recorded", "success");
                          } catch (error: any) {
                            if (error.data)
                              showCustomAlert(error.data, "danger");
                            else showCustomAlert("An error occured", "danger");
                          }
                        } else {
                          setSelectedHabitId(habit._id);
                          setTimerModalVisible(true);
                        }
                      }}
                      onCardPress={() => {
                        haptics.impact();
                        setSelectedHabitId(habit._id);
                        setDetailsModalVisible(true);
                      }}
                    />
                    {isExpanded && (
                      <View style={{ marginTop: 10 }}>
                        {habitSubHabits.map((sh, index) => (
                          <SubHabitItem
                            key={sh._id}
                            subHabit={sh}
                            onToggle={() =>
                              toggle_sub_habit({
                                sub_habit_id: sh._id,
                                current_date: today,
                                week_day: new Date().toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                  },
                                ),
                              })
                            }
                            themeColor={habit.theme ?? "#eee"}
                            isLast={index === habitSubHabits.length - 1}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
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
        habit={habitData.find((habit) => habit._id === selectedHabitId)}
      />
      {selectedHabitId && (
        <HabitDetaillsModal
          visible={detailsModalVisible}
          setVisible={setDetailsModalVisible}
          habit_id={selectedHabitId!}
        />
      )}
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
  timer_start_time?: number;
  timer_elapsed?: number;
  target_duration?: number;
  subHabits?: any[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
    return Math.min(total, maxSeconds);
  };

  useEffect(() => {
    // Periodic update if the timer is running
    if (timer_start_time) {
      const interval = setInterval(() => {
        setCurrentTime(calculateCurrentTime());
      }, 1000);
      setCurrentTime(calculateCurrentTime());
      return () => clearInterval(interval);
    } else {
      setCurrentTime(calculateCurrentTime());
    }
  }, [timer_start_time, timer_elapsed, target_duration]);

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
    return `${String(minutes).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}`;
  };

  const isTimerActive = !!timer_start_time || (timer_elapsed || 0) > 0;
  const subHabitsCount = subHabits.length;
  const completedSubHabits = subHabits.filter((s) => s.completed).length;

  return (
    <Pressable
      onPress={onCardPress}
      onLongPress={() => {
        haptics.impact();
        if (subHabitsCount > 0 && onToggleExpand) {
          onToggleExpand();
        }
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
              {subHabitsCount > 0 ? (
                <>
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
                </>
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

const SubHabitItem: React.FC<{
  subHabit: any;
  onToggle: () => void;
  themeColor: string;
  isLast: boolean;
}> = ({ subHabit, onToggle, themeColor, isLast }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

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
      <Pressable
        onPress={() => {
          haptics.impact();
          onToggle();
        }}
        disabled={subHabit.completed}
        style={{
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
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: "NunitoMedium",
            fontSize: 14,
            color: Colors[theme].text,
            textDecorationLine: subHabit.completed ? "line-through" : "none",
          }}
        >
          {subHabit.name}
        </Text>
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
      </Pressable>
    </View>
  );
};
