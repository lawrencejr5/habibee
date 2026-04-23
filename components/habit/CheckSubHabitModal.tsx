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
  ActivityIndicator,
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
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { formatTime12h } from "@/components/habit/AddSubHabitModal";

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

  const habits = useQuery(api.habits.get_user_habits);
  const habit = habits?.find((h) => h._id === habit_id);
  const today = new Date().toLocaleDateString("en-CA");
  const isParentDone = habit?.lastCompleted === today;

  const subHabits = useQuery(api.sub_habits.get_sub_habits, {
    parent_habit_id: habit_id,
  });

  const toggle_sub_habit = useMutation(api.sub_habits.toggle_sub_habit);
  const add_sub_habit = useMutation(api.sub_habits.add_sub_habit);
  const delete_sub_habit = useMutation(api.sub_habits.delete_sub_habit);
  const update_sub_habit = useMutation(api.sub_habits.update_sub_habit);

  // Text editing state
  const [newSubHabitName, setNewSubHabitName] = useState("");
  const [editingId, setEditingId] = useState<Id<"sub_habits"> | null>(null);
  const [editName, setEditName] = useState("");

  // Loading state
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<Id<"sub_habits"> | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"sub_habits"> | null>(null);
  const [togglingId, setTogglingId] = useState<Id<"sub_habits"> | null>(null);

  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  // "new" means we're picking a reminder for the new sub-habit being added
  // Id means we're editing an existing sub-habit's reminder
  const [pickerTarget, setPickerTarget] = useState<
    Id<"sub_habits"> | "new" | null
  >(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  // Pending reminder time for the new sub-habit being added
  const [newReminderTime, setNewReminderTime] = useState<string | undefined>(
    undefined,
  );

  const close = () => {
    haptics.impact();
    setVisible(false);
    setNewSubHabitName("");
    setNewReminderTime(undefined);
    setEditingId(null);
    setShowTimePicker(false);
    setPickerTarget(null);
  };

  // ─── Time Picker helpers ───────────────────────────────────────────────────

  const openTimePicker = (
    target: Id<"sub_habits"> | "new",
    existingTime?: string,
  ) => {
    haptics.impact();
    setPickerTarget(target);

    const d = new Date();
    if (existingTime) {
      const [h, m] = existingTime.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(9, 0, 0, 0);
    }
    setPickerDate(d);
    setShowTimePicker(true);
  };

  const saveReminder = useCallback(
    async (subHabitId: Id<"sub_habits">, timeStr: string) => {
      try {
        setUpdatingId(subHabitId);
        await update_sub_habit({
          sub_habit_id: subHabitId,
          reminder_time: timeStr,
        });
      } catch (error) {
        showCustomAlert("Failed to save reminder", "danger");
      } finally {
        setUpdatingId(null);
      }
    },
    [update_sub_habit, showCustomAlert],
  );

  const handleTimeChange = useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowTimePicker(false);

      if (!selectedDate || !pickerTarget) return;

      setPickerDate(selectedDate);

      const hours = String(selectedDate.getHours()).padStart(2, "0");
      const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      if (pickerTarget === "new") {
        setNewReminderTime(timeStr);
      } else {
        saveReminder(pickerTarget, timeStr);
      }
    },
    [pickerTarget, saveReminder],
  );

  const clearReminder = async (subHabitId: Id<"sub_habits">) => {
    haptics.impact();
    try {
      setUpdatingId(subHabitId);
      await update_sub_habit({
        sub_habit_id: subHabitId,
        reminder_time: null, // null = clear
      });
    } catch (error) {
      showCustomAlert("Failed to clear reminder", "danger");
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── CRUD handlers ────────────────────────────────────────────────────────

  const handleToggle = async (subHabitId: Id<"sub_habits">) => {
    haptics.impact();
    setTogglingId(subHabitId);
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
      showCustomAlert("Failed to update sub-habit", "danger");
    } finally {
      setTogglingId(null);
    }
  };

  const handleAdd = async () => {
    if (!newSubHabitName.trim() || isParentDone) return;

    setAdding(true);
    try {
      haptics.impact();
      await add_sub_habit({
        parent_habit_id: habit_id,
        name: newSubHabitName.trim(),
        reminder_time: newReminderTime,
      });
      setNewSubHabitName("");
      setNewReminderTime(undefined);
    } catch (error: any) {
      if (error.data) showCustomAlert(error.data, "danger");
      else showCustomAlert("Failed to add sub-habit", "danger");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (subHabitId: Id<"sub_habits">) => {
    if (isParentDone) return;
    haptics.impact();
    setDeletingId(subHabitId);
    try {
      await delete_sub_habit({ sub_habit_id: subHabitId });
    } catch (error) {
      showCustomAlert("Failed to delete sub-habit", "danger");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (id: Id<"sub_habits">, name: string) => {
    if (isParentDone) return;
    haptics.impact();
    setEditingId(id);
    setEditName(name);
    setShowTimePicker(false);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    setUpdatingId(editingId);
    try {
      haptics.impact();
      await update_sub_habit({
        sub_habit_id: editingId,
        name: editName.trim(),
      });
      setEditingId(null);
    } catch (error: any) {
      if (error.data) showCustomAlert(error.data, "danger");
      else showCustomAlert("Failed to update sub-habit", "danger");
    } finally {
      setUpdatingId(null);
    }
  };

  const [isAddFocused, setIsAddFocused] = useState(false);
  const Container =
    subHabits && subHabits.length > 0 && !isAddFocused
      ? KeyboardStickyView
      : View;

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
            paddingTop: 30,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 30,
            marginTop: 100,
          }}
        >
          {/* Header */}
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

          {/* Progress bar */}
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
                {subHabits.filter((s) => s.completed).length}/{subHabits.length}{" "}
                completed
              </Text>
            </View>
          )}

          {/* Add new sub-habit row */}
          {!isParentDone && (
            <View style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors[theme].surface,
                  borderWidth: 1,
                  borderColor: Colors[theme].border,
                  borderRadius: 10,
                  paddingHorizontal: 15,
                  paddingVertical: 5,
                }}
              >
                <Feather
                  name="plus"
                  size={20}
                  color={Colors[theme].text_secondary}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  placeholder="Add new sub-habit"
                  placeholderTextColor={Colors[theme].text_secondary}
                  style={{
                    flex: 1,
                    fontFamily: "NunitoMedium",
                    color: Colors[theme].text,
                    fontSize: 16,
                  }}
                  value={newSubHabitName}
                  onChangeText={setNewSubHabitName}
                  onSubmitEditing={handleAdd}
                  editable={!adding}
                  onFocus={() => setIsAddFocused(true)}
                  onBlur={() => setIsAddFocused(false)}
                />
              </View>
              <Pressable
                onPress={handleAdd}
                disabled={adding}
                style={{
                  backgroundColor: themeColor,
                  width: 50,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: adding ? 0.5 : 1,
                }}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="plus" size={24} color="#fff" />
                )}
              </Pressable>
            </View>

            {/* Reminder pill for new sub-habit */}
            {newSubHabitName.trim().length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingLeft: 2,
                }}
              >
                <Pressable
                  onPress={() => openTimePicker("new", newReminderTime)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: newReminderTime
                      ? themeColor + "15"
                      : Colors[theme].surface,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: newReminderTime
                      ? themeColor + "40"
                      : Colors[theme].border,
                    gap: 6,
                  }}
                >
                  <Feather
                    name="clock"
                    size={13}
                    color={
                      newReminderTime
                        ? themeColor
                        : Colors[theme].text_secondary
                    }
                  />
                  <Text
                    style={{
                      fontFamily: "NunitoMedium",
                      fontSize: 13,
                      color: newReminderTime
                        ? themeColor
                        : Colors[theme].text_secondary,
                    }}
                  >
                    {newReminderTime
                      ? formatTime12h(newReminderTime)
                      : "Set reminder"}
                  </Text>
                </Pressable>
                {newReminderTime && (
                  <Pressable
                    onPress={() => setNewReminderTime(undefined)}
                    style={{ marginLeft: 8, padding: 4 }}
                  >
                    <Feather
                      name="x"
                      size={15}
                      color={Colors[theme].text_secondary}
                    />
                  </Pressable>
                )}
              </View>
            )}
            </View>
          )}

          {/* iOS Time Picker */}
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
                  marginBottom: 8,
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
                  onPress={() => {
                    setShowTimePicker(false);
                    setPickerTarget(null);
                  }}
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

          {/* Android Time Picker */}
          {showTimePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          <Container style={{ flex: 1 }} offset={{ closed: 0, opened: 150 }}>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {subHabits === undefined ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <ActivityIndicator color={themeColor} size="large" />
                </View>
              ) : subHabits.length > 0 ? (
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
                      key={item._id}
                      style={{
                        padding: 15,
                        borderBottomWidth: index < subHabits.length - 1 ? 1 : 0,
                        borderBottomColor: Colors[theme].border,
                      }}
                    >
                      {editingId === item._id ? (
                        // ── Edit name mode ──────────────────────────────────
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            autoFocus
                            style={{
                              flex: 1,
                              fontFamily: "NunitoMedium",
                              fontSize: 16,
                              color: Colors[theme].text,
                              borderBottomWidth: 1,
                              borderBottomColor: themeColor,
                              paddingBottom: 2,
                            }}
                          />
                          <Pressable onPress={saveEdit} disabled={!!updatingId}>
                            {updatingId === item._id ? (
                              <ActivityIndicator
                                size="small"
                                color={themeColor}
                              />
                            ) : (
                              <Feather
                                name="check"
                                size={20}
                                color={themeColor}
                              />
                            )}
                          </Pressable>
                          <Pressable
                            onPress={() => setEditingId(null)}
                            disabled={!!updatingId}
                          >
                            <Feather
                              name="x"
                              size={20}
                              color={Colors[theme].danger}
                            />
                          </Pressable>
                        </View>
                      ) : (
                        // ── View mode ───────────────────────────────────────
                        <>
                          {/* Top row: checkbox + name + actions */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Pressable
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                flex: 1,
                              }}
                              onPress={() => handleToggle(item._id)}
                              disabled={togglingId === item._id || isParentDone}
                            >
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  marginRight: 12,
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                {togglingId === item._id ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={themeColor}
                                  />
                                ) : (
                                  <Feather
                                    name={
                                      item.completed ? "check-circle" : "circle"
                                    }
                                    size={24}
                                    color={
                                      item.completed
                                        ? isParentDone ? themeColor + "80" : themeColor
                                        : Colors[theme].text_secondary
                                    }
                                  />
                                )}
                              </View>
                              <Text
                                style={{
                                  fontFamily: "NunitoMedium",
                                  fontSize: 16,
                                  color: item.completed
                                    ? Colors[theme].text_secondary
                                    : Colors[theme].text,
                                  textDecorationLine: item.completed
                                    ? "line-through"
                                    : "none",
                                  flex: 1,
                                }}
                              >
                                {item.name}
                              </Text>
                            </Pressable>

                            {/* Edit & Delete buttons */}
                            {!isParentDone && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  gap: 15,
                                  marginLeft: 10,
                                }}
                              >
                              <Pressable
                                onPress={() =>
                                  startEditing(item._id, item.name)
                                }
                              >
                                <Feather
                                  name="edit-2"
                                  size={18}
                                  color={Colors[theme].text_secondary}
                                />
                              </Pressable>
                              <Pressable
                                onPress={() => handleDelete(item._id)}
                                disabled={deletingId === item._id}
                              >
                                {deletingId === item._id ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={Colors[theme].danger}
                                  />
                                ) : (
                                  <Feather
                                    name="trash-2"
                                    size={18}
                                    color={Colors[theme].danger}
                                  />
                                )}
                              </Pressable>
                            </View>
                          )}
                        </View>

                          {/* Reminder row */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 8,
                              marginLeft: 36,
                            }}
                          >
                            <Pressable
                              onPress={() =>
                                openTimePicker(
                                  item._id,
                                  item.reminder_time ?? undefined,
                                )
                              }
                              disabled={updatingId === item._id || isParentDone}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: item.reminder_time
                                  ? themeColor + "15"
                                  : Colors[theme].background,
                                paddingVertical: 5,
                                paddingHorizontal: 11,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: item.reminder_time
                                  ? themeColor + "40"
                                  : Colors[theme].border,
                                gap: 5,
                                opacity: updatingId === item._id || isParentDone ? 0.5 : 1,
                              }}
                            >
                              {updatingId === item._id ? (
                                <ActivityIndicator
                                  size="small"
                                  color={themeColor}
                                />
                              ) : (
                                <Feather
                                  name="clock"
                                  size={12}
                                  color={
                                    item.reminder_time
                                      ? themeColor
                                      : Colors[theme].text_secondary
                                  }
                                />
                              )}
                              <Text
                                style={{
                                  fontFamily: "NunitoMedium",
                                  fontSize: 12,
                                  color: item.reminder_time
                                    ? themeColor
                                    : Colors[theme].text_secondary,
                                }}
                              >
                                {item.reminder_time
                                  ? formatTime12h(item.reminder_time)
                                  : "Set reminder"}
                              </Text>
                            </Pressable>

                            {item.reminder_time && !isParentDone && (
                              <Pressable
                                onPress={() => clearReminder(item._id)}
                                disabled={updatingId === item._id}
                                style={{ marginLeft: 8, padding: 3 }}
                              >
                                <Feather
                                  name="x"
                                  size={14}
                                  color={Colors[theme].text_secondary}
                                />
                              </Pressable>
                            )}
                          </View>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 20,
                    opacity: 0.5,
                    marginBottom: 20,
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
          </Container>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default CheckSubHabitModal;

const styles = StyleSheet.create({});
