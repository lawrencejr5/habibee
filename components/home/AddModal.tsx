import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Modal,
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
import { View as ThemedView } from "../Themed";

import ToggleButton from "@/components/ToggleButton";
import IconColorPicker, {
  DEFAULT_COLORS,
} from "@/components/home/IconColorPicker";
import { habitIcons } from "@/data/habits";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTheme } from "@/context/ThemeContext";
import { useCustomAlert } from "@/context/AlertContext";
import { Id } from "@/convex/_generated/dataModel";
import AddSubHabitModal from "../habit/AddSubHabitModal";
const AddModal: React.FC<{
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const getRandomColor = () => {
    const colors = DEFAULT_COLORS.filter((c) => c !== "#c5c9cc");
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const [selectedIcon, setSelectedIcon] = useState<string>("default");
  const [selectedColor, setSelectedColor] = useState<string>(getRandomColor());

  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const [habit, setHabit] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [strict, setStrict] = useState<boolean>(true);

  // Sub-habits state
  const [subHabits, setSubHabits] = useState<string[]>([]);
  const [subHabitModalVisible, setSubHabitModalVisible] = useState(false);

  const close = () => {
    haptics.impact();
    resetForm();
    setVisible(false);
  };

  const add_habit = useMutation(api.habits.add_habit);
  const add_sub_habit = useMutation(api.sub_habits.add_sub_habit);

  const resetForm = () => {
    setHabit("");
    setDuration("");
    setGoal("");
    setStrict(false);
    setSelectedColor(getRandomColor());
    setSelectedIcon("default");
    setSubHabits([]);
  };

  const handleSubmit = async () => {
    setBtnLoading(true);
    try {
      if (!habit || !goal) {
        showCustomAlert("Fill in the details for this habit", "warning");
        return;
      }

      const habit_id = await add_habit({
        habit,
        icon: (selectedIcon as string) ?? "default",
        theme: (selectedColor as string) ?? "#c5c9cc",
        strict,
        goal: Number(goal),
        duration: duration ? Number(duration) : undefined,
      });

      // Add sub-habits if any
      if (subHabits.length > 0) {
        for (const subHabitName of subHabits) {
          await add_sub_habit({
            parent_habit_id: habit_id,
            name: subHabitName,
          });
        }
      }

      showCustomAlert("Habit created successfully", "success");
      resetForm();
      setVisible(false);
    } catch (err: any) {
      if (err.data !== undefined) {
        showCustomAlert(err.data, "danger");
        return;
      }
    } finally {
      setBtnLoading(false);
    }
  };



  useEffect(() => {
    const backAction = () => {
      if (visible) {
        setVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [visible, setVisible]);

  return (
    <>
      <Modal transparent visible={visible} animationType="slide">
        <ThemedView
          style={{
            flex: 1,
            paddingTop: insets.top,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 50,
          }}
        >
          <KeyboardStickyView
            style={{ backgroundColor: Colors[theme].background, flex: 1 }}
            offset={{ opened: 250, closed: insets.bottom }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text
                style={{
                  color: Colors[theme].text,
                  fontFamily: "NunitoExtraBold",
                  fontSize: 26,
                }}
              >
                New habit
              </Text>
              <Pressable
                style={{
                  backgroundColor: Colors[theme].surface,
                  padding: 7,
                  borderWidth: 3,
                  borderColor: Colors[theme].border,
                  borderRadius: 50,
                }}
                onPress={close}
              >
                <Feather
                  name="x"
                  color={Colors[theme].text}
                  size={25}
                />
              </Pressable>

            </View>

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Pick icon */}
              <Pressable
                onPress={() => {
                  haptics.impact();
                  setIconPickerVisible(true);
                }}
                style={{
                  marginTop: 20,
                  flexDirection: "row",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: selectedColor,
                  backgroundColor: selectedColor + 20,
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
                    width: 25,
                    height: 25,
                    borderRadius: 18,
                    backgroundColor: selectedColor,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Feather name="plus" size={16} color="transparent" />
                </Pressable>
              </Pressable>

              {/* Form */}

              <View style={{ marginTop: 30 }}>
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontFamily: "NunitoBold",
                      fontSize: 16,
                      color: Colors[theme].text_secondary,
                    }}
                  >
                    Name ur habit *
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
                        color: Colors[theme].text,
                      }}
                      placeholder="Habit"
                      value={habit}
                      onChangeText={setHabit}
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
                    <Text
                      style={{
                        fontFamily: "NunitoBold",
                        fontSize: 16,
                        color: Colors[theme].text_secondary,
                      }}
                    >
                      Time per day
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
                          color: Colors[theme].text,
                        }}
                        placeholder="30"
                        keyboardType="numeric"
                        value={duration}
                        onChangeText={setDuration}
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
                      Goal *
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
                          color: Colors[theme].text,
                        }}
                        placeholder="365"
                        value={goal}
                        keyboardType="numeric"
                        onChangeText={setGoal}
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
                    Lock completion until timer ends
                  </Text>
                  <ToggleButton
                    isOn={strict}
                    onToggle={() => {
                      setStrict((prev) => !prev);
                    }}
                  />
                </View>

                {/* Sub-Habits Button */}
                <Pressable
                  onPress={() => {
                    haptics.impact();
                    setSubHabitModalVisible(true);
                  }}
                  style={{
                    marginTop: 30,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 15,
                    backgroundColor: Colors[theme].surface,
                    borderRadius: 15,
                    borderWidth: 2,
                    borderColor: Colors[theme].border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather
                      name="layers"
                      size={24}
                      color={selectedColor}
                      style={{ marginRight: 15 }}
                    />
                    <View>
                      <Text
                        style={{
                          fontFamily: "NunitoBold",
                          fontSize: 16,
                          color: Colors[theme].text,
                        }}
                      >
                        Sub-Habits
                      </Text>
                      <Text
                        style={{
                          fontFamily: "NunitoMedium",
                          fontSize: 14,
                          color: Colors[theme].text_secondary,
                        }}
                      >
                        {subHabits.length > 0
                          ? `${subHabits.length} added`
                          : "Add sub-tasks to this habit"}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={24}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardStickyView>

          {/* Save button - Fixed at bottom */}
          <Pressable
            onPress={handleSubmit}
            disabled={btnLoading}
            style={{
              width: "100%",
              backgroundColor: Colors[theme].primary,
              paddingVertical: 15,
              borderRadius: 50,
              opacity: btnLoading ? 0.5 : 1,
            }}
          >
            {btnLoading ? (
              <ActivityIndicator color={"#eee"} size={"small"} />
            ) : (
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 16,
                  color: "#eee",
                  textAlign: "center",
                }}
              >
                Save Habit
              </Text>
            )}
          </Pressable>
        </ThemedView>
      </Modal>
      <IconColorPicker
        visible={iconPickerVisible}
        icons={Object.keys(habitIcons)}
        selectedColor={selectedColor}
        onClose={() => setIconPickerVisible(false)}
        onSelect={(icon, color) => {
          setSelectedIcon(icon);
          setSelectedColor(color);
        }}
      />
      <AddSubHabitModal
        visible={subHabitModalVisible}
        setVisible={setSubHabitModalVisible}
        subHabits={subHabits}
        setSubHabits={setSubHabits}
        themeColor={selectedColor}
      />
    </>
  );
};

export default AddModal;

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
