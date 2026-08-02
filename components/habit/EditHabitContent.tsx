/**
 * EditHabitContent
 * ─────────────────────────────────────────────────────────────────────────────
 * Platform-agnostic edit habit form. Shared between:
 *  - EditHabitModal.tsx (Android) — wrapped in BottomSheetModal
 *  - app/edit-habit-modal.tsx (iOS) — rendered inside a Stack.Screen
 */
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ToggleButton from "@/components/ToggleButton";
import IconColorPicker from "@/components/home/IconColorPicker";
import { habitIcons } from "@/data/habits";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCustomAlert } from "@/context/AlertContext";

export interface EditHabitContentProps {
  habitId: Id<"habits">;
  onClose: () => void;
}

const EditHabitContent: React.FC<EditHabitContentProps> = ({
  habitId,
  onClose,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const insets = useSafeAreaInsets();
  const { showCustomAlert } = useCustomAlert();

  // Fetch habit directly
  const habitsData = useQuery(api.habits.get_user_habits);
  const archivedHabits = useQuery(api.habits.get_archived_habits);
  const habit =
    habitsData?.find((h) => h._id === habitId) ||
    archivedHabits?.find((h) => h._id === habitId);

  const update_habit = useMutation(api.habits.update_habit);

  const [habitName, setHabitName] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [strict, setStrict] = useState<boolean>(false);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>("default");
  const [selectedColor, setSelectedColor] = useState<string>("#999");
  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  // Sync state from habit once loaded
  useEffect(() => {
    if (!habit) return;
    setHabitName(habit.habit);
    setDuration(habit.duration ? String(habit.duration) : "");
    setGoal(String(habit.goal));
    setStrict(habit.strict);
    setSelectedIcon(habit.icon ?? "default");
    setSelectedColor(habit.theme ?? "#999");
  }, [habit?._id]);

  const handle_submit = async () => {
    setBtnLoading(true);
    try {
      if (!habitName || !goal) {
        showCustomAlert("Fill in the details for this habit", "warning");
        return;
      }
      await update_habit({
        habit_id: habitId,
        habit: habitName,
        icon: selectedIcon,
        theme: selectedColor,
        duration: duration ? Number(duration) : null,
        goal: Number(goal),
        strict,
      });
      showCustomAlert("Habit updated successfully!", "success");
      onClose();
    } catch (err: any) {
      console.log(err);
      const errorMessage = err.message || "An error occurred";
      if (errorMessage.includes("habit with same name already exists")) {
        showCustomAlert("Habit with same name already exists", "danger");
      } else {
        showCustomAlert(errorMessage, "danger");
      }
    } finally {
      setBtnLoading(false);
    }
  };

  if (!habit) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={Colors[theme].primary} />
      </View>
    );
  }

  return (
    <Pressable
      style={{ flex: 1, paddingHorizontal: 20, paddingBottom: insets.bottom }}
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              color: Colors[theme].text,
              fontFamily: "NunitoExtraBold",
              fontSize: 26,
            }}
          >
            Edit habit
          </Text>
        </View>

        {/* Pick icon */}
        <Pressable
          onPress={() => {
            haptics.impact();
            setIconPickerVisible(true);
          }}
          style={{
            marginTop: 10,
            flexDirection: "row",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: selectedColor,
            backgroundColor: selectedColor + "20",
            alignSelf: "center",
            padding: 30,
            borderRadius: 999,
          }}
        >
          <Image
            source={
              habitIcons[selectedIcon] ||
              require("@/assets/icons/habit/emoji.png")
            }
            style={{
              width: 50,
              height: 50,
              tintColor: selectedColor || Colors[theme].text_secondary,
            }}
          />
          <Pressable
            onPress={() => setIconPickerVisible(true)}
            style={{
              position: "absolute",
              right: 4,
              bottom: 4,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: selectedColor,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather name="edit-2" size={14} color="#fff" />
          </Pressable>
        </Pressable>

        {/* Form */}
        <View style={{ marginTop: 30 }}>
          <View style={{ marginBottom: 0 }}>
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 16,
                color: Colors[theme].text_secondary,
              }}
            >
              Habit name
            </Text>
            <View
              style={[
                {
                  backgroundColor: Colors[theme].surface,
                  borderColor: Colors[theme].border,
                },
                styles.text_input_container,
              ]}
            >
              <Image
                source={require("@/assets/icons/fire.png")}
                style={{
                  width: 20,
                  height: 20,
                  tintColor: Colors[theme].text_secondary,
                  marginRight: 10,
                }}
              />
              <TextInput
                style={{
                  width: "90%",
                  fontFamily: "NunitoMedium",
                  paddingVertical: 10,
                  color: Colors[theme].text_secondary,
                }}
                placeholder="Habit"
                placeholderTextColor={Colors[theme].text_secondary}
                value={habitName}
                onChangeText={setHabitName}
              />
            </View>
          </View>

          {/* Duration & goal */}
          <View
            style={{
              marginBottom: 20,
              marginTop: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 16,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  Timer
                </Text>
                <Text
                  style={{
                    fontFamily: "NunitoMedium",
                    fontSize: 12,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  (optional)
                </Text>
              </View>
              <View
                style={[
                  {
                    backgroundColor: Colors[theme].surface,
                    borderColor: Colors[theme].border,
                  },
                  styles.text_input_container,
                ]}
              >
                <Image
                  source={require("@/assets/icons/clock.png")}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: Colors[theme].text_secondary,
                    marginRight: 10,
                  }}
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontFamily: "NunitoMedium",
                    paddingVertical: 10,
                    color: Colors[theme].text_secondary,
                  }}
                  placeholder="30"
                  placeholderTextColor={Colors[theme].text_secondary}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                />
                <Text
                  style={{
                    fontFamily: "NunitoMedium",
                    color: Colors[theme].text_secondary,
                  }}
                >
                  mins
                </Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 16,
                  color: Colors[theme].text_secondary,
                }}
              >
                Goal
              </Text>
              <View
                style={[
                  {
                    backgroundColor: Colors[theme].surface,
                    borderColor: Colors[theme].border,
                  },
                  styles.text_input_container,
                ]}
              >
                <Image
                  source={require("@/assets/icons/goal.png")}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: Colors[theme].text_secondary,
                    marginRight: 10,
                  }}
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontFamily: "NunitoMedium",
                    paddingVertical: 10,
                    color: Colors[theme].text_secondary,
                  }}
                  value={goal}
                  onChangeText={setGoal}
                  keyboardType="numeric"
                />
                <Text
                  style={{
                    fontFamily: "NunitoMedium",
                    color: Colors[theme].text_secondary,
                  }}
                >
                  days
                </Text>
              </View>
            </View>
          </View>

          {/* Toggle Button */}
          <View
            style={{
              marginTop: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: Colors[theme].text,
                fontFamily: "NunitoMedium",
                fontSize: 16,
              }}
            >
              Lock streak until timer ends
            </Text>
            <ToggleButton isOn={strict} onToggle={() => setStrict(!strict)} />
          </View>
        </View>
      </ScrollView>

      {/* Save button - Fixed at bottom */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginBottom: 30,
        }}
      >
        <Pressable
          onPress={() => {
            haptics.impact();
            onClose();
          }}
          style={{
            flex: 1,
            backgroundColor: Colors[theme].surface,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: Colors[theme].border,
            paddingVertical: 10,
          }}
        >
          <Text
            style={{
              fontFamily: "NunitoBold",
              fontSize: 16,
              color: Colors[theme].text,
              textAlign: "center",
            }}
          >
            Cancel
          </Text>
        </Pressable>

        <Pressable
          onPress={handle_submit}
          style={{
            flex: 1,
            backgroundColor: Colors[theme].primary,
            borderRadius: 50,
            paddingVertical: 10,
            opacity: btnLoading ? 0.5 : 1,
          }}
        >
          {btnLoading ? (
            <ActivityIndicator color={"#eee"} />
          ) : (
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 16,
                color: "#eee",
                textAlign: "center",
              }}
            >
              Save Changes
            </Text>
          )}
        </Pressable>
      </View>

      <IconColorPicker
        visible={iconPickerVisible}
        icons={Object.keys(habitIcons)}
        selectedColor={selectedColor}
        selectedIcon={selectedIcon}
        onClose={() => setIconPickerVisible(false)}
        onSelect={(icon, color) => {
          setSelectedIcon(icon);
          setSelectedColor(color);
        }}
      />
    </Pressable>
  );
};

export default EditHabitContent;

const styles = StyleSheet.create({
  text_input_container: {
    marginTop: 10,
    width: "100%",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 3,
    flexDirection: "row",
    alignItems: "center",
  },
});
