import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";

interface PlanTaskItemProps {
  title: string;
  time?: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const PlanTaskItem: React.FC<PlanTaskItemProps> = ({
  title,
  time,
  completed,
  onToggle,
  onDelete,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const strikeAnim = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(strikeAnim, {
      toValue: completed ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [completed]);

  const handleToggle = () => {
    haptics.impact();
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    onToggle();
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };

  const textOpacity = strikeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.45],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: "transparent",
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable onPress={handleToggle} style={styles.checkboxArea}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: completed
                ? Colors[theme].primary
                : Colors[theme].text_secondary,
              backgroundColor: completed
                ? Colors[theme].primary
                : "transparent",
            },
          ]}
        >
          {completed && <Feather name="check" size={12} color="#fff" />}
        </View>
      </Pressable>

      <Animated.View style={[styles.content, { opacity: textOpacity }]}>
        <Text
          style={[
            styles.title,
            {
              color: Colors[theme].text,
              textDecorationLine: completed ? "line-through" : "none",
              textDecorationColor: Colors[theme].text_secondary,
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {time && (
          <View
            style={[styles.timeBadge, { backgroundColor: Colors[theme].card }]}
          >
            <Feather
              name="clock"
              size={11}
              color={Colors[theme].text_secondary}
            />
            <Text
              style={[styles.timeText, { color: Colors[theme].text_secondary }]}
            >
              {formatTime(time)}
            </Text>
          </View>
        )}
      </Animated.View>

      <Pressable
        onPress={() => {
          haptics.impact();
          onDelete();
        }}
        style={styles.deleteArea}
        hitSlop={8}
      >
        <Feather name="x" size={18} color={Colors[theme].text_secondary} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  checkboxArea: {
    marginRight: 14,
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: "NunitoSemiBold",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "NunitoRegular",
  },
  deleteArea: {
    marginLeft: 12,
    padding: 4,
  },
});

export default PlanTaskItem;
