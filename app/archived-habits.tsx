import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";
import { Id } from "@/convex/_generated/dataModel";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";

import { HabitCard, SubHabitItem } from "@/components/home/HabitCards";
import HabitDetaillsModal from "@/components/habit/HabitDetaillsModal";
import Loading from "@/components/Loading";

export default function ArchivedHabitsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const haptics = useHapitcs();

  const archivedHabits = useQuery(api.habits.get_archived_habits);
  const subHabitsData = useQuery(api.sub_habits.get_user_sub_habits);

  const [expandedHabits, setExpandedHabits] = useState<Set<string>>(new Set());
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<Id<"habits"> | null>(
    null,
  );

  if (archivedHabits === undefined || subHabitsData === undefined) {
    return <Loading />;
  }

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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[theme].background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            haptics.impact("light");
            router.back();
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors[theme].text} />
        </Pressable>
        <Text style={[styles.title, { color: Colors[theme].text }]}>
          Archived Habits
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {archivedHabits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather
              name="archive"
              size={48}
              color={Colors[theme].text_secondary}
            />
            <Text
              style={[
                styles.emptyText,
                { color: Colors[theme].text_secondary },
              ]}
            >
              No archived habits yet.
            </Text>
          </View>
        ) : (
          archivedHabits.map((habit) => {
            // For archived habits, we force them to look completed
            const habitSubHabits = (
              subHabitsData.filter((sh) => sh.parent_habit === habit._id) || []
            ).map((sh) => ({
              ...sh,
              completed: true, // Force appearance of completion
            }));
            const isExpanded = expandedHabits.has(habit._id);

            return (
              <View key={habit._id}>
                <HabitCard
                  id={habit._id}
                  duration={String(habit.duration)}
                  title={habit.habit}
                  done={true} // Force fire button to be "done" and disabled
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
                  onFireIconPress={() => {}} // Disabled via done=true
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
                        onToggle={() => {}} // Disabled
                        themeColor={habit.theme ?? "#eee"}
                        isLast={index === habitSubHabits.length - 1}
                        isParentDone={true} // Disables press and lowers opacity
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {selectedHabitId && (
        <HabitDetaillsModal
          visible={detailsModalVisible}
          setVisible={setDetailsModalVisible}
          habit_id={selectedHabitId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "NunitoExtraBold",
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    fontFamily: "NunitoMedium",
    fontSize: 16,
    marginTop: 16,
  },
});
