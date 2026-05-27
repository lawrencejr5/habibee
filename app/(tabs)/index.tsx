import {
  Image,
  Pressable,
  StyleSheet,
  ScrollView as RNScrollView,
  Dimensions,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useRef } from "react";
import { Feather, FontAwesome, FontAwesome6 } from "@expo/vector-icons";

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

import { useConvexAuth, useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import AIChatModal from "@/components/home/AIChatModal";
import UpgradeModal from "@/components/account/UpgradeModal";

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
import ArchiveHabitModal from "@/components/habit/ArchiveHabitModal";
import StreakFreezeModal from "@/components/home/StreakFreezeModal";
import { HabitType } from "@/constants/Types";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncPendingStreaks } from "@/hooks/useSyncPendingStreaks";
import OfflineBanner from "@/components/OfflineBanner";
import { usePremium } from "@/context/PremiumContext";
import {
  enqueuePendingStreak,
  setLocalLastCompleted,
} from "@/store/offlineStreakStore";

const Home = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { showCustomAlert } = useCustomAlert();
  const haptics = useHapitcs();
  const { isPremium } = usePremium();

  const { isOnline } = useNetworkStatus();

  const { signedIn } = useUser();
  const today = new Date().toLocaleDateString("en-CA");

  const getLocalDateStringForIndex = (sunStr: string, index: number) => {
    const [year, month, day] = sunStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day + index);
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, "0");
    const d = String(targetDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const habitData = useQuery(api.habits.get_user_habits);
  const archivedHabits = useQuery(api.habits.get_archived_habits);
  const weekly_stats = useQuery(api.weekly_stats.get_user_weekly_stats);

  const sundayStr = getFirstDayOfTheWeek();
  const getSaturdayStr = (sunStr: string) => {
    const [year, month, day] = sunStr.split("-").map(Number);
    const sat = new Date(year, month - 1, day + 6);
    const y = sat.getFullYear();
    const m = String(sat.getMonth() + 1).padStart(2, "0");
    const d = String(sat.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const saturdayStr = getSaturdayStr(sundayStr);

  const weeklyCompletions = useQuery(api.habits.get_weekly_habit_completions, {
    start_date: sundayStr,
    end_date: saturdayStr,
  });

  const pathname = usePathname();
  const router = useRouter();

  const { appLoading } = useLoadingContext();
  const { isLoading: authLoading } = useConvexAuth();
  const { motivationalMsgs } = useMotivationalContext();

  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [aiChatModalVisible, setAiChatModalVisible] = useState<boolean>(false);
  const [upgradeModalVisible, setUpgradeModalVisible] =
    useState<boolean>(false);
  const [createHiveModalVisible, setCreateHiveModalVisible] =
    useState<boolean>(false);
  const [timerModalVisible, setTimerModalVisible] = useState<boolean>(false);
  const [streakFreezeModalVisible, setStreakFreezeModalVisible] =
    useState<boolean>(false);
  const [detailsModalVisible, setDetailsModalVisible] =
    useState<boolean>(false);
  const [selectedHabitId, setSelectedHabitId] = useState<Id<"habits"> | null>(
    null,
  );

  // Tracks habit IDs completed while offline (for optimistic UI)
  const [offlineCompletedIds, setOfflineCompletedIds] = useState<Set<string>>(
    new Set(),
  );

  // Whether it is safe to run check_streak_and_reset (i.e. sync has finished)
  const [syncReady, setSyncReady] = useState(false);

  const record_streak = useMutation(api.habits.record_streak);
  const toggle_sub_habit = useMutation(api.sub_habits.toggle_sub_habit);
  const update_habit = useMutation(api.habits.update_habit);
  const check_streak_and_reset = useMutation(api.habits.check_streak_and_reset);

  // Flush pending offline streaks when we come back online
  useSyncPendingStreaks({
    isOnline,
    onSyncComplete: () => setSyncReady(true),
  });

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
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);

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

  // ── check_streak_and_reset: only run after sync queue is flushed ──────────
  useEffect(() => {
    if (!syncReady) return;
    check_streak_and_reset({ today });
  }, [syncReady]);

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

  const scrollRef = useRef<RNScrollView | null>(null);
  const tasksSectionY = useRef<number>(0);

  const scrollToTasks = () => {
    haptics.impact();
    scrollRef.current?.scrollTo({
      y: tasksSectionY.current,
      animated: true,
    });
  };

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
    upgradeModalVisible ||
    streakFreezeModalVisible ||
    !!goalCompletedHabit;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const loading =
    appLoading ||
    authLoading ||
    !habitData ||
    !signedIn ||
    !weekly_stats ||
    !weeklyCompletions;

  const totalHabits = habitData?.length || 0;
  const completedHabits =
    habitData?.filter(
      (h) => h.lastCompleted === today || offlineCompletedIds.has(h._id),
    ).length || 0;
  const allHabitsDone = totalHabits > 0 && completedHabits === totalHabits;

  // Derived state: Today's progress calculation (high-resolution sub-habit inclusive)
  const getTodayProgressMetrics = () => {
    let completedCount = 0;
    let totalCountForDay = 0;

    if (!habitData)
      return { completedCount: 0, totalCountForDay: 0, percentage: 0 };

    const completedSet = new Set<string>();
    if (weeklyCompletions?.[today]) {
      weeklyCompletions[today].forEach((id) => completedSet.add(id));
    }
    offlineCompletedIds.forEach((id) => completedSet.add(id));

    for (const h of habitData) {
      const subs = subHabitsData
        ? subHabitsData.filter((sh) => sh.parent_habit === h._id)
        : [];
      if (subs.length > 0) {
        totalCountForDay += subs.length;
        const parentCompleted = completedSet.has(h._id);
        if (parentCompleted) {
          completedCount += subs.length;
        } else {
          completedCount += subs.filter((sh) => sh.completed).length;
        }
      } else {
        totalCountForDay += 1;
        if (completedSet.has(h._id)) {
          completedCount += 1;
        }
      }
    }
    const percentage =
      totalCountForDay > 0
        ? Math.round((completedCount / totalCountForDay) * 100)
        : 0;
    return { completedCount, totalCountForDay, percentage };
  };

  const { percentage: todayProgressPercentage } = getTodayProgressMetrics();

  const getProgressMessage = (pct: number) => {
    if (pct === 0) {
      return "Let's take the first step today! Your habits are waiting.";
    }
    if (pct <= 20) {
      return "You've kicked off the day! Every small action is a victory.";
    }
    if (pct <= 40) {
      return "Off to a great start! You are building real momentum.";
    }
    if (pct <= 60) {
      return "Making steady progress! You're past the halfway mark.";
    }
    if (pct <= 80) {
      return "Strong effort today! You are crushing your daily goals.";
    }
    if (pct < 100) {
      return "So close to perfection! Just one final habit to wrap up the day!";
    }
    return "Incredible! You smashed all your habits today! 🌟";
  };

  if (loading) return <Loading />;

  return (
    <View style={{ flex: 1 }}>
      {/* Offline banner — floats above all content */}
      <OfflineBanner isOnline={isOnline} />
      {/* User - Fixed Header */}
      <View
        style={{
          paddingTop: isOnline ? insets.top + 10 : 10,
          paddingBottom: 10,
          paddingHorizontal: 10,
          backgroundColor: Colors[theme].background,
          zIndex: modalOpen ? 0 : 2,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={styles.user_container}>
          <Image
            source={
              isPremium
                ? theme === "dark"
                  ? require("../../assets/images/premium-home-logo-black.png")
                  : require("../../assets/images/premium-home-logo-white.png")
                : theme === "dark"
                  ? require("../../assets/images/home-logo-black.png")
                  : require("../../assets/images/home-logo-white.png")
            }
            style={{
              width: 140,
              height: 40,
            }}
          />
        </View>

        <Pressable
          onPress={() => {
            haptics.impact();
            setStreakFreezeModalVisible(true);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: Colors[theme].surface,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: Colors[theme].border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
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
          {isPremium && (
            <>
              <View
                style={{
                  width: 1,
                  height: 15,
                  backgroundColor: Colors[theme].border,
                }}
              />
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Image
                  source={require("../../assets/icons/snowflake.png")}
                  style={{
                    width: 20,
                    height: 20,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 16,
                    color: Colors[theme].blue,
                  }}
                >
                  {signedIn.freezes ?? 0}
                </Text>
              </View>
            </>
          )}
        </Pressable>
      </View>

      {/* Streak Card */}
      <ThemedView style={[styles.streak_card]}>
        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 7,
          }}
        >
          {weekDays.map((weekday, i) => {
            const dateStr = getLocalDateStringForIndex(sundayStr, i);
            const todayIndex = new Date().getDay();
            const isActive = i === todayIndex;

            let completedCount = 0;
            let totalCountForDay = totalHabits;
            if (dateStr === today) {
              const completedSet = new Set<string>();
              if (weeklyCompletions?.[dateStr]) {
                weeklyCompletions[dateStr].forEach((id) =>
                  completedSet.add(id),
                );
              }
              offlineCompletedIds.forEach((id) => completedSet.add(id));

              if (habitData) {
                let calcTotal = 0;
                let calcCompleted = 0;
                for (const h of habitData) {
                  const subs = subHabitsData
                    ? subHabitsData.filter((sh) => sh.parent_habit === h._id)
                    : [];
                  if (subs.length > 0) {
                    calcTotal += subs.length;
                    const parentCompleted = completedSet.has(h._id);
                    if (parentCompleted) {
                      calcCompleted += subs.length;
                    } else {
                      calcCompleted += subs.filter((sh) => sh.completed).length;
                    }
                  } else {
                    calcTotal += 1;
                    if (completedSet.has(h._id)) {
                      calcCompleted += 1;
                    }
                  }
                }
                completedCount = calcCompleted;
                totalCountForDay = calcTotal;
              } else {
                completedCount = completedSet.size;
                totalCountForDay = totalHabits;
              }
            } else {
              completedCount = weeklyCompletions?.[dateStr]?.length || 0;
            }

            return (
              <StreakDay
                key={i}
                day={weekday}
                completedCount={completedCount}
                totalCount={totalCountForDay}
                isActive={isActive}
              />
            );
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
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Progress Indicator Card */}
        <View
          style={{
            backgroundColor: Colors[theme].surface,
            borderWidth: 1.5,
            borderColor: Colors[theme].border,
            borderRadius: 15,
            marginTop: 15,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          <DailyProgressCircle
            progress={todayProgressPercentage / 100}
            percentage={todayProgressPercentage}
            size={75}
            strokeWidth={7}
            color={Colors[theme].primary}
            backgroundColor={Colors[theme].border}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 15,
                color: Colors[theme].text,
                marginBottom: 4,
              }}
            >
              Today's Progress
            </Text>
            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 13,
                color: Colors[theme].text_secondary,
                lineHeight: 18,
              }}
            >
              {getProgressMessage(todayProgressPercentage)}
            </Text>
          </View>
        </View>

        {/* Redesigned Premium AI Promo Card */}
        {isPremium && (
          <Pressable
            onPress={() => {
              haptics.impact();
              setAiChatModalVisible(true);
            }}
            style={({ pressed }) => ({
              backgroundColor: Colors[theme].surface,
              borderWidth: 1.5,
              borderColor: Colors[theme].border,
              borderRadius: 15,
              marginTop: 15,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                flex: 1,
              }}
            >
              <View
                style={{
                  backgroundColor: Colors[theme].primary + "20",
                  borderRadius: 12,
                  padding: 8,
                }}
              >
                <Image
                  source={require("../../assets/icons/ai-sparkles.png")}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: Colors[theme].primary,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 12,
                    color: Colors[theme].text_secondary,
                    marginTop: 2,
                  }}
                  numberOfLines={2}
                >
                  Generate new habits and insights with habibee ai
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                haptics.impact();
                setAiChatModalVisible(true);
              }}
              style={{
                backgroundColor: Colors[theme].primary,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                shadowColor: Colors[theme].primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                Try now
              </Text>
            </Pressable>
          </Pressable>
        )}

        {/* Redesigned Premium Upgrade Card for Free Users */}
        {!isPremium && (
          <Pressable
            onPress={() => {
              haptics.impact();
              setUpgradeModalVisible(true);
            }}
            style={({ pressed }) => ({
              backgroundColor: Colors[theme].surface,
              borderWidth: 1.5,
              borderColor: Colors[theme].border,
              borderRadius: 15,
              marginTop: 15,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                flex: 1,
              }}
            >
              <View
                style={{
                  backgroundColor: Colors[theme].primary + "20",
                  borderRadius: 12,
                  padding: 8,
                }}
              >
                <Image
                  source={require("../../assets/icons/premium.png")}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: Colors[theme].primary,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 12,
                    color: Colors[theme].text_secondary,
                    marginTop: 2,
                  }}
                  numberOfLines={2}
                >
                  Unlock Habibee AI and other juicy benefits
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                haptics.impact();
                setUpgradeModalVisible(true);
              }}
              style={{
                backgroundColor: Colors[theme].primary,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                shadowColor: Colors[theme].primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                Upgrade
              </Text>
            </Pressable>
          </Pressable>
        )}

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

        {/* Archived Habits Card */}
        {archivedHabits && archivedHabits.length > 0 && (
          <Pressable
            onPress={() => {
              haptics.impact();
              router.push("/archived-habits");
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: pressed
                ? Colors[theme].border
                : Colors[theme].surface,
              paddingHorizontal: 15,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: Colors[theme].border,
              marginBottom: 5,
            })}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 15 }}
            >
              <Feather name="archive" size={14} color={Colors[theme].text} />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 13,
                  color: Colors[theme].text,
                }}
              >
                Archived habits
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={Colors[theme].text_secondary}
            />
          </Pressable>
        )}

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
                          new Date().toLocaleDateString("en-CA") ||
                        offlineCompletedIds.has(habit._id)
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
                          // ── Shared sub-habit validation ──────────────────
                          if (habitSubHabits.length > 0) {
                            const allCompleted = habitSubHabits.every(
                              (sh) => sh.completed,
                            );
                            if (!allCompleted) {
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

                          // ── Already done (online or offline) ─────────────
                          const alreadyDone =
                            habit.lastCompleted === today ||
                            offlineCompletedIds.has(habit._id);

                          if (alreadyDone) {
                            showCustomAlert(
                              "Streak already counted for today",
                              "warning",
                            );
                            return;
                          }

                          // ── OFFLINE path ──────────────────────────────────
                          if (!isOnline) {
                            const weekDay = new Date().toLocaleDateString(
                              "en-US",
                              { weekday: "short" },
                            );
                            enqueuePendingStreak({
                              habit_id: habit._id,
                              current_date: today,
                              week_day: weekDay,
                            });
                            setLocalLastCompleted(habit._id, today);
                            setOfflineCompletedIds((prev) => {
                              const next = new Set(prev);
                              next.add(habit._id);
                              return next;
                            });
                            showCustomAlert(
                              "Saved offline — syncs when back online",
                              "success",
                            );
                            return;
                          }

                          // ── ONLINE path ───────────────────────────────────
                          try {
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
                          // Timer habit — requires connection
                          if (!isOnline) {
                            showCustomAlert(
                              "Timer habits require a connection",
                              "warning",
                            );
                            return;
                          }
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
                  minHeight: 280,
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 25,
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

                <Pressable
                  onPress={open}
                  style={({ pressed }) => ({
                    backgroundColor: Colors[theme].primary,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 22,
                    borderRadius: 25,
                    marginTop: 25,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: Colors[theme].primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 3,
                  })}
                >
                  <FontAwesome6 color={"#fff"} size={14} name="plus" />
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "NunitoExtraBold",
                      fontSize: 14,
                    }}
                  >
                    Add your first habit
                  </Text>
                </Pressable>
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
        onArchive={() => {
          setContextMenuOpen(false);
          setArchiveModalVisible(true);
        }}
        onDelete={() => setDeleteModalVisible(true)}
        isExpanded={
          contextMenuHabit ? expandedHabits.has(contextMenuHabit._id) : false
        }
        onToggleExpand={() => {
          if (contextMenuHabit) {
            toggleExpansion(contextMenuHabit._id);
          }
        }}
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
      {contextMenuHabit && archiveModalVisible && (
        <ArchiveHabitModal
          visible={archiveModalVisible}
          onClose={() => {
            setArchiveModalVisible(false);
            setContextMenuHabit(null);
            setContextMenuOpen(false);
          }}
          habit={contextMenuHabit}
        />
      )}
      <StreakFreezeModal
        visible={streakFreezeModalVisible}
        setVisible={setStreakFreezeModalVisible}
      />
      <UpgradeModal
        visible={upgradeModalVisible}
        setVisible={setUpgradeModalVisible}
      />
    </View>
  );
};

