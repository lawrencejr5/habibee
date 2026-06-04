import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 70;

export type AnalyticsData = {
  dailyCompletions: { date: string; count: number; total: number }[];
  completionRate: number;
  bestStreak: number;
  currentStreak: number;
  mostConsistentHabit: { name: string; streak: number } | null;
  totalCompletions: number;
  preferredTimeWindow: string | null;
  timeWindowBreakdown: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  habitBreakdown: { habit: string; completed: number; total: number }[];
};

const TIME_LABELS: Record<string, string> = {
  morning: "🌅 Morning",
  afternoon: "☀️ Afternoon",
  evening: "🌆 Evening",
  night: "🌙 Night",
};

const getTimeColors = (colors: typeof Colors.light): Record<string, string> => ({
  morning: colors.warning,
  afternoon: colors.primary,
  evening: colors.accent1 || colors.primary_variant,
  night: colors.blue || colors.primary,
});

// ─── Animated Bar ──────────────────────────────────────────────────────────────

const AnimatedBar: React.FC<{
  ratio: number;
  maxHeight: number;
  color: string;
  label: string;
  count: number;
  delay: number;
}> = ({ ratio, maxHeight, color, label, count, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();
  const colors = Colors[theme];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  const barHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });

  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        style={{
          fontFamily: "NunitoBold",
          fontSize: 10,
          color,
          marginBottom: 4,
          opacity: count > 0 ? 1 : 0,
        }}
      >
        {count}
      </Text>
      <View
        style={{
          height: maxHeight,
          justifyContent: "flex-end",
          width: "60%",
        }}
      >
        <Animated.View
          style={{
            height: barHeight,
            backgroundColor: color,
            borderRadius: 6,
            opacity: count > 0 ? 1 : 0.15,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: "NunitoBold",
          fontSize: 10,
          marginTop: 6,
          color: colors.text_secondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  emoji: string;
  label: string;
  value: string;
  accent: string;
  bg: string;
}> = ({ emoji, label, value, accent, bg }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 16,
        padding: 14,
        minWidth: 110,
        marginRight: 10,
        alignItems: "center",
        borderWidth: 3,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</Text>
      <Text
        style={{
          fontFamily: "NunitoExtraBold",
          fontSize: 22,
          color: accent,
          lineHeight: 26,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "NunitoRegular",
          fontSize: 11,
          color: colors.text_secondary,
          marginTop: 2,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ─── Time Window Bar ───────────────────────────────────────────────────────────

const TimeWindowBar: React.FC<{
  breakdown: AnalyticsData["timeWindowBreakdown"];
  preferred: string | null;
}> = ({ breakdown, preferred }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const timeColors = getTimeColors(colors);

  const total =
    breakdown.morning +
    breakdown.afternoon +
    breakdown.evening +
    breakdown.night;

  const windows = [
    { key: "morning", value: breakdown.morning },
    { key: "afternoon", value: breakdown.afternoon },
    { key: "evening", value: breakdown.evening },
    { key: "night", value: breakdown.night },
  ];

  return (
    <View style={{ marginTop: 4 }}>
      {/* Segmented bar */}
      <View
        style={{
          flexDirection: "row",
          height: 10,
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        {windows.map(({ key, value }) => {
          const flex = total > 0 ? value / total : 0.25;
          return (
            <View
              key={key}
              style={{
                flex,
                backgroundColor: timeColors[key],
                opacity: key === preferred ? 1 : 0.25,
              }}
            />
          );
        })}
      </View>
      {/* Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {windows.map(({ key, value }) => (
          <View
            key={key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor:
                key === preferred ? timeColors[key] + "20" : "transparent",
              borderWidth: key === preferred ? 1 : 0,
              borderColor: timeColors[key] + "60",
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: timeColors[key],
                opacity: key === preferred ? 1 : 0.4,
              }}
            />
            <Text
              style={{
                fontFamily: key === preferred ? "NunitoBold" : "NunitoRegular",
                fontSize: 11,
                color: key === preferred ? timeColors[key] : colors.text_secondary,
              }}
            >
              {TIME_LABELS[key]} {value > 0 ? `(${value})` : ""}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Mini Habit Progress Row ────────────────────────────────────────────────────

const HabitProgressRow: React.FC<{
  habit: string;
  completed: number;
  total: number;
  accent: string;
}> = ({ habit, completed, total, accent }) => {
  const ratio = total > 0 ? completed / total : 0;
  const anim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();
  const colors = Colors[theme];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: 700,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <Text
          style={{
            fontFamily: "NunitoBold",
            fontSize: 13,
            color: colors.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {habit}
        </Text>
        <Text
          style={{
            fontFamily: "NunitoExtraBold",
            fontSize: 13,
            color: accent,
            marginLeft: 8,
          }}
        >
          {completed}/{total}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: colors.background,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: ratio >= 0.7 ? colors.success : ratio >= 0.4 ? accent : colors.danger,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
};

// ─── Main AnalysisCard ─────────────────────────────────────────────────────────

const AnalysisCard: React.FC<{ data: AnalyticsData }> = ({ data }) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const accent = colors.primary;
  const cardBg = colors.surface;
  const sectionBg = colors.card;
  const textColor = colors.text;
  const textSecondaryColor = colors.text_secondary;
  const timeColors = getTimeColors(colors);

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const BAR_HEIGHT = 80;
  const maxCount = Math.max(...data.dailyCompletions.map((d) => d.count), 1);

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 20,
        padding: 16,
        marginVertical: 10,
        width: CARD_WIDTH,
        borderWidth: 3,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 18 }}>📊</Text>
        <Text
          style={{
            fontFamily: "NunitoExtraBold",
            fontSize: 16,
            color: textColor,
          }}
        >
          7-Day Progress Report
        </Text>
      </View>

      {/* ── Bar Chart ── */}
      <View
        style={{
          backgroundColor: sectionBg,
          borderRadius: 14,
          padding: 12,
          marginBottom: 14,
          borderWidth: 3,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: "NunitoBold",
            fontSize: 12,
            color: textSecondaryColor,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Daily Completions
        </Text>
        <View style={{ flexDirection: "row", height: BAR_HEIGHT + 40 }}>
          {data.dailyCompletions.map((day, i) => {
            const d = new Date(day.date + "T12:00:00");
            const label = DAY_LABELS[d.getDay()];
            const ratio = day.count / maxCount;
            return (
              <AnimatedBar
                key={day.date}
                ratio={ratio}
                maxHeight={BAR_HEIGHT}
                color={accent}
                label={label}
                count={day.count}
                delay={i * 60}
              />
            );
          })}
        </View>
      </View>

      {/* ── Stat Cards ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 14 }}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        <StatCard
          emoji="🎯"
          label="Completion Rate"
          value={`${data.completionRate}%`}
          accent={data.completionRate >= 70 ? colors.success : data.completionRate >= 40 ? accent : colors.danger}
          bg={sectionBg}
        />
        <StatCard
          emoji="🔥"
          label="Current Streak"
          value={`${data.currentStreak}d`}
          accent={accent}
          bg={sectionBg}
        />
        <StatCard
          emoji="🏆"
          label="Best Streak"
          value={`${data.bestStreak}d`}
          accent={colors.warning}
          bg={sectionBg}
        />
        <StatCard
          emoji="✅"
          label="Total (7 days)"
          value={`${data.totalCompletions}`}
          accent={colors.success}
          bg={sectionBg}
        />
      </ScrollView>

      {/* ── Most Consistent Habit ── */}
      {data.mostConsistentHabit && (
        <View
          style={{
            backgroundColor: sectionBg,
            borderRadius: 14,
            padding: 12,
            marginBottom: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderWidth: 3,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 20 }}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 11,
                color: textSecondaryColor,
              }}
            >
              Most Consistent Habit
            </Text>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 14,
                color: textColor,
              }}
              numberOfLines={1}
            >
              {data.mostConsistentHabit.name}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 16,
              color: colors.success,
            }}
          >
            {data.mostConsistentHabit.streak}🔥
          </Text>
        </View>
      )}

      {/* ── Preferred Time Window ── */}
      <View
        style={{
          backgroundColor: sectionBg,
          borderRadius: 14,
          padding: 12,
          marginBottom: 14,
          borderWidth: 3,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: "NunitoBold",
            fontSize: 12,
            color: textSecondaryColor,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Preferred Completion Time
        </Text>
        {data.preferredTimeWindow ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 16 }}>
              {TIME_LABELS[data.preferredTimeWindow]?.split(" ")[0]}
            </Text>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 14,
                color: timeColors[data.preferredTimeWindow],
              }}
            >
              You're a{" "}
              {data.preferredTimeWindow.charAt(0).toUpperCase() +
                data.preferredTimeWindow.slice(1)}{" "}
              Person!
            </Text>
          </View>
        ) : (
          <Text
            style={{ fontFamily: "NunitoRegular", fontSize: 13, color: textSecondaryColor }}
          >
            No completions yet this week
          </Text>
        )}
        <TimeWindowBar
          breakdown={data.timeWindowBreakdown}
          preferred={data.preferredTimeWindow}
        />
      </View>

      {/* ── Per-Habit Breakdown ── */}
      {data.habitBreakdown.length > 0 && (
        <View
          style={{
            backgroundColor: sectionBg,
            borderRadius: 14,
            padding: 12,
            borderWidth: 3,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: "NunitoBold",
              fontSize: 12,
              color: textSecondaryColor,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Habit Breakdown
          </Text>
          {data.habitBreakdown.map((item) => (
            <HabitProgressRow
              key={item.habit}
              habit={item.habit}
              completed={item.completed}
              total={item.total}
              accent={accent}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default AnalysisCard;
