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

interface HiveHexagonGridProps {
  members: HiveMember[];
}

const COLS = 4;
const BASE_HEX_SIZE = 52;
const MIN_HEX_SIZE = 28;
const HEX_GAP = 8;

function getHexSize(memberCount: number): number {
  const rows = Math.ceil(memberCount / COLS);
  if (rows <= 2) return BASE_HEX_SIZE;
  if (rows <= 3) return 44;
  if (rows <= 4) return 36;
  return Math.max(MIN_HEX_SIZE, BASE_HEX_SIZE - (rows - 2) * 6);
}

const HiveHexagonGrid: React.FC<HiveHexagonGridProps> = ({ members }) => {
  const { theme } = useTheme();

  const hexSize = getHexSize(members.length);
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * Math.sqrt(3);
  const colStep = hexWidth * 0.7 + HEX_GAP;
  const rowStep = hexHeight * 1.3 + HEX_GAP;

  // Build honeycomb layout: odd columns offset down by half a row
  const positions = members.map((_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * colStep;
    const y = row * rowStep + (col % 2 === 1 ? rowStep / 2 : 0);
    return { x, y };
  });

  const maxY =
    positions.length > 0
      ? Math.max(...positions.map((p) => p.y)) + hexHeight
      : hexHeight;

  const maxX =
    positions.length > 0
      ? Math.max(...positions.map((p) => p.x)) + hexWidth
      : hexWidth;

  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 20,
      }}
    >
      <View style={{ width: maxX, height: maxY }}>
        {members.map((member, i) => {
          const { x, y } = positions[i];
          const completed = member.completedToday;
          const bgColor = completed
            ? Colors[theme].primary
            : Colors[theme].surface;
          const borderColor = completed
            ? Colors[theme].primary
            : Colors[theme].border;
          const initial = member.fullname?.charAt(0)?.toUpperCase() ?? "?";

          return (
            <View
              key={member._id}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: hexWidth,
                height: hexHeight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Rotated-square hexagon shape */}
              <View
                style={{
                  width: hexSize * 1.6,
                  height: hexSize * 1.6,
                  borderRadius: hexSize * 0.32,
                  backgroundColor: bgColor,
                  borderWidth: 2.5,
                  borderColor,
                  transform: [{ rotate: "45deg" }],
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  ...(completed
                    ? {
                        shadowColor: Colors[theme].primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 8,
                      }
                    : {}),
                }}
              >
                <View
                  style={{
                    transform: [{ rotate: "-45deg" }],
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: Colors[theme].text_secondary,
                    borderRadius: hexSize * 0.45,
                    width: hexSize * 0.9,
                    height: hexSize * 0.9,
                  }}
                >
                  {member.profile_url ? (
                    <Image
                      source={{ uri: member.profile_url }}
                      style={{
                        width: hexSize * 0.9,
                        height: hexSize * 0.9,
                        borderRadius: hexSize * 0.45,
                      }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: "NunitoExtraBold",
                        fontSize: hexSize * 0.4,
                        color: completed ? "#fff" : Colors[theme].text,
                      }}
                    >
                      {initial}
                    </Text>
                  )}
                </View>
              </View>

              {/* Name label below */}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: Math.max(8, hexSize * 0.19),
                  color: Colors[theme].text_secondary,
                  marginTop: 8,
                  textAlign: "center",
                  maxWidth: hexWidth,
                  textTransform: "lowercase",
                }}
              >
                @{member.fullname?.split(" ")[0]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default HiveHexagonGrid;
