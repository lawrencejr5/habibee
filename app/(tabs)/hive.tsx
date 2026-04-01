import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  Modal,
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
import * as Clipboard from "expo-clipboard";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [copiedHiveCode, setCopiedHiveCode] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Queries
  const myHives = useQuery(api.hive.get_my_hives);
  const hiveMembers = useQuery(
    api.hive.get_hive_members,
    selectedHiveId ? { hiveId: selectedHiveId, today } : "skip",
  );

  const leaveHive = useMutation(api.hive.leave_hive);
  const deleteHive = useMutation(api.hive.delete_hive);
  const renameHive = useMutation(api.hive.rename_hive);

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

  const handleDeleteHive = async () => {
    if (!selectedHiveId) return;
    try {
      await deleteHive({ hiveId: selectedHiveId });
      showCustomAlert("Hive deleted", "success");
      setSelectedHiveId(null);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      showCustomAlert(err.message || "Failed to delete", "danger");
    }
  };

  const handleRenameHive = async () => {
    if (!selectedHiveId || !renameValue.trim()) return;
    try {
      await renameHive({ hiveId: selectedHiveId, name: renameValue });
      showCustomAlert("Hive renamed", "success");
      setShowRenameModal(false);
    } catch (err: any) {
      showCustomAlert(err.message || "Failed to rename", "danger");
    }
  };

  const handleCopyExistingCode = async (code: string) => {
    haptics.impact("light");
    await Clipboard.setStringAsync(code);
    setCopiedHiveCode(code);
    showCustomAlert("Code copied!", "success");
    setTimeout(() => setCopiedHiveCode(null), 2000);
  };

  const isLoading = myHives === undefined;
  const hasHives = myHives && myHives.length > 0;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {showSettings && (
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 10, backgroundColor: "transparent" },
          ]}
          onPress={() => setShowSettings(false)}
        />
      )}
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 11,
        }}
      >
        <View>
          <Text style={[styles.title, { color: Colors[theme].text }]}>
            Hive
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

        {selectedHive && (
          <View>
            <Pressable
              style={{ padding: 5 }}
              onPress={() => {
                haptics.impact();
                setShowSettings(!showSettings);
              }}
            >
              <Feather name="settings" size={24} color={Colors[theme].text} />
            </Pressable>

            {showSettings && (
              <View
                style={{
                  position: "absolute",
                  right: 0,
                  top: 35,
                  backgroundColor: Colors[theme].surface,
                  borderColor: Colors[theme].border,
                  borderWidth: 2,
                  paddingHorizontal: 15,
                  width: 170,
                  borderRadius: 12,
                  zIndex: 12,
                }}
              >
                {selectedHive.isLeader ? (
                  <>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: Colors[theme].border,
                      }}
                      onPress={() => {
                        haptics.impact();
                        setShowSettings(false);
                        setRenameValue(selectedHive.name);
                        setShowRenameModal(true);
                      }}
                    >
                      <Feather
                        name="edit-2"
                        size={18}
                        color={Colors[theme].text}
                      />
                      <Text
                        style={{
                          color: Colors[theme].text,
                          fontFamily: "NunitoMedium",
                          fontSize: 15,
                        }}
                      >
                        Rename
                      </Text>
                    </Pressable>
                    <Pressable
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingVertical: 12,
                      }}
                      onPress={() => {
                        haptics.impact("light");
                        if (showDeleteConfirm) {
                          setShowSettings(false);
                          handleDeleteHive();
                        } else {
                          setShowDeleteConfirm(true);
                          setTimeout(() => setShowDeleteConfirm(false), 3000);
                        }
                      }}
                    >
                      <Feather
                        name="trash-2"
                        size={18}
                        color={Colors[theme].danger}
                      />
                      <Text
                        style={{
                          color: Colors[theme].danger,
                          fontFamily: "NunitoMedium",
                          fontSize: 15,
                        }}
                      >
                        {showDeleteConfirm ? "Tap to Confirm" : "Delete Hive"}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingVertical: 12,
                    }}
                    onPress={() => {
                      haptics.impact("light");
                      if (showLeaveConfirm) {
                        setShowSettings(false);
                        handleLeave();
                      } else {
                        setShowLeaveConfirm(true);
                        setTimeout(() => setShowLeaveConfirm(false), 3000);
                      }
                    }}
                  >
                    <Feather
                      name="log-out"
                      size={18}
                      color={Colors[theme].danger}
                    />
                    <Text
                      style={{
                        color: Colors[theme].danger,
                        fontFamily: "NunitoMedium",
                        fontSize: 15,
                      }}
                    >
                      {showLeaveConfirm ? "Tap to Confirm" : "Leave Hive"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
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
              marginBottom: 50,
              height: 40,
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
                    paddingVertical: 0,
                    flexDirection: "row",
                    alignItems: "center",
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
                paddingVertical: 0,
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
                paddingVertical: 0,
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
                            fontSize: 12,
                            color: Colors[theme].text_secondary,
                          }}
                        >
                          Code:
                        </Text>
                        <Pressable
                          onPress={() =>
                            handleCopyExistingCode(selectedHive.code)
                          }
                          style={{
                            backgroundColor: Colors[theme].primary + "15",
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            borderRadius: 8,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
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
                          <Feather
                            name={
                              copiedHiveCode === selectedHive.code
                                ? "check"
                                : "copy"
                            }
                            size={12}
                            color={Colors[theme].primary}
                          />
                        </Pressable>
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

                    {/* Streak Display */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: Colors[theme].surface,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: Colors[theme].border,
                        shadowColor: Colors[theme].primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                    >
                      <Image
                        source={require("../../assets/icons/fire.png")}
                        style={{ width: 22, height: 22 }}
                      />
                      <Text
                        style={{
                          fontFamily: "NunitoExtraBold",
                          fontSize: 18,
                          color: Colors[theme].text,
                        }}
                      >
                        {selectedHive.streak || 0}
                      </Text>
                    </View>
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
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: Colors[theme].surface,
              width: "100%",
              borderRadius: 20,
              padding: 20,
              borderWidth: 2,
              borderColor: Colors[theme].border,
            }}
          >
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 20,
                color: Colors[theme].text,
                marginBottom: 15,
              }}
            >
              Rename Hive
            </Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Enter new hive name"
              placeholderTextColor={Colors[theme].text_secondary}
              style={{
                backgroundColor: Colors[theme].background,
                color: Colors[theme].text,
                fontFamily: "NunitoMedium",
                fontSize: 16,
                padding: 15,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors[theme].border,
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  haptics.impact();
                  setShowRenameModal(false);
                }}
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: Colors[theme].background,
                  borderWidth: 1,
                  borderColor: Colors[theme].border,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    color: Colors[theme].text,
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRenameHive}
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: Colors[theme].primary,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    color: "#fff",
                    fontSize: 16,
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
