import React, { Dispatch, SetStateAction, useState } from "react";
import {
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
import { View as ThemedView } from "@/components/Themed";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useCustomAlert } from "@/context/AlertContext";

interface AddSubHabitModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  subHabits: string[];
  setSubHabits: Dispatch<SetStateAction<string[]>>;
  themeColor: string;
}

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

  const close = () => {
    haptics.impact();
    setVisible(false);
  };

  const handleAddSubHabit = () => {
    if (!newSubHabit.trim()) {
      return;
    }

    if (subHabits.includes(newSubHabit.trim())) {
      showCustomAlert("This sub-habit already exists", "warning");
      return;
    }

    haptics.impact();
    setSubHabits([...subHabits, newSubHabit.trim()]);
    setNewSubHabit("");
  };

  const handleRemoveSubHabit = (index: number) => {
    haptics.impact();
    setSubHabits(subHabits.filter((_, i) => i !== index));
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
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 15,
                        borderBottomWidth: index < subHabits.length - 1 ? 1 : 0,
                        borderBottomColor: Colors[theme].border,
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
                        {item}
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
