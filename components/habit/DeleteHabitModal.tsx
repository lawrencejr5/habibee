import React, { useState } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HabitType } from "@/constants/Types";
import { useHapitcs } from "@/context/HapticsContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";

type DeleteHabitModalProps = {
  visible: boolean;
  onClose: () => void;
  habit: HabitType;
};

const DeleteHabitModal: React.FC<DeleteHabitModalProps> = ({
  visible,
  onClose,
  habit,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const delete_habit = useMutation(api.habits.delete_habit);

  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const handle_submit = async () => {
    setBtnLoading(true);
    haptics.impact();
    try {
      await delete_habit({ habit_id: habit._id });
      showCustomAlert("Habit deleted successfully", "success");
      onClose();
    } catch (error) {
      showCustomAlert("Failed to delete habit", "danger");
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
          onPress={() => { }}
        >
          <View style={styles.headerRow}>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 20,
                color: Colors[theme].text,
              }}
            >
              Delete Habit
            </Text>
            <Pressable style={{ padding: 10 }} onPress={onClose}>
              <Feather name="x" color={Colors[theme].text} size={24} />
            </Pressable>
          </View>

          <Text
            style={{
              fontFamily: "NunitoRegular",
              fontSize: 16,
              color: Colors[theme].text_secondary,
              marginVertical: 20,
              textAlign: "center",
            }}
          >
            Are you sure you want to delete this habit? This action cannot be
            undone.
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
                  backgroundColor: Colors[theme].danger,
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
                  Delete
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DeleteHabitModal;

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
