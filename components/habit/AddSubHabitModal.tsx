import React, { Dispatch, SetStateAction, useState, useCallback } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

export interface SubHabitEntry {
  name: string;
  reminderTime?: string; // "HH:mm" 24h format, e.g. "09:00", "14:30"
}

interface AddSubHabitModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  subHabits: SubHabitEntry[];
  setSubHabits: Dispatch<SetStateAction<SubHabitEntry[]>>;
  themeColor: string;
}

/**
 * Format a 24h time string like "09:00" to "9:00 AM"
 */
export const formatTime12h = (time24: string): string => {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${ampm}`;
};

const AddSubHabitModal: React.FC<AddSubHabitModalProps> = ({
  visible,
  setVisible,
  subHabits,
  setSubHabits,
  themeColor,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const [newSubHabit, setNewSubHabit] = useState("");

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  const close = () => {
    haptics.impact();
    setVisible(false);
  };

  const handleAddSubHabit = () => {
    if (!newSubHabit.trim()) {
      return;
    }

    if (subHabits.some((sh) => sh.name === newSubHabit.trim())) {
      showCustomAlert("This sub-habit already exists", "warning");
      return;
    }

    haptics.impact();
    setSubHabits([...subHabits, { name: newSubHabit.trim() }]);
    setNewSubHabit("");
  };

  const handleRemoveSubHabit = (index: number) => {
    haptics.impact();
    setSubHabits(subHabits.filter((_, i) => i !== index));
  };

  const openTimePicker = (index: number) => {
    haptics.impact();
    setEditingIndex(index);

    // If there's already a reminder time set, use it as default
    const existing = subHabits[index].reminderTime;
    if (existing) {
      const [h, m] = existing.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      setPickerDate(d);
    } else {
      // Default to 9:00 AM
      const d = new Date();
      d.setHours(9, 0, 0, 0);
      setPickerDate(d);
    }

    setShowTimePicker(true);
  };

  const handleTimeChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowTimePicker(false);

      if (event.type === "set" && selectedDate && editingIndex !== null) {
        setPickerDate(selectedDate);

        const hours = String(selectedDate.getHours()).padStart(2, "0");
        const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
        const timeStr = `${hours}:${minutes}`;

        const updated = [...subHabits];
        updated[editingIndex] = {
          ...updated[editingIndex],
          reminderTime: timeStr,
        };
        setSubHabits(updated);
      }
    },
    [subHabits, editingIndex, setSubHabits],
  );

  const removeReminder = (index: number) => {
    haptics.impact();
    const updated = [...subHabits];
    updated[index] = { ...updated[index], reminderTime: undefined };
    setSubHabits(updated);
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
              Add Sub-Habits
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
            {/* Input Section */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 16,
                  color: Colors[theme].text_secondary,
                  marginBottom: 10,
                }}
              >
                New sub-habit
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                <View
                  style={[
                    styles.text_input_container,
                    {
                      backgroundColor: Colors[theme].surface,
                      borderColor: Colors[theme].border,
                      flex: 1,
                    },
                  ]}
                >
                  <Feather
                    name="check-square"
                    size={20}
                    color={Colors[theme].text_secondary}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      fontFamily: "NunitoMedium",
                      color: Colors[theme].text,
                    }}
                    placeholder="e.g. Drink glass of water"
                    placeholderTextColor={Colors[theme].text_secondary}
                    value={newSubHabit}
                    onChangeText={setNewSubHabit}
                    onSubmitEditing={handleAddSubHabit}
                  />
                </View>
                <Pressable
                  onPress={handleAddSubHabit}
                  style={{
                    backgroundColor: themeColor,
                    width: 50,
                    borderRadius: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Feather name="plus" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* List Section */}
            {subHabits.length > 0 ? (
              <View>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 16,
                    color: Colors[theme].text_secondary,
                    marginBottom: 10,
                  }}
                >
                  Added ({subHabits.length})
                </Text>
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
                    <View
                      key={index}
                      style={{
                        padding: 15,
                        borderBottomWidth: index < subHabits.length - 1 ? 1 : 0,
                        borderBottomColor: Colors[theme].border,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Feather
                          name="check-circle"
                          size={20}
                          color={themeColor}
                          style={{ marginRight: 12 }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: "NunitoMedium",
                            fontSize: 16,
                            color: Colors[theme].text,
                          }}
                        >
                          {item.name}
                        </Text>
                        <Pressable
                          onPress={() => handleRemoveSubHabit(index)}
                          style={{ padding: 5 }}
                        >
                          <Feather
                            name="trash-2"
                            size={20}
                            color={Colors[theme].text_secondary}
                          />
                        </Pressable>
                      </View>

                      {/* Reminder time row */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 8,
                          marginLeft: 32,
                        }}
                      >
                        <Pressable
                          onPress={() => openTimePicker(index)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: item.reminderTime
                              ? themeColor + "15"
                              : Colors[theme].background,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: item.reminderTime
                              ? themeColor + "40"
                              : Colors[theme].border,
                            gap: 6,
                          }}
                        >
                          <Feather
                            name="clock"
                            size={14}
                            color={
                              item.reminderTime
                                ? themeColor
                                : Colors[theme].text_secondary
                            }
                          />
                          <Text
                            style={{
                              fontFamily: "NunitoMedium",
                              fontSize: 13,
                              color: item.reminderTime
                                ? themeColor
                                : Colors[theme].text_secondary,
                            }}
                          >
                            {item.reminderTime
                              ? formatTime12h(item.reminderTime)
                              : "Set reminder"}
                          </Text>
                        </Pressable>

                        {item.reminderTime && (
                          <Pressable
                            onPress={() => removeReminder(index)}
                            style={{ marginLeft: 8, padding: 4 }}
                          >
                            <Feather
                              name="x"
                              size={16}
                              color={Colors[theme].text_secondary}
                            />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
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
                  No sub-habits added
                </Text>
              </View>
            )}
          </ScrollView>

          {/* iOS Time Picker Inline */}
          {showTimePicker && Platform.OS === "ios" && (
            <View
              style={{
                backgroundColor: Colors[theme].surface,
                borderRadius: 15,
                padding: 15,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: Colors[theme].border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 14,
                    color: Colors[theme].text,
                  }}
                >
                  Set Reminder Time
                </Text>
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  style={{
                    backgroundColor: themeColor,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "NunitoBold",
                      fontSize: 13,
                      color: "#fff",
                    }}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                themeVariant={theme === "dark" ? "dark" : "light"}
              />
            </View>
          )}

          {/* Android Time Picker (auto-dismisses) */}
          {showTimePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* Done Button */}
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
              Done
            </Text>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default AddSubHabitModal;

const styles = StyleSheet.create({
  text_input_container: {
    width: "100%",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
  },
});
