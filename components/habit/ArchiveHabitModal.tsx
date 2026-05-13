import React, { useState } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
} from "react-native";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";
import { useHapitcs } from "@/context/HapticsContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";

type ArchiveHabitModalProps = {
  visible: boolean;
  onClose: () => void;
  habit: HabitType;
};

const ArchiveHabitModal: React.FC<ArchiveHabitModalProps> = ({
  visible,
  onClose,
  habit,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const archive_habit = useMutation(api.habits.archive_habit);

  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const handle_submit = async () => {
    setBtnLoading(true);
    haptics.impact();
    try {
      await archive_habit({ habit_id: habit._id });
      showCustomAlert("Habit archived successfully", "success");
      onClose();
    } catch (error) {
      showCustomAlert("Failed to archive habit", "danger");
    } finally {
      setBtnLoading(false);
      haptics.impact();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          { backgroundColor: Colors[theme].background + "cc" },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.centered,
            {
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.headerRow}>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 20,
                color: Colors[theme].text,
              }}
            >
              Archive Habit
            </Text>
            <Pressable style={{ padding: 10 }} onPress={onClose}>
              <Feather name="x" color={Colors[theme].text} size={24} />
            </Pressable>
          </View>

          <Text
            style={{
              fontFamily: "NunitoBold",
              fontSize: 16,
              color: Colors[theme].text_secondary,
              marginVertical: 10,
              // textAlign: "center",
            }}
          >
            Are you sure you want to archive this habit?
          </Text>
          <Text
            style={{
              fontFamily: "NunitoMedium",
              fontSize: 14,
              color: Colors[theme].warning || Colors[theme].text_secondary,
              marginBottom: 20,
              // textAlign: "center",
            }}
          >
            Note: Restoring this habit later will reset your streak to 0, though
            your entries and progress grid will remain. Highest streak will be
            preserved.
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              onPress={onClose}
              style={[
                styles.actionBtn,
                {
                  borderColor: Colors[theme].border,
                  backgroundColor: Colors[theme].surface,
                  paddingHorizontal: 15,
                },
              ]}
            >
              <Text
                style={{
                  color: Colors[theme].text_secondary,
                  fontFamily: "NunitoBold",
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handle_submit}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: Colors[theme].primary,
                  flex: 1,
                  opacity: btnLoading ? 0.5 : 1, // Adjust opacity when loading
                },
              ]}
              disabled={btnLoading} // Disable button when loading
            >
              {btnLoading ? (
                <ActivityIndicator color={"#fff"} />
              ) : (
                <Text style={{ color: "#fff", fontFamily: "NunitoBold" }}>
                  Archive
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ArchiveHabitModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    width: "90%",
    maxHeight: "50%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },
});
