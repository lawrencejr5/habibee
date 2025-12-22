import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // Highly recommended for notch handling
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { Image } from "react-native";

interface CustomAlertProps {
  visible: boolean;
  msg: string;
  theme: "success" | "danger" | "warning";
  onHide: () => void;
}

const CustomAlert = ({ visible, msg, theme, onHide }: CustomAlertProps) => {
  const insets = useSafeAreaInsets();
  const { theme: deviceTheme } = useTheme();

  // Initial position: Off-screen (Above the top edge)
  const translateY = useRef(new Animated.Value(-150)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // 1. Drop Down (Spring Animation)
      Animated.spring(translateY, {
        toValue: insets.top + 10, // Drop to just below the notch
        useNativeDriver: true,
        speed: 12, // Controls velocity
        bounciness: 8, // Controls "springiness"
      }).start();

      // 2. Auto-hide after 3 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hideAlert();
      }, 2000);
    } else {
      hideAlert();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const hideAlert = () => {
    Animated.timing(translateY, {
      toValue: -150, // Move back off-screen
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (visible) onHide(); // Sync state with parent
    });
  };

  // Select background color based on theme
  const getBackgroundColor = () => {
    switch (theme) {
      case "success":
        return Colors[deviceTheme].success;
      case "danger":
        return Colors[deviceTheme].danger;
      case "warning":
        return Colors[deviceTheme].warning;
      default:
        return Colors[deviceTheme].primary;
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "success":
        return require("@/assets/icons/check-fill.png");
      case "danger":
        return require("@/assets/icons/danger.png");
      case "warning":
        return require("@/assets/icons/warning.png");
      default:
        return require("@/assets/icons/check-fill.png");
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: Colors[deviceTheme].surface,
          borderColor: getBackgroundColor(),
          transform: [{ translateY }],
          // Ensure it sits above other content
          zIndex: 9999,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideAlert} // Allow user to dismiss early
        style={styles.contentContainer}
      >
        <Image
          source={getIcon()}
          style={{ width: 16, height: 16, tintColor: getBackgroundColor() }}
        />
        <Text
          style={[styles.messageText, { color: getBackgroundColor() }]}
          numberOfLines={2}
        >
          {msg}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    alignSelf: "center",
  },
  contentContainer: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)", // Semi-transparent white circle
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  messageText: {
    color: "#fff", // White text from your palette logic
    fontSize: 14,
    fontFamily: "NunitoBold",
  },
});

export default CustomAlert;
