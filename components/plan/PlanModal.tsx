import React, {
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  Pressable,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import PlanTaskItem from "./PlanTaskItem";
import AddPlanModal from "./AddPlanModal";

interface PlanModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const getLocalDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getDayLabel = (dateStr: string): string => {
  const today = new Date();
  const todayStr = getLocalDateStr(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrow);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  if (dateStr === yesterdayStr) return "Yesterday";

  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);

  const diffDays = Math.round(
    (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays >= 2 && diffDays <= 6) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

interface PlanItem {
  _id: Id<"plans">;
  title: string;
  date: string;
  time?: string;
  completed: boolean;
}

interface DayGroup {
  date: string;
  label: string;
  tasks: PlanItem[];
}

const PlanModal: FC<PlanModalProps> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const insets = useSafeAreaInsets();

  const [showAddModal, setShowAddModal] = useState(false);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);

  const plans = useQuery(api.plans.get_plans);
  const addPlan = useMutation(api.plans.add_plan);
  const togglePlan = useMutation(api.plans.toggle_plan);
  const deletePlan = useMutation(api.plans.delete_plan);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const dayGroups: DayGroup[] = useMemo(() => {
    if (!plans) return [];

    const grouped: Record<string, PlanItem[]> = {};
    for (const plan of plans) {
      if (!grouped[plan.date]) {
        grouped[plan.date] = [];
      }
      grouped[plan.date].push(plan as PlanItem);
    }

    for (const date in grouped) {
      grouped[date].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
    }

    const sortedDates = Object.keys(grouped).sort();

    return sortedDates.map((date) => ({
      date,
      label: getDayLabel(date),
      tasks: grouped[date],
    }));
  }, [plans]);

  const handleAdd = async (title: string, date: string, time?: string) => {
    try {
      await addPlan({ title, date, time });
      setShowAddModal(false);
    } catch (e) {
      console.error("Failed to add plan:", e);
    }
  };

  const handleToggle = async (planId: Id<"plans">) => {
    try {
      await togglePlan({ plan_id: planId });
    } catch (e) {
      console.error("Failed to toggle plan:", e);
    }
  };

  const handleDelete = async (planId: Id<"plans">) => {
    try {
      await deletePlan({ plan_id: planId });
    } catch (e) {
      console.error("Failed to delete plan:", e);
    }
  };

  const totalTasks = plans?.length ?? 0;
  const completedTasks = plans?.filter((p) => p.completed).length ?? 0;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        stackBehavior="push"
        onDismiss={() => setVisible(false)}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: Colors[theme].background,
        }}
        handleIndicatorStyle={{
          width: 40,
          height: 4,
          backgroundColor: Colors[theme].border,
          marginTop: 10,
          opacity: 0.5,
        }}
      >
        <BottomSheetView style={[styles.sheetContainer, { paddingBottom: insets.bottom + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>
                Plan Your Day
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: Colors[theme].text_secondary },
                ]}
              >
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>

            {totalTasks > 0 && (
              <View
                style={[
                  styles.statsBadge,
                  { backgroundColor: Colors[theme].surface },
                ]}
              >
                <Text style={[styles.statsText, { color: Colors[theme].primary }]}>
                  {completedTasks}/{totalTasks}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          {plans === undefined ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors[theme].primary} size="small" />
            </View>
          ) : dayGroups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather
                name="clipboard"
                size={56}
                color={Colors[theme].text_secondary}
                style={{ opacity: 0.4 }}
              />
              <Text style={[styles.emptyTitle, { color: Colors[theme].text }]}>
                No plans yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: Colors[theme].text_secondary },
                ]}
              >
                Tap the + button to start planning your day
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {dayGroups.map((group) => (
                <View key={group.date} style={styles.dayGroup}>
                  {group.tasks.map((task) => (
                    <PlanTaskItem
                      key={task._id}
                      title={task.title}
                      time={task.time}
                      completed={task.completed}
                      onToggle={() => handleToggle(task._id)}
                      onDelete={() => handleDelete(task._id)}
                    />
                  ))}
                </View>
              ))}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* FAB */}
          <Pressable
            onPress={() => {
              haptics.impact();
              setShowAddModal(true);
            }}
            style={[
              styles.fab,
              {
                backgroundColor: Colors[theme].primary,
                bottom: insets.bottom + 40,
              },
            ]}
          >
            <Feather name="plus" size={24} color="#fff" />
          </Pressable>

          {/* Watermark */}
          <View style={[styles.watermark, { bottom: insets.bottom + 12 }]} pointerEvents="none">
            <Text
              style={[
                styles.watermarkText,
                { color: Colors[theme].text_secondary },
              ]}
            >
              Plan resets at the end of the day
            </Text>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Add modal */}
      <AddPlanModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "NunitoBold",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "NunitoRegular",
    marginTop: 2,
  },
  statsBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 15,
    fontFamily: "NunitoBold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 10,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "NunitoBold",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "NunitoRegular",
    textAlign: "center",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  dayGroup: {
    marginBottom: 20,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  watermark: {
    position: "absolute",
    left: 20,
    justifyContent: "center",
  },
  watermarkText: {
    fontFamily: "NunitoMedium",
    fontSize: 12,
    opacity: 0.4,
  },
});

export default PlanModal;