const ProgressCircle: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  backgroundColor: string;
}> = ({ progress, size = 20, strokeWidth = 2.5, color, backgroundColor }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View
      style={{
        width: size,
        height: size,
        marginTop: 15,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
};

const DailyProgressCircle: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  backgroundColor: string;
  percentage: number;
}> = ({
  progress,
  size = 70,
  strokeWidth = 8,
  color,
  backgroundColor,
  percentage,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "NunitoExtraBold",
            fontSize: 16,
            color: color,
          }}
        >
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

const StreakDay: React.FC<{
  day: string;
  completedCount: number;
  totalCount: number;
  isActive: boolean;
}> = ({ day, completedCount, totalCount, isActive }) => {
  const { theme } = useTheme();

  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const renderIcon = () => {
    if (isActive) {
      if (progress === 1 && totalCount > 0) {
        return (
          <Image
            source={require("../../assets/icons/check-fill.png")}
            style={{
              tintColor: Colors[theme].primary,
              width: 20,
              marginTop: 15,
              height: 20,
            }}
          />
        );
      } else if (progress > 0) {
        return (
          <ProgressCircle
            progress={progress}
            size={20}
            strokeWidth={2.5}
            color={Colors[theme].primary}
            backgroundColor={Colors[theme].primary + "90"}
          />
        );
      } else {
        return (
          <Image
            source={require("../../assets/icons/check-outline.png")}
            style={{
              tintColor: Colors[theme].primary,
              width: 20,
              marginTop: 15,
              height: 20,
            }}
          />
        );
      }
    } else {
      if (completedCount >= 1) {
        return (
          <Image
            source={require("../../assets/icons/check-fill.png")}
            style={{
              tintColor: Colors[theme].primary,
              width: 20,
              marginTop: 15,
              height: 20,
            }}
          />
        );
      } else {
        return (
          <Image
            source={require("../../assets/icons/check-outline.png")}
            style={{
              tintColor: Colors[theme].primary,
              width: 20,
              marginTop: 15,
              height: 20,
            }}
          />
        );
      }
    }
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: Colors[theme].surface,
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderWidth: isActive ? 2 : 1,
        borderColor: isActive ? Colors[theme].primary : Colors[theme].border,
        borderRadius: 10,
      }}
    >
      <ThemedText
        style={{
          color: Colors[theme].text_secondary,
          fontFamily: "NunitoBold",
          fontSize: 12,
        }}
      >
        {day}
      </ThemedText>
      {renderIcon()}
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
    paddingBottom: 5,
  },
});
