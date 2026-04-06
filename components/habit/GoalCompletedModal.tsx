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
import { useCustomAlert } from "@/context/AlertContext";
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

  const handleExtendGoal = async (extraDays: number) => {
    haptics.impact("medium");
    setExtendingGoal(true);
    try {
      const newGoal = habit.goal + extraDays;
      await update_habit({
        habit_id: habit._id,
        goal: newGoal,
      });
      showCustomAlert(
        `Goal extended to ${newGoal} days! Keep going! 🚀`,
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
          },
        ]}
      >
        <Pressable
          onPress={() => {
            haptics.impact("light");
            onClose();
          }}
          style={styles.closeButton}
        >
          <Feather name="x" size={24} color={Colors[theme].text} />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 30,
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

              {/* Sub Habits */}
              {subHabits && subHabits.length > 0 && (
                <View style={styles.subHabitsSection}>
                  <Text
                    style={[
                      styles.subHabitsTitle,
                      { color: Colors[theme].text },
                    ]}
                  >
                    Sub-Habits
                  </Text>
                  {subHabits.map((sh) => (
                    <View key={sh._id} style={styles.subHabitRow}>
                      <View
                        style={[
                          styles.subHabitCheck,
                          {
                            borderColor: sh.completed
                              ? themeColor
                              : Colors[theme].text_secondary,
                            backgroundColor: sh.completed
                              ? themeColor
                              : "transparent",
                          },
                        ]}
                      >
                        {sh.completed && (
                          <Feather name="check" size={10} color="#fff" />
                        )}
                      </View>
                      <Text
                        style={{
                          fontFamily: "NunitoMedium",
                          fontSize: 14,
                          color: Colors[theme].text,
                        }}
                      >
                        {sh.name}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
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
                    onPress={() => handleExtendGoal(days)}
                    disabled={extendingGoal}
                    style={[
                      styles.extensionPill,
                      {
                        backgroundColor: themeColor + "15",
                        borderColor: themeColor + "50",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.extensionPillText, { color: themeColor }]}
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
            onPress={handleShare}
            disabled={isSharing}
            style={[
              styles.actionBtn,
              {
                backgroundColor: themeColor,
                opacity: isSharing ? 0.6 : 1,
              },
            ]}
          >
            {isSharing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="share-2" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Share</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleDownload}
            disabled={isDownloading}
            style={[
              styles.actionBtn,
              {
                backgroundColor: Colors[theme].surface,
                borderWidth: 2,
                borderColor: themeColor,
                opacity: isDownloading ? 0.6 : 1,
              },
            ]}
          >
            {isDownloading ? (
              <ActivityIndicator color={themeColor} size="small" />
            ) : (
              <>
                <Feather name="download" size={18} color={themeColor} />
                <Text style={[styles.actionBtnText, { color: themeColor }]}>
                  Save
                </Text>
              </>
            )}
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
    </Modal>
  );
};

/* ─────────── Shareable 1:1 Card (captured as image) ─────────── */

const ShareableCard: FC<{
  habit: HabitType;
  themeColor: string;
  subHabits?: any[] | null;
}> = ({ habit, themeColor, subHabits }) => {
  const darkBg = "#1a1d21";
  const lightText = "#ffffff";
  const subtleText = "#9ca3af";

  return (
    <View style={[shareStyles.card, { backgroundColor: darkBg }]}>
      {/* Accent gradient stripe at top */}
      <View
        style={[shareStyles.accentStripe, { backgroundColor: themeColor }]}
      />

      {/* Logo */}
      <View style={shareStyles.logoRow}>
        <Image
          source={require("@/assets/images/icon-nobg-white.png")}
          style={shareStyles.logo}
        />
        <Text style={shareStyles.logoText}>habibee</Text>
      </View>

      {/* Main streak text */}
      <View style={shareStyles.mainContent}>
        <Text style={[shareStyles.streakLabel, { color: subtleText }]}>
          CURRENT STREAK
        </Text>
        <View style={shareStyles.streakRow}>
          <Text style={[shareStyles.streakNumber, { color: lightText }]}>
            {habit.current_streak + 1}
          </Text>
          <Text style={shareStyles.fireEmoji}>🔥</Text>
        </View>
        <Text style={[shareStyles.daysText, { color: themeColor }]}>
          DAY(S)
        </Text>
      </View>

      {/* Habit info */}
      <View
        style={[
          shareStyles.habitInfo,
          {
            backgroundColor: themeColor + "18",
            borderColor: themeColor + "35",
          },
        ]}
      >
        <View
          style={[
            shareStyles.habitIconCircle,
            { backgroundColor: themeColor + "30" },
          ]}
        >
          <Image
            source={habitIcons[habit.icon ?? "default"]}
            style={{
              width: 22,
              height: 22,
              tintColor: themeColor,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[shareStyles.habitName, { color: lightText }]}
            numberOfLines={1}
          >
            {habit.habit}
          </Text>
          <Text style={[shareStyles.habitMeta, { color: subtleText }]}>
            Goal: {habit.goal} days •{" "}
            {habit.duration ? `${habit.duration} min/day` : "Daily"}
          </Text>
        </View>
      </View>

      {/* Sub-habits if any */}
      {subHabits && subHabits.length > 0 && (
        <View style={shareStyles.subHabitsList}>
          {subHabits.slice(0, 4).map((sh, index) => (
            <View key={index} style={shareStyles.subHabitPill}>
              <Text style={[shareStyles.subHabitText, { color: subtleText }]}>
                ✓ {sh.name}
              </Text>
            </View>
          ))}
          {subHabits.length > 4 && (
            <Text style={[shareStyles.moreText, { color: subtleText }]}>
              +{subHabits.length - 4} more
            </Text>
          )}
        </View>
      )}

      {/* Motivational quote */}
      <Text style={[shareStyles.motivation, { color: subtleText }]}>
        "Consistency is the mother of mastery."
      </Text>

      {/* Bottom branding */}
      <View
        style={[
          shareStyles.bottomBranding,
          { borderTopColor: themeColor + "20" },
        ]}
      >
        <Text style={[shareStyles.brandingText, { color: subtleText }]}>
          Track your habits with
        </Text>
        <Text style={[shareStyles.brandingApp, { color: themeColor }]}>
          habibee
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
    height: 400,
    padding: 30,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  accentStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
  },
  logoText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 18,
    color: "#ffffff",
    letterSpacing: 1,
  },
  mainContent: {
    alignItems: "center",
    marginVertical: -5,
  },
  streakLabel: {
    fontFamily: "NunitoBold",
    fontSize: 11,
    letterSpacing: 3,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakNumber: {
    fontFamily: "NunitoExtraBold",
    fontSize: 72,
    lineHeight: 82,
  },
  fireEmoji: {
    fontSize: 36,
  },
  daysText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 20,
    letterSpacing: 6,
    marginTop: -5,
  },
  habitInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  habitIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  habitName: {
    fontFamily: "NunitoExtraBold",
    fontSize: 15,
  },
  habitMeta: {
    fontFamily: "NunitoMedium",
    fontSize: 11,
    marginTop: 2,
  },
  subHabitsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  subHabitPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  subHabitText: {
    fontFamily: "NunitoMedium",
    fontSize: 10,
  },
  moreText: {
    fontFamily: "NunitoMedium",
    fontSize: 10,
    alignSelf: "center",
  },
  motivation: {
    fontFamily: "NunitoRegular",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  bottomBranding: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  brandingText: {
    fontFamily: "NunitoMedium",
    fontSize: 12,
  },
  brandingApp: {
    fontFamily: "NunitoExtraBold",
    fontSize: 14,
  },
});

export default GoalCompletedModal;
