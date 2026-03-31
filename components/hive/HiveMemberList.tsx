import React from "react";
import { View, Text, Image } from "react-native";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

interface HiveMember {
  _id: string;
  fullname: string;
  username?: string;
  profile_url: string | null;
  streak: number;
  completedToday: boolean;
}

interface HiveMemberListProps {
  members: HiveMember[];
}

const HiveMemberList: React.FC<HiveMemberListProps> = ({ members }) => {
  const { theme } = useTheme();

  // Sort: completed first, then by streak descending
  const sorted = [...members].sort((a, b) => {
    if (a.completedToday !== b.completedToday)
      return a.completedToday ? -1 : 1;
    return b.streak - a.streak;
  });

  return (
    <View style={{ gap: 10, marginTop: 10 }}>
      <Text
        style={{
          fontFamily: "NunitoBold",
          fontSize: 16,
          color: Colors[theme].text,
          marginBottom: 5,
        }}
      >
        Members
      </Text>
      {sorted.map((member, idx) => (
        <View
          key={member._id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: Colors[theme].surface,
            padding: 14,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: Colors[theme].border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
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
                    ? Colors[theme].success
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
                    ? Colors[theme].success
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

          {/* Right side: streak + status */}
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Image
                source={require("../../assets/icons/fire.png")}
                style={{ width: 14, height: 14 }}
              />
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 14,
                  color: Colors[theme].accent1,
                }}
              >
                {member.streak}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: member.completedToday
                  ? Colors[theme].success + "20"
                  : Colors[theme].danger + "15",
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 10,
                  color: member.completedToday
                    ? Colors[theme].success
                    : Colors[theme].danger,
                }}
              >
                {member.completedToday ? "Done ✓" : "Pending"}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default HiveMemberList;
