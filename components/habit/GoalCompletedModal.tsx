import React, { FC, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather, Octicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHapitcs } from "@/context/HapticsContext";
import { useCustomAlert, CustomAlertPortal } from "@/context/AlertContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { HabitType } from "@/constants/Types";
import { habitIcons } from "@/data/habits";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";

const { width } = Dimensions.get("window");
const CARD_SIZE = width - 80;

interface GoalCompletedModalProps {
  visible: boolean;
  onClose: () => void;
  habit: HabitType;
}

const EXTENSION_OPTIONS = [50, 100, 200, 365];

const GoalCompletedModal: FC<GoalCompletedModalProps> = ({
  visible,
  onClose,
  habit,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const update_habit = useMutation(api.habits.update_habit);
  const subHabits = useQuery(api.sub_habits.get_sub_habits, {
    parent_habit_id: habit._id,
  });

  const shareCardRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [extendingGoal, setExtendingGoal] = useState(false);
  const themeColor = habit.theme ?? Colors[theme].primary;
  const [selectedExtension, setSelectedExtension] = useState<number | null>(
    null,
  );

  const handleExtendGoal = async () => {
    if (!selectedExtension) return;
    haptics.impact("medium");
    setExtendingGoal(true);
    try {
      const newGoal = habit.goal + selectedExtension;
      await update_habit({
        habit_id: habit._id,
        goal: newGoal,
      });
      showCustomAlert(
        `Goal extended by ${selectedExtension} days! Keep going! 🚀`,
        "success",
      );
      onClose();
    } catch (error: any) {
      showCustomAlert(error.message || "Failed to extend goal", "danger");
    } finally {
      setExtendingGoal(false);
    }
  };

  const captureCard = async (): Promise<string | null> => {
    try {
      if (shareCardRef.current && (shareCardRef.current as any).capture) {
        const uri = await (shareCardRef.current as any).capture();
        return uri;
      }
      return null;
    } catch (error) {
      console.error("Capture failed:", error);
      return null;
    }
  };

  const handleShare = async () => {
    haptics.impact("medium");
    setIsSharing(true);
    try {
      const uri = await captureCard();
      if (!uri) {
        showCustomAlert("Failed to capture card", "danger");
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showCustomAlert("Sharing is not available on this device", "warning");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your Habibee achievement!",
      });
    } catch (error: any) {
      console.error("Share failed:", error);
      showCustomAlert("Failed to share", "danger");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    haptics.impact("medium");
    setIsDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        showCustomAlert("Permission needed to save to your gallery", "warning");
        return;
      }

      const uri = await captureCard();
      if (!uri) {
        showCustomAlert("Failed to capture card", "danger");
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      showCustomAlert("Saved to your gallery! 📸", "success");
    } catch (error: any) {
      console.error("Download failed:", error);
      showCustomAlert("Failed to save", "danger");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onShow={() => haptics.impact("success")}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: Colors[theme].background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 30,
            paddingTop: insets.top,
            alignItems: "center",
            flexGrow: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Header */}
          <View style={[styles.header]}>
            <Image
              source={
                theme === "light"
                  ? require("@/assets/images/icon-nobg-black.png")
                  : require("@/assets/images/icon-nobg-white.png")
              }
              style={{ width: 70, height: 70 }}
            />
          </View>
          <View style={{ width: "100%", alignItems: "center" }}>
            {/* Celebration Text */}
            <View style={styles.celebrationSection}>
              <Text
                style={[styles.celebrationTitle, { color: Colors[theme].text }]}
              >
                You have just reached your{" "}
                <Text style={{ color: themeColor }}>{habit.goal} day</Text> goal
                !
              </Text>
            </View>

            {/* Habit Info Card */}
            <View
              style={[
                styles.habitCard,
                {
                  backgroundColor: Colors[theme].surface,
                  borderColor: themeColor + "40",
                },
              ]}
            >
              {/* Habit Icon + Name */}
              <View style={styles.habitCardHeader}>
                <View
                  style={[
                    styles.habitIconContainer,
                    {
                      backgroundColor: themeColor + "20",
                      borderColor: themeColor,
                    },
                  ]}
                >
                  <Image
                    source={habitIcons[habit.icon ?? "default"]}
                    style={{
                      width: 28,
                      height: 28,
                      tintColor: themeColor,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.habitName, { color: Colors[theme].text }]}
                    numberOfLines={1}
                  >
                    {habit.habit}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "NunitoMedium",
                      fontSize: 13,
                      color: Colors[theme].text_secondary,
                    }}
                  >
                    {habit.duration
                      ? `${habit.duration} min(s) daily`
                      : "Daily Task"}
                    {subHabits && subHabits.length > 0 && (
                      <Text style={{ color: themeColor }}>
                        {" "}
                        • {subHabits.length} sub habit
                        {subHabits.length > 1 ? "s" : ""}
                      </Text>
                    )}
                  </Text>
                </View>
              </View>

              {/* Streak + Goal Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Image
                    source={require("@/assets/icons/fire.png")}
                    style={{ width: 20, height: 20 }}
                  />
                  <Text
                    style={[styles.statValue, { color: Colors[theme].accent1 }]}
                  >
                    {habit.current_streak + 1}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: Colors[theme].text_secondary },
                    ]}
                  >
                    streak
                  </Text>
                </View>
                <View
                  style={[
                    styles.goalBadge,
                    { backgroundColor: Colors[theme].success + "20" },
                  ]}
                >
                  <Octicons
                    name="goal"
                    color={Colors[theme].success}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.goalBadgeText,
                      { color: Colors[theme].success },
                    ]}
                  >
                    100% Goal Reached
                  </Text>
                </View>
              </View>

              {/* Sub Habits removed from here */}
            </View>

            {/* Share Button Below Card */}
            <View
              style={{
                width: width - 40,
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 10,
              }}
            >
              <Pressable
                onPress={handleShare}
                disabled={isSharing}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: Colors[theme].surface,
                  borderWidth: 1,
                  borderColor: Colors[theme].border,
                }}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={themeColor} />
                ) : (
                  <>
                    <Feather name="share-2" size={14} color={themeColor} />
                    <Text
                      style={{
                        fontFamily: "NunitoBold",
                        fontSize: 12,
                        color: themeColor,
                      }}
                    >
                      Share
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <View style={{ width: "100%", alignItems: "center", marginTop: 20 }}>
            {/* Goal Extension Section */}
            <View style={styles.extensionSection}>
              <Text
                style={[styles.extensionTitle, { color: Colors[theme].text }]}
              >
                Keep the momentum going! 💪
              </Text>
              <Text
                style={[
                  styles.extensionSubtitle,
                  { color: Colors[theme].text_secondary },
                ]}
              >
                Extend your goal and keep building
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.extensionPills}
              >
                {EXTENSION_OPTIONS.map((days) => (
                  <Pressable
                    key={days}
                    onPress={() => {
                      haptics.impact("light");
                      setSelectedExtension(days);
                    }}
                    disabled={extendingGoal}
                    style={[
                      styles.extensionPill,
                      {
                        backgroundColor: themeColor + "08",
                        borderColor:
                          selectedExtension === days
                            ? themeColor
                            : themeColor + "30",
                        borderWidth: selectedExtension === days ? 2.5 : 1.5,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.extensionPillText,
                        {
                          color: themeColor,
                        },
                      ]}
                    >
                      +{days} days
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            onPress={handleExtendGoal}
            disabled={extendingGoal || !selectedExtension}
            style={[
              styles.actionBtn,
              {
                backgroundColor: themeColor,
                opacity: extendingGoal || !selectedExtension ? 0.6 : 1,
                flex: 2,
              },
            ]}
          >
            {extendingGoal ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Octicons name="rocket" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Extend Goal</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={onClose}
            style={[
              styles.actionBtn,
              {
                backgroundColor: Colors[theme].surface,
                borderWidth: 2,
                borderColor: themeColor,
                flex: 1,
              },
            ]}
          >
            <Text style={[styles.actionBtnText, { color: themeColor }]}>
              Close
            </Text>
          </Pressable>
        </View>

        {/* Hidden Shareable Card */}
        <View style={styles.hiddenCardContainer}>
          <ViewShot ref={shareCardRef} options={{ format: "png", quality: 1 }}>
            <ShareableCard
              habit={habit}
              themeColor={themeColor}
              subHabits={subHabits}
            />
          </ViewShot>
        </View>
      </View>
      <CustomAlertPortal />
    </Modal>
  );
};

/* ─────────── Shareable 1:1 Card (captured as image) ─────────── */

const ShareableCard: FC<{
  habit: HabitType;
  themeColor: string;
  subHabits?: any[] | null;
}> = ({ habit, themeColor, subHabits }) => {
  const darkBg = "#111316";
  const lightText = "#ffffff";
  const subtleText = "rgba(255,255,255,0.45)";

  return (
    <View style={[shareStyles.card, { backgroundColor: darkBg }]}>
      {/* Top bar: branding */}
      <View style={shareStyles.topBar}>
        <View style={[shareStyles.dot, { backgroundColor: themeColor }]} />
        <Text style={shareStyles.brandName}>habibee</Text>
      </View>

      {/* Center: streak */}
      <View style={shareStyles.centerBlock}>
        <Text style={[shareStyles.goalLabel, { color: subtleText }]}>
          GOAL ACHIEVED
        </Text>
        <View style={shareStyles.streakRow}>
          <Text style={[shareStyles.streakNumber, { color: lightText }]}>
            {habit.current_streak + 1}
          </Text>
          <Text style={shareStyles.fireEmoji}>🔥</Text>
        </View>
        <Text style={[shareStyles.daysWord, { color: themeColor }]}>
          day{(habit.current_streak + 1) !== 1 ? "s" : ""} streak
        </Text>
      </View>

      {/* Bottom: habit chip */}
      <View style={shareStyles.bottomBlock}>
        <View
          style={[
            shareStyles.habitChip,
            {
              backgroundColor: themeColor + "12",
              borderColor: themeColor + "30",
            },
          ]}
        >
          <Image
            source={habitIcons[habit.icon ?? "default"]}
            style={{ width: 16, height: 16, tintColor: themeColor }}
          />
          <Text
            style={[shareStyles.habitChipText, { color: lightText }]}
            numberOfLines={1}
          >
            {habit.habit}
          </Text>
          {subHabits && subHabits.length > 0 && (
            <Text style={[shareStyles.habitChipMeta, { color: subtleText }]}>
              · {subHabits.length} sub habit{subHabits.length > 1 ? "s" : ""}
            </Text>
          )}
        </View>
        <Text style={[shareStyles.goalMeta, { color: subtleText }]}>
          {habit.goal}-day goal
          {habit.duration ? ` · ${habit.duration} min/day` : ""}
        </Text>
      </View>
    </View>
  );
};

/* ─────────── Styles ─────────── */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 10,
    borderRadius: 20,
    alignSelf: "flex-end",
    marginRight: 10,
  },
  celebrationSection: {
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 15,
  },
  celebrationEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  celebrationTitle: {
    fontFamily: "NunitoExtraBold",
    fontSize: 24,
    textAlign: "center",
  },
  celebrationSubtitle: {
    fontFamily: "NunitoMedium",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  habitCard: {
    width: width - 40,
    marginTop: 25,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
  },
  habitCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  habitIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  habitName: {
    fontFamily: "NunitoExtraBold",
    fontSize: 18,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontFamily: "NunitoExtraBold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "NunitoMedium",
    fontSize: 14,
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goalBadgeText: {
    fontFamily: "NunitoBold",
    fontSize: 13,
  },
  subHabitsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(100,100,100,0.15)",
    paddingTop: 14,
  },
  subHabitsTitle: {
    fontFamily: "NunitoBold",
    fontSize: 14,
    marginBottom: 10,
  },
  subHabitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  subHabitCheck: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  extensionSection: {
    width: width - 40,
    marginTop: 25,
    alignItems: "center",
  },
  extensionTitle: {
    fontFamily: "NunitoExtraBold",
    fontSize: 18,
  },
  extensionSubtitle: {
    fontFamily: "NunitoMedium",
    fontSize: 14,
    marginTop: 4,
  },
  extensionPills: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
    paddingHorizontal: 5,
  },
  extensionPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
  },
  extensionPillText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 50,
  },
  actionBtnText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 16,
    color: "#fff",
  },
  hiddenCardContainer: {
    position: "absolute",
    top: -9999,
    left: -9999,
  },
});

const shareStyles = StyleSheet.create({
  card: {
    width: 400,
    height: 500,
    padding: 36,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandName: {
    fontFamily: "NunitoExtraBold",
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  centerBlock: {
    alignItems: "center",
    gap: 4,
  },
  goalLabel: {
    fontFamily: "NunitoBold",
    fontSize: 10,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  streakNumber: {
    fontFamily: "NunitoExtraBold",
    fontSize: 96,
    lineHeight: 100,
  },
  fireEmoji: {
    fontSize: 40,
    marginTop: 10,
  },
  daysWord: {
    fontFamily: "NunitoBold",
    fontSize: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  bottomBlock: {
    gap: 10,
  },
  habitChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  habitChipText: {
    fontFamily: "NunitoBold",
    fontSize: 14,
    flex: 1,
  },
  habitChipMeta: {
    fontFamily: "NunitoMedium",
    fontSize: 12,
  },
  goalMeta: {
    fontFamily: "NunitoMedium",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

export default GoalCompletedModal;
