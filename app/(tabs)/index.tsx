import {
  Image,
  Pressable,
  StyleSheet,
  ScrollView as RNScrollView,
  Dimensions,
} from "react-native";
import { useRef } from "react";
import { Feather } from "@expo/vector-icons";

import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";

import Colors from "@/constants/Colors";

import AddButton from "@/components/AddButton";
import { habitIcons } from "@/data/habits";
import { HabitCard, SubHabitItem } from "@/components/home/HabitCards";

import HabitDetaillsModal from "@/components/habit/HabitDetaillsModal";
import TaskTimerModal from "@/components/habit/TaskTimerModal";
import AddModal from "@/components/home/AddModal";
import { usePathname, useRouter } from "expo-router";
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
import HiveNudgeOverlay from "@/components/hive/HiveNudgeOverlay";
import CreateHiveModal from "@/components/hive/CreateHiveModal";
import { formatTime12h } from "@/components/habit/AddSubHabitModal";
import {
  scheduleSubHabitReminders,
  scheduleHabitReminders,
} from "@/services/notifications";
import ReminderPickerModal from "@/components/habit/ReminderPickerModal";
import GoalCompletedModal from "@/components/habit/GoalCompletedModal";
import HabitContextMenu from "@/components/habit/HabitContextMenu";
import EditHabitModal from "@/components/habit/EditHabitModal";
import DeleteHabitModal from "@/components/habit/DeleteHabitModal";
import { HabitType } from "@/constants/Types";

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
  const router = useRouter();

  const { appLoading } = useLoadingContext();
  const { isLoading: authLoading } = useConvexAuth();
  const { motivationalMsgs } = useMotivationalContext();

  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [aiChatModalVisible, setAiChatModalVisible] = useState<boolean>(false);
  const [createHiveModalVisible, setCreateHiveModalVisible] =
    useState<boolean>(false);
  const [timerModalVisible, setTimerModalVisible] = useState<boolean>(false);
  const [detailsModalVisible, setDetailsModalVisible] =
    useState<boolean>(false);
  const [selectedHabitId, setSelectedHabitId] = useState<Id<"habits"> | null>(
    null,
  );

  const record_streak = useMutation(api.habits.record_streak);
  const toggle_sub_habit = useMutation(api.sub_habits.toggle_sub_habit);
  const update_habit = useMutation(api.habits.update_habit);

  const subHabitsData = useQuery(api.sub_habits.get_user_sub_habits);
  const [expandedHabits, setExpandedHabits] = useState<Set<string>>(new Set());
  const [showNudgeModal, setShowNudgeModal] = useState<boolean>(false);
  const [goalCompletedHabit, setGoalCompletedHabit] =
    useState<HabitType | null>(null);

  const [contextMenuHabit, setContextMenuHabit] = useState<HabitType | null>(
    null,
  );
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderHabitId, setReminderHabitId] = useState<Id<"habits"> | null>(
    null,
  );
  const [reminderInitialTime, setReminderInitialTime] = useState<
    string | undefined
  >(undefined);
  const [reminderTheme, setReminderTheme] = useState<string | undefined>(
    undefined,
  );

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const adScrollViewRef = useRef<RNScrollView>(null);
  const adData = ["hive", "ai"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => {
        const nextIndex = (prev + 1) % adData.length;
        return nextIndex;
      });
    }, 10000); // Swipe every 10 seconds
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (adScrollViewRef.current) {
      const adWidth = Dimensions.get("window").width - 40;
      adScrollViewRef.current.scrollTo({
        x: currentAdIndex * adWidth,
        animated: true,
      });
    }
  }, [currentAdIndex]);

  // Schedule local notifications for sub-habit reminders
  useEffect(() => {
    if (!subHabitsData || !habitData) return;

    // Build a map of habitId -> habitName
    const habitsMap: Record<string, string> = {};
    for (const h of habitData) {
      habitsMap[h._id] = h.habit;
    }

    scheduleSubHabitReminders(subHabitsData as any, habitsMap);
    scheduleHabitReminders(habitData as any);
  }, [subHabitsData, habitData]);

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
    aiChatModalVisible ||
    showNudgeModal ||
    contextMenuOpen ||
    editModalVisible ||
    deleteModalVisible ||
    reminderModalVisible ||
    createHiveModalVisible ||
    !!goalCompletedHabit;

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

  const totalHabits = habitData?.length || 0;
  const completedHabits =
    habitData?.filter((h) => h.lastCompleted === today).length || 0;
  const allHabitsDone = totalHabits > 0 && completedHabits === totalHabits;

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
        stickyHeaderIndices={[2]}
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

        {/* Ad Carousel Container */}
        <View
          style={{
            borderWidth: 1.5,
            borderColor: Colors[theme].primary,
            borderRadius: 15,
            marginTop: 15,
            overflow: "hidden",
          }}
        >
          <RNScrollView
            ref={adScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const contentOffsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(
                contentOffsetX / (Dimensions.get("window").width - 40),
              );
              setCurrentAdIndex(index);
            }}
          >
            {/* Hive Ad Card */}
            <Pressable
              onPress={() => {
                haptics.impact();
                router.push("/(tabs)/hive");
              }}
              style={{
                width: Dimensions.get("window").width - 40,
                backgroundColor: Colors[theme].surface,
                padding: 15,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors[theme].primary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("../../assets/icons/hive.png")}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: "#fff",
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 14,
                    color: Colors[theme].text,
                  }}
                >
                  Join the Habibee Hive! 🐝
                </Text>
                <Text
                  style={{
                    fontFamily: "NunitoRegular",
                    fontSize: 12,
                    color: Colors[theme].text_secondary,
                    marginTop: 2,
                  }}
                >
                  Build streaks and stay accountable with friends.
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

            {/* Habibee AI Ad Card */}
            <Pressable
              onPress={() => {
                haptics.impact();
                setAiChatModalVisible(true);
              }}
              style={{
                width: Dimensions.get("window").width - 40,
                backgroundColor: Colors[theme].surface,
                padding: 15,
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
          </RNScrollView>

          {/* Pagination Dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              paddingBottom: 10,
              backgroundColor: Colors[theme].surface,
            }}
          >
            {adData.map((_, i) => (
              <View
                key={i}
                style={{
                  width: currentAdIndex === i ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    currentAdIndex === i
                      ? Colors[theme].text_secondary
                      : Colors[theme].text_secondary,
                  marginHorizontal: 3,
                }}
              />
            ))}
          </View>
        </View>

        {/* Tasks Header */}
        <View
          onLayout={(event) => {
            tasksSectionY.current = event.nativeEvent.layout.y;
          }}
          style={{
            marginTop: 30,
            backgroundColor: Colors[theme].background,
            paddingVertical: 10,
            zIndex: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ThemedText style={{ fontFamily: "NunitoExtraBold", fontSize: 20 }}>
              Daily Habibees{" "}
              <Text
                style={{
                  fontSize: 16,
                  color: allHabitsDone
                    ? Colors[theme].primary
                    : Colors[theme].text_secondary,
                }}
              >
                ({completedHabits}/{totalHabits})
              </Text>
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
        </View>

        {/* Tasks List */}
        <View>
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
                      reminder_time={habit.reminder_time}
                      onReminderPress={() => {
                        haptics.impact();
                        setReminderHabitId(habit._id);
                        setReminderInitialTime(habit.reminder_time);
                        setReminderTheme(habit.theme);
                        setReminderModalVisible(true);
                      }}
                      onRemoveReminder={async () => {
                        haptics.impact();
                        try {
                          await update_habit({
                            habit_id: habit._id,
                            reminder_time: null as any,
                          });
                          showCustomAlert("Reminder removed", "success");
                        } catch (e: any) {
                          showCustomAlert(e.message || "Error", "danger");
                        }
                      }}
                      onFireIconPress={async () => {
                        haptics.impact();
                        if (!habit.duration) {
                          try {
                            // Check if all sub-habits are completed if any exist
                            if (habitSubHabits.length > 0) {
                              const allCompleted = habitSubHabits.every(
                                (sh) => sh.completed,
                              );
                              if (!allCompleted) {
                                // If sub-habits are not completed, open them first
                                if (!isExpanded) {
                                  toggleExpansion(habit._id);
                                  return;
                                }

                                if (habit.strict) {
                                  showCustomAlert(
                                    "Complete all sub-habits first!",
                                    "warning",
                                  );
                                  return;
                                }
                              }
                            }

                            const res = await record_streak({
                              habit_id: habit._id,
                              current_date: today,
                              week_day: new Date().toLocaleDateString("en-US", {
                                weekday: "short",
                              }),
                            });
                            showCustomAlert("Streak recorded", "success");

                            if (
                              res?.newStreak &&
                              res?.goal &&
                              res.newStreak >= res.goal
                            ) {
                              setGoalCompletedHabit(habit as HabitType);
                            } else if (res?.isFirstOfDay) {
                              setShowNudgeModal(true);
                            }
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
                      onLongPress={() => {
                        haptics.impact("medium");
                        setContextMenuHabit(habit as HabitType);
                        setContextMenuOpen(true);
                      }}
                      onCardPress={() => {
                        haptics.impact("light");
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
                            onToggle={async () => {
                              await toggle_sub_habit({
                                sub_habit_id: sh._id,
                                current_date: today,
                                week_day: new Date().toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                  },
                                ),
                              });
                            }}
                            themeColor={habit.theme ?? "#eee"}
                            isLast={index === habitSubHabits.length - 1}
                            isParentDone={
                              habit.lastCompleted ===
                              new Date().toLocaleDateString("en-CA")
                            }
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
        onFirstStreakOfDay={() => setShowNudgeModal(true)}
        onGoalCompleted={(h: HabitType) => setGoalCompletedHabit(h)}
      />
      {selectedHabitId && (
        <HabitDetaillsModal
          visible={detailsModalVisible}
          setVisible={setDetailsModalVisible}
          habit_id={selectedHabitId!}
          onFirstStreakOfDay={() => setShowNudgeModal(true)}
          onGoalCompleted={(h: HabitType) => setGoalCompletedHabit(h)}
        />
      )}
      <ReminderPickerModal
        visible={reminderModalVisible}
        setVisible={setReminderModalVisible}
        habitId={reminderHabitId}
        initialTime={reminderInitialTime}
        themeColor={reminderTheme}
      />
      <HiveNudgeOverlay
        visible={showNudgeModal}
        onClose={() => setShowNudgeModal(false)}
      />
      <CreateHiveModal
        visible={createHiveModalVisible}
        setVisible={setCreateHiveModalVisible}
      />
      {goalCompletedHabit && (
        <GoalCompletedModal
          visible={!!goalCompletedHabit}
          onClose={() => setGoalCompletedHabit(null)}
          habit={goalCompletedHabit}
        />
      )}
      <HabitContextMenu
        visible={contextMenuOpen}
        onClose={() => setContextMenuOpen(false)}
        habit={contextMenuHabit}
        onEdit={() => setEditModalVisible(true)}
        onDelete={() => setDeleteModalVisible(true)}
      />
      {contextMenuHabit && editModalVisible && (
        <EditHabitModal
          visible={editModalVisible}
          setVisible={setEditModalVisible}
          habit={contextMenuHabit}
        />
      )}
      {contextMenuHabit && deleteModalVisible && (
        <DeleteHabitModal
          visible={deleteModalVisible}
          onClose={() => {
            setDeleteModalVisible(false);
            setContextMenuHabit(null);
            setContextMenuOpen(false);
          }}
          habit={contextMenuHabit}
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
