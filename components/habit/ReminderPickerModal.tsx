import React, { Dispatch, SetStateAction, useState, useEffect, useCallback } from "react";
import { Modal, Platform, Pressable, View, Text, StyleSheet } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCustomAlert } from "@/context/AlertContext";

interface Props {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habitId: Id<"habits"> | null;
  initialTime?: string;
  themeColor?: string;
}

export default function ReminderPickerModal({ visible, setVisible, habitId, initialTime, themeColor }: Props) {
  const { theme } = useTheme();
  const { showCustomAlert } = useCustomAlert();
  const update_habit = useMutation(api.habits.update_habit);
  
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    if (visible) {
      if (initialTime) {
        const [h, m] = initialTime.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        setPickerDate(d);
      } else {
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        setPickerDate(d);
      }
    }
  }, [visible, initialTime]);

  const saveTime = useCallback(async (dateToSave: Date) => {
    if (!habitId) return;
    const hours = String(dateToSave.getHours()).padStart(2, "0");
    const minutes = String(dateToSave.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    try {
      await update_habit({ habit_id: habitId, reminder_time: timeStr });
      showCustomAlert("Reminder set", "success");
      setVisible(false);
    } catch (e: any) {
      showCustomAlert(e.message || "Error", "danger");
    }
  }, [habitId, update_habit, showCustomAlert, setVisible]);

  const handleTimeChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setVisible(false);
      if (event.type === "set" && selectedDate) {
        setPickerDate(selectedDate);
        if (habitId) {
          saveTime(selectedDate);
        }
      }
    } else {
      if (selectedDate) setPickerDate(selectedDate);
    }
  }, [habitId, saveTime, setVisible]);

  const removeTime = async () => {
    if (!habitId) return;
    try {
      await update_habit({ habit_id: habitId, reminder_time: null as any });
      showCustomAlert("Reminder removed", "success");
      setVisible(false);
    } catch (e: any) {
      showCustomAlert(e.message || "Error", "danger");
    }
  };

  if (!visible) return null;

  return (
    <>
      {Platform.OS === "android" && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
      {Platform.OS === "ios" && (
        <Modal transparent visible={visible} animationType="fade">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: Colors[theme].surface, padding: 20, borderRadius: 20, width: "80%" }}>
              <Text style={{ fontFamily: "NunitoBold", fontSize: 18, color: Colors[theme].text, marginBottom: 15, textAlign: "center" }}>
                Set Reminder
              </Text>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                themeVariant={theme === "dark" ? "dark" : "light"}
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
                {initialTime && (
                  <Pressable onPress={removeTime} style={{ padding: 10, flex: 1, backgroundColor: Colors[theme].border, borderRadius: 10, alignItems: "center" }}>
                    <Text style={{ fontFamily: "NunitoMedium", color: Colors[theme].text }}>Remove</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setVisible(false)} style={{ padding: 10, flex: 1, backgroundColor: Colors[theme].border, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontFamily: "NunitoMedium", color: Colors[theme].text }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => saveTime(pickerDate)} style={{ padding: 10, flex: 1, backgroundColor: themeColor || Colors[theme].primary, borderRadius: 10, alignItems: "center" }}>
                  <Text style={{ fontFamily: "NunitoMedium", color: "#fff" }}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
