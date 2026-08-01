import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { KeyboardStickyView } from "react-native-keyboard-controller";

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, date: string, time?: string) => void;
}

const AddPlanModal: React.FC<AddPlanModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDate(new Date());
      setTime(null);
      setShowTimePicker(false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    haptics.impact();

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    let timeStr: string | undefined;
    if (time) {
      timeStr = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
    }

    onSave(title.trim(), dateStr, timeStr);
    setTitle("");
    setTime(null);
  };

  const onTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  };

  const formatTime = (t: Date) => {
    const h = t.getHours();
    const m = t.getMinutes();
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardStickyView style={styles.keyboardView}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: Colors[theme].surface,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Handle bar */}
              <View style={styles.handleBar}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: Colors[theme].border },
                  ]}
                />
              </View>

              {/* Title input */}
              <TextInput
                style={[
                  styles.input,
                  {
                    color: Colors[theme].text,
                    backgroundColor: Colors[theme].card,
                    borderColor: Colors[theme].border,
                  },
                ]}
                placeholder="What do you need to do?"
                placeholderTextColor={Colors[theme].text_secondary}
                value={title}
                onChangeText={setTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {/* Date & Time row */}
              <View style={styles.optionsRow}>
                <Pressable
                  onPress={() => {
                    haptics.impact();
                    setShowTimePicker(!showTimePicker);
                    if (!time) setTime(new Date());
                  }}
                  style={[
                    styles.optionChip,
                    { backgroundColor: Colors[theme].card },
                  ]}
                >
                  <Feather
                    name="clock"
                    size={14}
                    color={Colors[theme].primary}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      { color: Colors[theme].text },
                    ]}
                  >
                    {time ? formatTime(time) : "Add time"}
                  </Text>
                  {time && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setTime(null);
                        setShowTimePicker(false);
                      }}
                      hitSlop={6}
                    >
                      <Feather
                        name="x"
                        size={14}
                        color={Colors[theme].text_secondary}
                      />
                    </Pressable>
                  )}
                </Pressable>
              </View>

              {/* Time picker */}
              {showTimePicker && (
                <DateTimePicker
                  value={time || new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onTimeChange}
                  themeVariant={theme}
                />
              )}

              {/* Save button */}
              <Pressable
                onPress={handleSave}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: title.trim()
                      ? Colors[theme].primary
                      : Colors[theme].border,
                  },
                ]}
                disabled={!title.trim()}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.saveText}>Add Task</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </KeyboardStickyView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handleBar: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  input: {
    fontSize: 16,
    fontFamily: "NunitoSemiBold",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  optionText: {
    fontSize: 13,
    fontFamily: "NunitoSemiBold",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "NunitoBold",
  },
});

export default AddPlanModal;
