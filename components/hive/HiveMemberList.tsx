import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useHapitcs } from "@/context/HapticsContext";
import { useCustomAlert } from "@/context/AlertContext";
import { Id } from "@/convex/_generated/dataModel";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";

interface HiveMember {
  _id: string;
  fullname: string;
  username?: string;
  profile_url: string | null;
  streak: number;
  completedToday: boolean;
  isLeader?: boolean;
}

interface HiveMemberListProps {
  members: HiveMember[];
  isLeader?: boolean;
  hiveId?: Id<"hives">;
}

const HiveMemberList: React.FC<HiveMemberListProps> = ({
  members,
  isLeader,
  hiveId,
}) => {
  const { theme } = useTheme();
  const { signedIn } = useUser();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();
  const removeMember = useMutation(api.hive.remove_member);

  const [memberToRemove, setMemberToRemove] = useState<HiveMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemovePress = (member: HiveMember) => {
    haptics.impact("medium");
    setMemberToRemove(member);
  };

  const confirmRemove = async () => {
    if (!memberToRemove || !hiveId) return;
    setIsRemoving(true);
    haptics.impact("medium");
    try {
      await removeMember({ hiveId, userId: memberToRemove._id as Id<"users"> });
      showCustomAlert("Member removed successfully", "success");
      setMemberToRemove(null);
    } catch (err: any) {
      showCustomAlert(err.message || "Failed to remove member", "danger");
    } finally {
      setIsRemoving(false);
    }
  };

  // Sort: completed first, then by streak descending
  const sorted = [...members].sort((a, b) => {
    if (a.completedToday !== b.completedToday) return a.completedToday ? -1 : 1;
    return b.streak - a.streak;
  });

  return (
    <View style={{ gap: 5, marginTop: 10 }}>
      {sorted.map((member, idx) => {
        const isMe = signedIn && member._id === signedIn._id;
        const roleText = member.isLeader
          ? isMe
            ? "You · Leader"
            : "Leader"
          : isMe
            ? "You"
            : "Member";

        const hasRemoveButton = isLeader && !isMe;

        return (
          <View key={member._id} style={{ marginBottom: 5, width: "100%" }}>
            {/* Extension Tabs Row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: -2,
                zIndex: 10,
                width: "100%",
              }}
            >
              {/* Left Tab: Role */}
              <View
                style={{
                  backgroundColor: Colors[theme].surface,
                  borderWidth: 2,
                  borderColor: Colors[theme].border,
                  borderBottomWidth: 0,
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "NunitoBold",
                    color: Colors[theme].text_secondary,
                  }}
                >
                  {roleText}
                </Text>
              </View>

              {/* Right Tab: Remove Button */}
              {hasRemoveButton && (
                <Pressable
                  onPress={() => handleRemovePress(member)}
                  style={({ pressed }) => ({
                    backgroundColor: Colors[theme].surface,
                    borderWidth: 2,
                    borderColor: Colors[theme].border,
                    borderBottomWidth: 0,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "NunitoBold",
                      color: "#ef4444",
                    }}
                  >
                    Remove
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Member Card */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: Colors[theme].surface,
                padding: 14,
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                borderTopLeftRadius: 0,
                borderTopRightRadius: hasRemoveButton ? 0 : 14,
                borderWidth: 2,
                borderColor: Colors[theme].border,
                zIndex: 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                {/* Rank */}
                <Text
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 14,
                    color: Colors[theme].text_secondary,
                    width: 22,
                  }}
                >
                  {idx + 1}
                </Text>

                {/* Avatar */}
                {member.profile_url ? (
                  <Image
                    source={{ uri: member.profile_url }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: member.completedToday
                        ? Colors[theme].primary
                        : Colors[theme].border,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Colors[theme].primary + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: member.completedToday
                        ? Colors[theme].primary
                        : Colors[theme].border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "NunitoExtraBold",
                        fontSize: 16,
                        color: Colors[theme].primary,
                      }}
                    >
                      {member.fullname?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: "NunitoBold",
                      fontSize: 15,
                      color: Colors[theme].text,
                      textTransform: "capitalize",
                    }}
                  >
                    {member.fullname}
                  </Text>
                  {member.username && (
                    <Text
                      style={{
                        fontFamily: "NunitoRegular",
                        fontSize: 12,
                        color: Colors[theme].text_secondary,
                        marginTop: 1,
                      }}
                    >
                      @{member.username}
                    </Text>
                  )}
                </View>
              </View>

              {/* Right side: streak */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Image
                    key={member.completedToday ? "active" : "inactive"}
                    source={require("../../assets/icons/fire.png")}
                    style={{
                      width: 14,
                      height: 14,
                      tintColor: member.completedToday
                        ? undefined
                        : Colors[theme].text_secondary,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: "NunitoExtraBold",
                      fontSize: 14,
                      color: member.completedToday
                        ? Colors[theme].primary
                        : Colors[theme].text_secondary,
                    }}
                  >
                    {member.streak}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}

      {/* Custom Remove Confirmation Modal */}
      <Modal visible={!!memberToRemove} transparent animationType="fade">
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
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "#ef444415",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 15,
              }}
            >
              <Feather name="user-x" size={24} color="#ef4444" />
            </View>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 20,
                color: Colors[theme].text,
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Remove Member
            </Text>
            <Text
              style={{
                fontFamily: "NunitoMedium",
                fontSize: 14,
                color: Colors[theme].text_secondary,
                marginBottom: 20,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Are you sure you want to remove{" "}
              <Text
                style={{ fontFamily: "NunitoBold", color: Colors[theme].text }}
              >
                {memberToRemove?.fullname}
              </Text>{" "}
              from this hive?
            </Text>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <Pressable
                onPress={() => {
                  haptics.impact("light");
                  setMemberToRemove(null);
                }}
                disabled={isRemoving}
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
                onPress={confirmRemove}
                disabled={isRemoving}
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: "#ef4444",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isRemoving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={{
                      fontFamily: "NunitoBold",
                      color: "#fff",
                      fontSize: 16,
                    }}
                  >
                    Remove
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HiveMemberList;
