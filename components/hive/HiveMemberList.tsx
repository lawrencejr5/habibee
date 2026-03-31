import React from "react";
import { View, Text, Image } from "react-native";
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
}

const HiveMemberList: React.FC<HiveMemberListProps> = ({ members }) => {
  const { theme } = useTheme();
  const { signedIn } = useUser();

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

        return (
          <View key={member._id} style={{ marginBottom: 5, width: "100%" }}>
            {/* Extension Tab */}
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
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: -2,
                zIndex: 10,
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
                borderTopRightRadius: 14,
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
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Image
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
        );
      })}
    </View>
  );
};

export default HiveMemberList;
