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
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface HabitContextMenuProps {
  visible: boolean;
  onClose: () => void;
  habit: HabitType | null;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const HabitContextMenu: FC<HabitContextMenuProps> = ({
  visible,
  onClose,
  habit,
  onEdit,
  onArchive,
  onDelete,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const subHabits = useQuery(
    api.sub_habits.get_sub_habits,
    habit ? { parent_habit_id: habit._id } : "skip",
  );

  const snapPoints = useMemo(() => {
    if (subHabits && subHabits.length > 0) {
      return ["45%"];
    }
    return ["40%"];
  }, [subHabits]);

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

  if (!habit) return null;

  const themeColor = habit.theme ?? Colors[theme].primary;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
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
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 10,
        }}
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
          {/* Toggle Expand Sub-habits */}
          {subHabits && subHabits.length > 0 && (
            <Pressable
              onPress={() => {
                haptics.impact("light");
                onClose();
                onToggleExpand?.();
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 30,
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderRadius: 14,
                backgroundColor: pressed ? Colors[theme].border : "transparent",
              })}
            >
              <Feather
                name={isExpanded ? "eye-off" : "eye"}
                size={18}
                color={Colors[theme].text}
              />
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 15,
                  color: Colors[theme].text,
                }}
              >
                {isExpanded ? "Hide Sub-habits" : "Show Sub-habits"}
              </Text>
            </Pressable>
          )}
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
              gap: 30,
              paddingVertical: 14,
              paddingHorizontal: 4,
              borderRadius: 14,
              backgroundColor: pressed ? Colors[theme].border : "transparent",
            })}
          >
            <Feather name="edit-2" size={18} color={Colors[theme].text} />
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 15,
                color: Colors[theme].text,
              }}
            >
              Edit Habit
            </Text>
          </Pressable>

          {/* Archive */}
          <Pressable
            onPress={() => {
              haptics.impact("light");
              onClose();
              onArchive();
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 30,
              paddingVertical: 14,
              paddingHorizontal: 4,
              borderRadius: 14,
              backgroundColor: pressed ? Colors[theme].border : "transparent",
            })}
          >
            <Feather name="archive" size={18} color={Colors[theme].text} />
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 15,
                color: Colors[theme].text,
              }}
            >
              Archive Habit
            </Text>
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
              gap: 30,
              paddingVertical: 14,
              paddingHorizontal: 4,
              borderRadius: 14,
              backgroundColor: pressed ? Colors[theme].border : "transparent",
            })}
          >
            <Feather name="trash-2" size={18} color={Colors[theme].text} />
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 15,
                color: Colors[theme].text,
              }}
            >
              Delete Habit
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default HabitContextMenu;
