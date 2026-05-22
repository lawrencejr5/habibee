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
    habit ? { parent_habit_id: habit._id } : "skip"
  );

  const snapPoints = useMemo(() => {
    if (subHabits && subHabits.length > 0) {
      return ["47%"];
    }
    return ["38%"];
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

        {/* Clickable Sub-habits progress card if any exist */}
        {subHabits && subHabits.length > 0 && (
          <Pressable
            onPress={() => {
              haptics.impact("light");
              onToggleExpand?.();
              bottomSheetRef.current?.close();
            }}
            style={({ pressed }) => ({
              backgroundColor: Colors[theme].surface,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1.5,
              borderColor: pressed ? themeColor : Colors[theme].border,
              marginVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            })}
          >
            <View style={{ flex: 1 }}>
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
                    fontFamily: "NunitoExtraBold",
                    fontSize: 14,
                    color: Colors[theme].text,
                  }}
                >
                  Sub-habits Progress
                </Text>
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 12,
                    color: themeColor,
                  }}
                >
                  {subHabits.filter((sh) => sh.completed).length}/{subHabits.length} Completed
                </Text>
              </View>

              {/* Progress Bar */}
              <View
                style={{
                  height: 6,
                  backgroundColor: Colors[theme].border,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    backgroundColor: themeColor,
                    width: `${(subHabits.filter((sh) => sh.completed).length / subHabits.length) * 100}%`,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>

            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: themeColor + "15",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Feather
                name={isExpanded ? "eye-off" : "eye"}
                size={18}
                color={themeColor}
              />
            </View>
          </Pressable>
        )}

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


