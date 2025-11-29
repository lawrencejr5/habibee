import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Colors from "@/constants/Colors";
import { useColorScheme } from "../useColorScheme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import ToggleButton from "@/components/ToggleButton";
import IconColorPicker from "@/components/home/IconColorPicker";
import { habitIcons } from "@/data/habits";

interface EditHabitModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habitTitle?: string;
  habitDuration?: string;
  habitIcon?: any;
  habitColor?: string;
}

const EditHabitModal: FC<EditHabitModalProps> = ({
  visible,
  setVisible,
  habitTitle = "Meditation",
  habitDuration = "30 mins",
  habitIcon = null,
  habitColor = "#e74c3c",
}) => {
  const theme = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["95%"], []);

  const [habitName, setHabitName] = useState(habitTitle);
  const [duration, setDuration] = useState(habitDuration);
  const [goal, setGoal] = useState("365");
  const [isEnabled, setIsEnabled] = useState(true);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<any>(habitIcon);
  const [selectedColor, setSelectedColor] = useState<string>(habitColor);

  useEffect(() => {
    if (visible) bottomSheetRef.current?.expand();
    else bottomSheetRef.current?.close();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setHabitName(habitTitle);
    setDuration(habitDuration);
    setSelectedIcon(habitIcon);
    setSelectedColor(habitColor);
  }, [visible, habitTitle, habitDuration, habitIcon, habitColor]);

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log({
      habitName,
      duration,
      goal,
      isEnabled,
      selectedIcon,
      selectedColor,
    });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      onClose={() => setVisible(false)}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 5,
        backgroundColor: "grey",
        marginTop: 10,
        borderRadius: 30,
      }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View style={{ marginTop: 20, marginBottom: 20 }}>
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
            <View style={{ marginBottom: 20 }}>
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
                    color: Colors[theme].text_secondary,
                  }}
                  placeholder="Habit"
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
                      color: Colors[theme].text_secondary,
                    }}
                    placeholder="30 mins"
                    value={duration}
                    onChangeText={setDuration}
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
                  <TextInput
                    style={{
                      flex: 1,
                      fontFamily: "NunitoMedium",
                      color: Colors[theme].text_secondary,
                    }}
                    value={goal}
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
                isOn={isEnabled}
                onToggle={() => setIsEnabled(!isEnabled)}
              />
            </View>
          </View>
        </ScrollView>

        {/* Save button - Fixed at bottom */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 20,
            right: 20,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setVisible(false);
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
            onPress={handleSave}
            style={{
              flex: 1,
              backgroundColor: Colors[theme].primary,
              borderRadius: 50,
              paddingVertical: 10,
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
              Save Changes
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>

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
    </BottomSheet>
  );
};

export default EditHabitModal;

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
