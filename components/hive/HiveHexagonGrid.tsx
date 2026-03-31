import React, { useEffect, useMemo } from "react";
import { View, Text, Image } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

// ─────── Types ───────

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

// ─────── Constants ───────

const COLS = 3;
const BASE_HEX_SIZE = 44;
const MIN_HEX_SIZE = 26;
const HEX_GAP = 10;
const GLOW_PAD = 12; // Extra canvas room so thick glow strokes aren't clipped

/**
 * Neon glow bands — drawn from outermost (thick, faint) to innermost
 * (thin, bright). The main polygon sits on top and covers the inward
 * half of each stroke, so only the outward bloom is visible.
 */
const GLOW_BANDS = [
  { strokeWidth: 16, opacity: 0.05 },
  { strokeWidth: 11, opacity: 0.1 },
  { strokeWidth: 7, opacity: 0.2 },
  { strokeWidth: 4, opacity: 0.45 },
];

function getHexSize(memberCount: number): number {
  const rows = Math.ceil(memberCount / COLS);
  if (rows <= 2) return BASE_HEX_SIZE;
  if (rows <= 3) return 38;
  if (rows <= 4) return 32;
  return Math.max(MIN_HEX_SIZE, BASE_HEX_SIZE - (rows - 2) * 5);
}

/** Pointy-top hexagon — 6 vertices, offset by `pad` inside the SVG canvas */
function getHexPoints(size: number, pad: number): string {
  const w = Math.sqrt(3) * size;
  const h = 2 * size;
  return [
    `${w / 2 + pad},${pad}`, // top
    `${w + pad},${h * 0.25 + pad}`, // top-right
    `${w + pad},${h * 0.75 + pad}`, // bottom-right
    `${w / 2 + pad},${h + pad}`, // bottom
    `${pad},${h * 0.75 + pad}`, // bottom-left
    `${pad},${h * 0.25 + pad}`, // top-left
  ].join(" ");
}

// ─────── Individual Hex Cell ───────

interface HexCellProps {
  member: HiveMember;
  hexSize: number;
  index: number;
}

const HexagonCell: React.FC<HexCellProps> = React.memo(
  ({ member, hexSize, index }) => {
    const { theme } = useTheme();
    const completed = member.completedToday;

    const hexW = Math.sqrt(3) * hexSize;
    const hexH = 2 * hexSize;
    const svgW = hexW + GLOW_PAD * 2;
    const svgH = hexH + GLOW_PAD * 2;

    const points = useMemo(() => getHexPoints(hexSize, GLOW_PAD), [hexSize]);

    // Deterministic stagger so hexagons don't breathe in sync
    const staggerDelay = useMemo(
      () => (index % 5) * 220 + ((index * 137) % 400),
      [index],
    );

    // ── Breathing animations ──
    const scale = useSharedValue(1);
    const glowIntensity = useSharedValue(completed ? 0.3 : 0.1);

    useEffect(() => {
      const targetScale = completed ? 1.05 : 1.02;
      const duration = completed ? 1300 : 1700;
      const peakGlow = completed ? 1.0 : 0.5;
      const baseGlow = completed ? 0.25 : 0.08;

      scale.value = withDelay(
        staggerDelay,
        withRepeat(
          withSequence(
            withTiming(targetScale, {
              duration,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, {
              duration,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          true,
        ),
      );

      glowIntensity.value = withDelay(
        staggerDelay,
        withRepeat(
          withSequence(
            withTiming(peakGlow, {
              duration,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(baseGlow, {
              duration,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          true,
        ),
      );
    }, [completed]);

    const scaleStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const glowOpacityStyle = useAnimatedStyle(() => ({
      opacity: glowIntensity.value,
    }));

    // ── Colours ──
    const glowColor = Colors[theme].primary; // orange neon
    const fillColor = completed
      ? Colors[theme].primary + "20" // subtle primary tint
      : Colors[theme].surface; // dark
    const mainStroke = completed ? Colors[theme].primary : Colors[theme].border;

    const initial = member.fullname?.charAt(0)?.toUpperCase() ?? "?";
    const avatarSize = hexSize * 0.82;

    return (
      <View style={{ alignItems: "center" }}>
        <Animated.View style={[{ width: svgW, height: svgH }, scaleStyle]}>
          {/* ── Glow layers (behind) — animated opacity ── */}
          <Animated.View
            style={[
              { position: "absolute", width: svgW, height: svgH },
              glowOpacityStyle,
            ]}
          >
            <Svg width={svgW} height={svgH}>
              {GLOW_BANDS.map((band, bi) => (
                <Polygon
                  key={bi}
                  points={points}
                  fill="transparent"
                  stroke={glowColor}
                  strokeWidth={band.strokeWidth}
                  strokeLinejoin="round"
                  opacity={band.opacity}
                />
              ))}
            </Svg>
          </Animated.View>

          {/* ── Main hexagon (on top — covers inward glow) ── */}
          <Svg width={svgW} height={svgH} style={{ position: "absolute" }}>
            <Polygon
              points={points}
              fill={fillColor}
              stroke={mainStroke}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </Svg>

          {/* ── Avatar / Initial centered overlay ── */}
          <View
            style={{
              position: "absolute",
              width: svgW,
              height: svgH,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {member.profile_url ? (
              <Image
                source={{ uri: member.profile_url }}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  borderWidth: 1.5,
                  borderColor: completed
                    ? "rgba(255,255,255,0.3)"
                    : Colors[theme].border,
                }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: hexSize * 0.38,
                  color: completed ? Colors[theme].primary : Colors[theme].text,
                }}
              >
                {initial}
              </Text>
            )}
          </View>
        </Animated.View>
      </View>
    );
  },
);

// ─────── Grid Container ───────

const HiveHexagonGrid: React.FC<HiveHexagonGridProps> = ({ members }) => {
  const { theme } = useTheme();

  const hexSize = getHexSize(members.length);
  const hexW = Math.sqrt(3) * hexSize;
  const hexH = 1 * hexSize;
  const svgW = hexW + GLOW_PAD * 2;
  const svgH = hexH + GLOW_PAD * 2;
  const nameHeight = 22;

  // Pointy-top honeycomb: odd rows shift right by half a column
  const colStep = hexW + HEX_GAP;
  const rowStep = hexSize * 1.5 + HEX_GAP;

  const positions = members.map((_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * colStep + (row % 2 === 1 ? colStep / 2 : 0);
    const y = row * rowStep;
    return { x, y };
  });

  const gridW =
    positions.length > 0 ? Math.max(...positions.map((p) => p.x)) + svgW : svgW;
  const gridH =
    positions.length > 0
      ? Math.max(...positions.map((p) => p.y)) + svgH + nameHeight
      : svgH + nameHeight;

  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 16,
        backgroundColor: Colors[theme].surface,
        borderWidth: 2,
        borderColor: Colors[theme].border,
        borderRadius: 15,
        marginBottom: 6,
      }}
    >
      <View style={{ width: gridW, height: gridH }}>
        {members.map((member, i) => {
          const { x, y } = positions[i];
          return (
            <View
              key={member._id}
              style={{
                position: "absolute",
                left: x,
                top: y,
              }}
            >
              <HexagonCell member={member} hexSize={hexSize} index={i} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default HiveHexagonGrid;
