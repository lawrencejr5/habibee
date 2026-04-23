import React, { FC, useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View, Image } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { HabitType } from "@/constants/Types";
import { habitIcons } from "@/data/habits";
import { useHapitcs } from "@/context/HapticsContext";

interface HabitContextMenuProps {
  visible: boolean;
  onClose: () => void;
  habit: HabitType | null;
  onEdit: () => void;
  onDelete: () => void;
}

const HabitContextMenu: FC<HabitContextMenuProps> = ({
  visible,
  onClose,
  habit,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["42%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.4}
      pressBehavior="close"
    />
  );

  if (!visible || !habit) return null;

  const themeColor = habit.theme ?? Colors[theme].primary;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 4,
        backgroundColor: Colors[theme].border,
        marginTop: 8,
        borderRadius: 30,
      }}
    >
      <BottomSheetView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}
      >
        {/* Habit identifier row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: Colors[theme].border,
            marginBottom: 6,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: themeColor + "20",
              borderWidth: 1.5,
              borderColor: themeColor,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={habitIcons[habit.icon ?? "default"]}
              style={{ width: 20, height: 20, tintColor: themeColor }}
            />
          </View>
          <Text
            style={{
              fontFamily: "NunitoExtraBold",
              fontSize: 16,
              color: Colors[theme].text,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {habit.habit}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ gap: 4 }}>
          {/* Edit */}
          <Pressable
            onPress={() => {
              haptics.impact("light");
              onClose();
              onEdit();
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: pressed ? Colors[theme].border : "transparent",
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: Colors[theme].primary + "15",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Feather name="edit-2" size={16} color={Colors[theme].primary} />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 15,
                  color: Colors[theme].text,
                }}
              >
                Edit Habit
              </Text>
              <Text
                style={{
                  fontFamily: "NunitoMedium",
                  fontSize: 12,
                  color: Colors[theme].text_secondary,
                }}
              >
                Update name, duration, goal & more
              </Text>
            </View>
          </Pressable>

          {/* Delete */}
          <Pressable
            onPress={() => {
              haptics.impact("medium");
              onClose();
              onDelete();
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: pressed
                ? Colors[theme].danger + "15"
                : "transparent",
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: Colors[theme].danger + "15",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Feather name="trash-2" size={16} color={Colors[theme].danger} />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 15,
                  color: Colors[theme].danger,
                }}
              >
                Delete Habit
              </Text>
              <Text
                style={{
                  fontFamily: "NunitoMedium",
                  fontSize: 12,
                  color: Colors[theme].text_secondary,
                }}
              >
                This action cannot be undone
              </Text>
            </View>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default HabitContextMenu;
