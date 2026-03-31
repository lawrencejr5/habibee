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

const HEX_SIZE = 52;
const HEX_GAP = 6;
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = HEX_SIZE * Math.sqrt(3);
const COL_STEP = HEX_WIDTH * 0.75 + HEX_GAP;
const ROW_STEP = HEX_HEIGHT + HEX_GAP;

const HiveHexagonGrid: React.FC<HiveHexagonGridProps> = ({ members }) => {
  const { theme } = useTheme();

  // Build honeycomb layout: odd columns offset down by half a row
  const positions = members.map((_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = col * COL_STEP;
    const y = row * ROW_STEP + (col % 2 === 1 ? ROW_STEP / 2 : 0);
    return { x, y };
  });

  const maxY = positions.length > 0
    ? Math.max(...positions.map((p) => p.y)) + HEX_HEIGHT
    : HEX_HEIGHT;

  const maxX = positions.length > 0
    ? Math.max(...positions.map((p) => p.x)) + HEX_WIDTH
    : HEX_WIDTH;

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
          const bgColor = completed ? Colors[theme].primary : Colors[theme].surface;
          const borderColor = completed ? Colors[theme].primary : Colors[theme].border;
          const initial = member.fullname?.charAt(0)?.toUpperCase() ?? "?";

          return (
            <View
              key={member._id}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: HEX_WIDTH,
                height: HEX_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Hexagon shape via CSS clip-path isn't available in RN,
                  so we use a rotated-square approach with overflow hidden */}
              <View
                style={{
                  width: HEX_SIZE * 1.6,
                  height: HEX_SIZE * 1.6,
                  borderRadius: HEX_SIZE * 0.32,
                  backgroundColor: bgColor,
                  borderWidth: 2.5,
                  borderColor,
                  transform: [{ rotate: "45deg" }],
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                  // Glow for completed
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
                  }}
                >
                  {member.profile_url ? (
                    <Image
                      source={{ uri: member.profile_url }}
                      style={{
                        width: HEX_SIZE * 0.9,
                        height: HEX_SIZE * 0.9,
                        borderRadius: HEX_SIZE * 0.45,
                      }}
                    />
                  ) : (
                    <Text
                      style={{
                        fontFamily: "NunitoExtraBold",
                        fontSize: HEX_SIZE * 0.4,
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
                  fontSize: 10,
                  color: Colors[theme].text_secondary,
                  marginTop: 4,
                  textAlign: "center",
                  maxWidth: HEX_WIDTH,
                }}
              >
                {member.fullname?.split(" ")[0]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default HiveHexagonGrid;
