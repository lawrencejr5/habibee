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
  ActivityIndicator,
  BackHandler,
} from "react-native";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import Colors from "@/constants/Colors";
import { useColorScheme } from "../useColorScheme";
import { Feather } from "@expo/vector-icons";
import ToggleButton from "@/components/ToggleButton";
import IconColorPicker from "@/components/home/IconColorPicker";
import { habitIcons } from "@/data/habits";
import { useHapitcs } from "@/context/HapticsContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";
import { useTheme } from "@/context/ThemeContext";
import { useCustomAlert } from "@/context/AlertContext";

interface EditHabitModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
  habit: HabitType;
}

const EditHabitModal: FC<EditHabitModalProps> = ({
  visible,
  setVisible,
  habit,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

  const { showCustomAlert } = useCustomAlert();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  const update_habit = useMutation(api.habits.update_habit);

  const [habitName, setHabitName] = useState(habit.habit);
  const [duration, setDuration] = useState<string>(String(habit.duration));
  const [goal, setGoal] = useState<string>(String(habit.goal));
  const [strict, setStrict] = useState<boolean>(habit.strict);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>(habit.icon ?? "default");
  const [selectedColor, setSelectedColor] = useState<string>(habit.theme ?? "#999");

  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const handle_submit = async () => {
    setBtnLoading(true);
    try {
      if (!habitName || !duration || !goal) {
        showCustomAlert("Fill in the details for this habit", "warning");
        return;
      }
      await update_habit({
        habit_id: habit._id,
        habit: habitName,
        icon: selectedIcon,
        theme: selectedColor,
        duration: Number(duration),
        goal: Number(goal),
        strict,
      });
      showCustomAlert("Habit updated successfully!", "success");
    } catch (err) {
      showCustomAlert("An error occurred!", "success");
    } finally {
      setBtnLoading(false);
    }
  };

  useEffect(() => {
    if (visible) bottomSheetRef.current?.snapToIndex(0);
    else bottomSheetRef.current?.close();
  }, [visible]);

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        bottomSheetRef.current?.close()
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [visible, setVisible]);

  useEffect(() => {
    if (!visible) return;
    setHabitName(habit.habit);
    setDuration(String(habit.duration));
    setGoal(String(habit.goal));
    setSelectedIcon(habit.icon ?? "default");
    setSelectedColor(habit.theme ?? "#999");
  }, [visible, habit]);

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="fillParent"
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
          contentContainerStyle={{ paddingBottom: 50 }}
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
                  <BottomSheetTextInput
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
      </BottomSheetView>

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
