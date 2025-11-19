import React, { Dispatch, SetStateAction } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";

import Colors from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View as ThemedView } from "../Themed";

import * as Haptics from "expo-haptics";

const AddModal: React.FC<{
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ visible, setVisible }) => {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();

  const close = () => {
    setVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <ThemedView
        style={{ flex: 1, paddingTop: insets.top, paddingHorizontal: 20 }}
      >
        <Pressable style={{ marginTop: 20 }} onPress={close}>
          <FontAwesome
            name="times"
            color={Colors[theme ?? "light"].text}
            size={24}
            style={{ textAlign: "right" }}
          />
        </Pressable>
        <Text>New habit</Text>
      </ThemedView>
    </Modal>
  );
};

export default AddModal;

const styles = StyleSheet.create({});
