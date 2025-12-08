import React, { Dispatch, SetStateAction, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View as ThemedView } from "../Themed";

import ToggleButton from "@/components/ToggleButton";
import IconColorPicker from "@/components/home/IconColorPicker";
import { habitIcons } from "@/data/habits";
import { useColorScheme } from "../useColorScheme";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const AddModal: React.FC<{
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ visible, setVisible }) => {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();

  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>("default");
  const [selectedColor, setSelectedColor] = useState<string>("#c5c9cc");

  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const [habit, setHabit] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [strict, setStrict] = useState<boolean>(true);

  const close = () => {
    haptics.impact();
    resetForm();
  };

  const add_habit = useMutation(api.habits.add_habit);

  const resetForm = () => {
    setVisible(false);
    setHabit("");
    setDuration("");
    setGoal("");
    setStrict(true);
    setSelectedColor("#c5c9cc");
    setSelectedIcon("default");
  };

  const handleSubmit = async () => {
    setBtnLoading(true);
    try {
      if (!habit || !duration || !goal) {
        console.log("Fill in the details for this habit");
      }
      await add_habit({
        habit,
        icon: (selectedIcon as string) ?? "default",
        theme: (selectedColor as string) ?? "#c5c9cc",
        strict,
        goal: Number(goal),
        duration: Number(duration),
      });
    } catch (error) {
      console.log(error);
    } finally {
      setBtnLoading(false);
      resetForm();
    }
  };

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
          <Pressable
            style={{
              marginTop: 20,
              backgroundColor: Colors[theme].surface,
              alignSelf: "flex-end",
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
              style={{ textAlign: "right" }}
            />
          </Pressable>
          <Text
            style={{
              color: Colors[theme].text,
              fontFamily: "NunitoExtraBold",
              fontSize: 26,
            }}
          >
            New habit
          </Text>

          <View style={{ flex: 1 }}>
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
                  Name ur habit
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
                    Duration
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
                        color: Colors[theme].text,
                      }}
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
                  Streak counts after timer ends
                </Text>
                <ToggleButton
                  isOn={strict}
                  onToggle={() => {
                    setStrict((prev) => !prev);
                  }}
                />
              </View>
            </View>
          </View>

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
