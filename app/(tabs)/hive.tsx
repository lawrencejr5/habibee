import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";

import { View as ThemedView } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Feather } from "@expo/vector-icons";
import { useCustomAlert } from "@/context/AlertContext";

import CreateHiveModal from "@/components/hive/CreateHiveModal";
import JoinHiveModal from "@/components/hive/JoinHiveModal";
import HiveHexagonGrid from "@/components/hive/HiveHexagonGrid";
import HiveMemberList from "@/components/hive/HiveMemberList";

export default function HivePage() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedHiveId, setSelectedHiveId] = useState<Id<"hives"> | null>(
    null,
  );
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Queries
  const myHives = useQuery(api.hive.get_my_hives);
  const hiveMembers = useQuery(
    api.hive.get_hive_members,
    selectedHiveId ? { hiveId: selectedHiveId, today } : "skip",
  );

  const leaveHive = useMutation(api.hive.leave_hive);

  // Auto-select first hive if none selected
  React.useEffect(() => {
    if (myHives && myHives.length > 0 && !selectedHiveId) {
      setSelectedHiveId(myHives[0]!._id as Id<"hives">);
    }
    // If selected hive was removed, reset
    if (myHives && selectedHiveId) {
      const still = myHives.find((h: any) => h._id === selectedHiveId);
      if (!still && myHives.length > 0) {
        setSelectedHiveId(myHives[0]!._id as Id<"hives">);
      } else if (!still) {
        setSelectedHiveId(null);
      }
    }
  }, [myHives]);

  const selectedHive = myHives?.find((h: any) => h._id === selectedHiveId);

  const handleLeave = async () => {
    if (!selectedHiveId) return;
    try {
      await leaveHive({ hiveId: selectedHiveId });
      showCustomAlert("Left the hive", "success");
      setSelectedHiveId(null);
      setShowLeaveConfirm(false);
    } catch (err: any) {
      showCustomAlert(err.message || "Failed to leave", "danger");
    }
  };

  const isLoading = myHives === undefined;
  const hasHives = myHives && myHives.length > 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={[styles.title, { color: Colors[theme].text }]}>
          Habibee hive
        </Text>
        <Text
          style={{
            fontFamily: "NunitoRegular",
            fontSize: 14,
            color: Colors[theme].text_secondary,
            marginTop: 5,
          }}
        >
          Stay accountable with your circle
        </Text>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color={Colors[theme].primary} size="large" />
        </View>
      ) : !hasHives ? (
        // ── Empty State ──
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <View
            style={{
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
              borderWidth: 3,
              borderRadius: 24,
              padding: 20,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Image
              source={require("../../assets/icons/hive.png")}
              style={{
                width: 80,
                height: 80,
                marginBottom: 20,
                tintColor: Colors[theme].primary,
              }}
            />
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 22,
                color: Colors[theme].text,
                marginBottom: 8,
              }}
            >
              No Hives Yet
            </Text>
            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 14,
                color: Colors[theme].text_secondary,
                textAlign: "center",
                marginBottom: 30,
                lineHeight: 20,
              }}
            >
              Create a hive and invite friends, or join an existing one with a
              code.
            </Text>

            <Pressable
              onPress={() => {
                haptics.impact();
                setCreateModalVisible(true);
              }}
              style={{
                backgroundColor: Colors[theme].primary,
                paddingVertical: 14,
                paddingHorizontal: 30,
                borderRadius: 50,
                width: "100%",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 15,
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                Create a Hive
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.impact();
                setJoinModalVisible(true);
              }}
              style={{
                backgroundColor: Colors[theme].surface,
                paddingVertical: 14,
                paddingHorizontal: 30,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: Colors[theme].primary,
                width: "100%",
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 15,
                  color: Colors[theme].primary,
                  textAlign: "center",
                }}
              >
                Join a Hive
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // ── Hive Content ──
        <>
          {/* Hive selector pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 10,
              marginBottom: 15,
            }}
          >
            {myHives!.map((hive: any) => {
              const isSelected = hive._id === selectedHiveId;
              return (
                <Pressable
                  key={hive._id}
                  onPress={() => {
                    haptics.impact("light");
                    setSelectedHiveId(hive._id);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 50,
                    backgroundColor: isSelected
                      ? Colors[theme].primary
                      : Colors[theme].surface,
                    borderWidth: 2,
                    borderColor: isSelected
                      ? Colors[theme].primary
                      : Colors[theme].border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "NunitoBold",
                      fontSize: 14,
                      color: isSelected ? "#fff" : Colors[theme].text,
                    }}
                  >
                    {hive.name}
                  </Text>
                </Pressable>
              );
            })}

            {/* + Create / Join small buttons */}
            <Pressable
              onPress={() => {
                haptics.impact("light");
                setCreateModalVisible(true);
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 50,
                backgroundColor: Colors[theme].surface,
                borderWidth: 2,
                borderColor: Colors[theme].border,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Feather name="plus" size={16} color={Colors[theme].primary} />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 13,
                  color: Colors[theme].primary,
                }}
              >
                Create
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.impact("light");
                setJoinModalVisible(true);
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 50,
                backgroundColor: Colors[theme].surface,
                borderWidth: 2,
                borderColor: Colors[theme].border,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Feather
                name="log-in"
                size={16}
                color={Colors[theme].text_secondary}
              />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 13,
                  color: Colors[theme].text_secondary,
                }}
              >
                Join
              </Text>
            </Pressable>
          </ScrollView>

          {/* Selected hive content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 80,
            }}
          >
            {selectedHive && (
              <>
                {/* Hive info card */}
                <View
                  style={{
                    backgroundColor: Colors[theme].surface,
                    borderRadius: 18,
                    padding: 18,
                    borderWidth: 2,
                    borderColor: Colors[theme].border,
                    marginBottom: 15,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "NunitoExtraBold",
                          fontSize: 20,
                          color: Colors[theme].text,
                        }}
                      >
                        {selectedHive.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "NunitoMedium",
                            fontSize: 13,
                            color: Colors[theme].text_secondary,
                          }}
                        >
                          Code:
                        </Text>
                        <View
                          style={{
                            backgroundColor: Colors[theme].primary + "15",
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "NunitoExtraBold",
                              fontSize: 13,
                              color: Colors[theme].primary,
                              letterSpacing: 2,
                            }}
                          >
                            {selectedHive.code}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: "NunitoMedium",
                            fontSize: 12,
                            color: Colors[theme].text_secondary,
                          }}
                        >
                          · {selectedHive.memberCount} member
                          {selectedHive.memberCount !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>

                    {/* Leave button */}
                    <Pressable
                      onPress={() => {
                        haptics.impact("light");
                        if (showLeaveConfirm) {
                          handleLeave();
                        } else {
                          setShowLeaveConfirm(true);
                          setTimeout(() => setShowLeaveConfirm(false), 3000);
                        }
                      }}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: showLeaveConfirm
                          ? Colors[theme].danger + "20"
                          : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "NunitoBold",
                          fontSize: 12,
                          color: Colors[theme].danger,
                        }}
                      >
                        {showLeaveConfirm ? "Confirm?" : "Leave"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Hexagon grid */}
                {hiveMembers === undefined ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator color={Colors[theme].primary} />
                  </View>
                ) : hiveMembers.length > 0 ? (
                  <>
                    <HiveHexagonGrid members={hiveMembers as any} />
                    <HiveMemberList members={hiveMembers as any} />
                  </>
                ) : (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <Text
                      style={{
                        fontFamily: "NunitoMedium",
                        fontSize: 14,
                        color: Colors[theme].text_secondary,
                      }}
                    >
                      No members yet
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </>
      )}

      {/* Modals */}
      <CreateHiveModal
        visible={createModalVisible}
        setVisible={setCreateModalVisible}
      />
      <JoinHiveModal
        visible={joinModalVisible}
        setVisible={setJoinModalVisible}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: "NunitoExtraBold",
  },
});
