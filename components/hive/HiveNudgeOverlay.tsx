import React, { FC, useRef, useState, useEffect } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHapitcs } from "@/context/HapticsContext";
import HiveHexagonGrid from "./HiveHexagonGrid";
import { useCustomAlert } from "@/context/AlertContext";

const { width } = Dimensions.get("window");

interface HiveNudgeOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const HiveNudgeOverlay: FC<HiveNudgeOverlayProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const today = new Date().toISOString().split("T")[0];
  const hives = useQuery(api.hive.get_my_hives_with_members, { today });

  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nudgedUsers, setNudgedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && hives !== undefined && hives.length === 0) {
      onClose();
    }
  }, [visible, hives, onClose]);

  if (!visible || (hives !== undefined && hives.length === 0)) return null;

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNudge = (username: string | undefined) => {
    if (!username || nudgedUsers.has(username)) return;

    haptics.impact("medium");
    setNudgedUsers((prev) => new Set(prev).add(username));
    showCustomAlert(`Nudged ${username}!`, "success");
  };

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
          { backgroundColor: Colors[theme].background + "E6" }, // 90% opacity
        ]}
      >
        {/* Header Options */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={[styles.title, { color: Colors[theme].text }]}>
            Habit Completed! 🚀
          </Text>
          <Pressable
            onPress={() => {
              haptics.impact("light");
              onClose();
            }}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color={Colors[theme].text} />
          </Pressable>
        </View>

        <Text
          style={{
            fontFamily: "NunitoMedium",
            fontSize: 16,
            color: Colors[theme].text_secondary,
            textAlign: "center",
            marginTop: 10,
            paddingHorizontal: 20,
          }}
        >
          You're on fire today! See who needs a nudge in your hives.
        </Text>

        {hives === undefined ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors[theme].primary} />
          </View>
        ) : (
          <View style={{ flex: 1, marginTop: 20 }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
            >
              {hives?.map((hive) => {
                const members = hive?.members || [];
                // Sort so incomplete runs are at the top
                const sortedMembers = [...members].sort(
                  (a, b) =>
                    Number(a?.completedToday) - Number(b?.completedToday),
                );

                return (
                  <View key={hive?._id} style={{ width }}>
                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: Colors[theme].surface,
                          borderColor: Colors[theme].border,
                        },
                      ]}
                    >
                      <View style={styles.hiveHeader}>
                        <Text
                          style={[
                            styles.hiveName,
                            { color: Colors[theme].text },
                          ]}
                        >
                          {hive?.name}
                        </Text>
                        <View style={styles.streakBadge}>
                          <Image
                            source={require("@/assets/icons/fire.png")}
                            style={{ width: 16, height: 16 }}
                          />
                          <Text
                            style={[
                              styles.streakText,
                              { color: Colors[theme].text },
                            ]}
                          >
                            {hive?.streak || 0}
                          </Text>
                        </View>
                      </View>

                      {/* Hexagon Layout */}
                      <View
                        style={{
                          transform: [{ scale: 0.85 }],
                          marginVertical: -10,
                        }}
                      >
                        <HiveHexagonGrid members={members as any} />
                      </View>

                      {/* Member List for Nudging */}
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: Colors[theme].text },
                        ]}
                      >
                        Nudge Members
                      </Text>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 1 }}
                      >
                        {sortedMembers.map((member) => (
                          <View
                            key={member?._id}
                            style={[
                              styles.memberItem,
                              { borderBottomColor: Colors[theme].border },
                            ]}
                          >
                            <View style={styles.memberInfo}>
                              {member?.profile_url ? (
                                <Image
                                  source={{ uri: member?.profile_url }}
                                  style={styles.avatar}
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.avatarPlaceholder,
                                    { backgroundColor: Colors[theme].border },
                                  ]}
                                >
                                  <Text
                                    style={{
                                      fontFamily: "NunitoBold",
                                      color: Colors[theme].text,
                                    }}
                                  >
                                    {member?.fullname?.charAt(0) || "?"}
                                  </Text>
                                </View>
                              )}
                              <View>
                                <Text
                                  style={{
                                    fontFamily: "NunitoBold",
                                    fontSize: 16,
                                    color: Colors[theme].text,
                                  }}
                                >
                                  {member?.username}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: "NunitoMedium",
                                    fontSize: 12,
                                    color: member?.completedToday
                                      ? Colors[theme].primary
                                      : Colors[theme].text_secondary,
                                  }}
                                >
                                  {member?.completedToday
                                    ? "Completed today"
                                    : "Yet to complete"}
                                </Text>
                              </View>
                            </View>

                            {!member?.completedToday && (
                              <Pressable
                                onPress={() => handleNudge(member?.username)}
                                disabled={nudgedUsers.has(
                                  member?.username as string,
                                )}
                                style={[
                                  styles.nudgeBtn,
                                  {
                                    backgroundColor: nudgedUsers.has(
                                      member?.username as string,
                                    )
                                      ? Colors[theme].border
                                      : Colors[theme].primary + "20",
                                    borderColor: nudgedUsers.has(
                                      member?.username as string,
                                    )
                                      ? Colors[theme].border
                                      : Colors[theme].primary,
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    fontFamily: "NunitoBold",
                                    fontSize: 13,
                                    color: nudgedUsers.has(
                                      member?.username as string,
                                    )
                                      ? Colors[theme].text_secondary
                                      : Colors[theme].primary,
                                  }}
                                >
                                  {nudgedUsers.has(member?.username as string)
                                    ? "Nudged"
                                    : "Nudge 👋"}
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Pagination Dots */}
            {hives && hives.length > 1 && (
              <View style={styles.pagination}>
                {hives.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === currentIndex
                            ? Colors[theme].primary
                            : Colors[theme].border,
                        width: i === currentIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            )}

            <Pressable
              onPress={onClose}
              style={[
                styles.continueBtn,
                {
                  backgroundColor: Colors[theme].primary,
                  marginBottom: insets.bottom + 20,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 16,
                  color: "#fff",
                }}
              >
                Awesome!
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: "NunitoExtraBold",
    fontSize: 26,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 25,
    borderWidth: 2,
    padding: 20,
    paddingBottom: 0,
    overflow: "hidden",
  },
  hiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hiveName: {
    fontFamily: "NunitoExtraBold",
    fontSize: 22,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(100,100,100,0.2)",
  },
  streakText: {
    fontFamily: "NunitoBold",
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: "NunitoExtraBold",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 15,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginVertical: 15,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  continueBtn: {
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
  },
});

export default HiveNudgeOverlay;
