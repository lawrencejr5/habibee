import React, { Dispatch, SetStateAction } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View as ThemedView } from "@/components/Themed";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CheckSubHabitModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habit_id: Id<"habits">;
  themeColor: string;
}

const CheckSubHabitModal: React.FC<CheckSubHabitModalProps> = ({
  visible,
  setVisible,
  habit_id,
  themeColor,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const subHabits = useQuery(api.sub_habits.get_sub_habits, {
    parent_habit_id: habit_id,
  });
  const toggle_sub_habit = useMutation(api.sub_habits.toggle_sub_habit);

  const close = () => {
    haptics.impact();
    setVisible(false);
  };

  const handleToggle = async (subHabitId: Id<"sub_habits">) => {
    haptics.impact();
    const today = new Date().toLocaleDateString("en-CA");
    const weekday = new Date().toLocaleDateString("en-US", {
      weekday: "short",
    });

    try {
      await toggle_sub_habit({
        sub_habit_id: subHabitId,
        current_date: today,
        week_day: weekday,
      });
    } catch (error) {
      console.error(error);
      showCustomAlert("Failed to update sub-habit", "danger");
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <ThemedView
          style={{
            flex: 1,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 30,
            marginTop: 100, // Leave some space at top
          }}
        >
          {/* Header with Close Button */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: Colors[theme].text,
                fontFamily: "NunitoExtraBold",
                fontSize: 24,
              }}
            >
              Sub-Habits
            </Text>
            <Pressable
              style={{
                backgroundColor: Colors[theme].surface,
                padding: 8,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: Colors[theme].border,
              }}
              onPress={close}
            >
              <Feather name="x" color={Colors[theme].text} size={22} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Progress Summary */}
            {subHabits && subHabits.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 14,
                    color: Colors[theme].text_secondary,
                    marginBottom: 5,
                  }}
                >
                  Progress
                </Text>
                <View
                  style={{
                    height: 8,
                    backgroundColor: Colors[theme].border,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(subHabits.filter((s) => s.completed).length / subHabits.length) * 100}%`,
                      backgroundColor: themeColor,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: "NunitoMedium",
                    fontSize: 12,
                    color: Colors[theme].text_secondary,
                    marginTop: 5,
                    textAlign: "right",
                  }}
                >
                  {subHabits.filter((s) => s.completed).length}/
                  {subHabits.length} completed
                </Text>
              </View>
            )}

            {/* List Section */}
            {subHabits && subHabits.length > 0 ? (
              <View
                style={{
                  backgroundColor: Colors[theme].surface,
                  borderRadius: 15,
                  borderWidth: 1,
                  borderColor: Colors[theme].border,
                  overflow: "hidden",
                }}
              >
                {subHabits.map((item, index) => (
                  <Pressable
                    key={item._id}
                    onPress={() => handleToggle(item._id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 15,
                      borderBottomWidth: index < subHabits.length - 1 ? 1 : 0,
                      borderBottomColor: Colors[theme].border,
                    }}
                  >
                    <Feather
                      name={item.completed ? "check-circle" : "circle"}
                      size={24}
                      color={
                        item.completed
                          ? themeColor
                          : Colors[theme].text_secondary
                      }
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: "NunitoMedium",
                        fontSize: 16,
                        color: item.completed
                          ? Colors[theme].text_secondary
                          : Colors[theme].text,
                        textDecorationLine: item.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 50,
                  opacity: 0.5,
                }}
              >
                <Feather
                  name="list"
                  size={40}
                  color={Colors[theme].text_secondary}
                />
                <Text
                  style={{
                    fontFamily: "NunitoMedium",
                    color: Colors[theme].text_secondary,
                    marginTop: 10,
                  }}
                >
                  No sub-habits found
                </Text>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={close}
            style={{
              width: "100%",
              backgroundColor: themeColor,
              paddingVertical: 15,
              borderRadius: 50,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 16,
                color: "#eee",
                textAlign: "center",
              }}
            >
              Close
            </Text>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default CheckSubHabitModal;

const styles = StyleSheet.create({});
