import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlanTaskItemProps {
  title: string;
  time?: string;
  completed: boolean;
  onToggle: () => Promise<void> | void;
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
  const [isLoading, setIsLoading] = useState(false);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200, mass: 0.5 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200, mass: 0.5 });
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <AnimatedPressable
      onPress={async () => {
        haptics.impact();
        setIsLoading(true);
        try {
          await onToggle();
        } finally {
          setIsLoading(false);
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isLoading}
      style={[
        styles.container,
        animatedStyle,
      ]}
    >
      <View style={styles.checkboxArea}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Colors[theme].primary} />
          </View>
        ) : (
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
            {completed && (
              <Image
                source={require("../../assets/icons/check-fill.png")}
                style={styles.checkIcon}
              />
            )}
          </View>
        )}
      </View>

      <View style={[styles.content, { opacity: completed ? 0.45 : 1 }]}>
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
      </View>

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
    </AnimatedPressable>
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
    backgroundColor: "transparent",
  },
  checkboxArea: {
    marginRight: 14,
  },
  loaderContainer: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    width: 14,
    height: 14,
    tintColor: "#fff",
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
