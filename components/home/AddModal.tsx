import React, { Dispatch, SetStateAction, useState } from "react";
import {
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
import * as Haptics from "expo-haptics";
import { useColorScheme } from "../useColorScheme";

const AddModal: React.FC<{
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ visible, setVisible }) => {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [isEnabled, setIsEnabled] = useState(true);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#c5c9cc");

  const close = () => {
    setVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
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
          <View
            style={{
              marginTop: 20,
              flexDirection: "row",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: Colors[theme].border,
              backgroundColor: Colors[theme].surface,
              alignSelf: "center",
              padding: 30,
              borderRadius: 999,
            }}
          >
            <Image
              source={selectedIcon || require("@/assets/icons/habit/emoji.png")}
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
                width: 28,
                height: 28,
                borderRadius: 18,
                backgroundColor: Colors[theme].text_secondary,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#ccc",
              }}
            >
              <Feather name="plus" size={16} color="#121212" />
            </Pressable>
          </View>

          <IconColorPicker
            visible={iconPickerVisible}
            icons={Object.values(habitIcons)}
            selectedColor={selectedColor}
            onClose={() => setIconPickerVisible(false)}
            onSelect={(icon, color) => {
              setSelectedIcon(icon);
              setSelectedColor(color);
            }}
          />

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
                  style={{ width: "90%", fontFamily: "NunitoMedium" }}
                  placeholder="Habit"
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
                    style={{ flex: 1, fontFamily: "NunitoMedium" }}
                    placeholder="30 mins"
                  />
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
                  <TextInput style={{ flex: 1, fontFamily: "NunitoMedium" }} />
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
                isOn={isEnabled}
                onToggle={() => setIsEnabled(!isEnabled)}
              />
            </View>
          </View>
        </View>

        {/* Save button - Fixed at bottom */}
        <Pressable
          style={{
            width: "100%",
            backgroundColor: Colors[theme].primary,
            paddingVertical: 15,
            borderRadius: 50,
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
            Save Habit
          </Text>
        </Pressable>
      </ThemedView>
    </Modal>
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
