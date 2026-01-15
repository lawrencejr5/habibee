import {
  Pressable,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";

import * as Haptics from "expo-haptics";

import { View as ThemedView, Text as ThemedText } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

import CustomInput from "@/components/account/CustomInput";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";
import { useCustomAlert } from "@/context/AlertContext";

const UpdatePassword = () => {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  const { showCustomAlert } = useCustomAlert();
  const [isLoading, setIsLoading] = useState(false);

  const [oldPass, setOldPass] = useState<string>("");
  const [newPass, setNewPass] = useState<string>("");
  const [confirmPass, setConfirmPass] = useState<string>("");

  const handleUpdate = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      showCustomAlert("Please fill in all fields", "warning");
      return;
    }
    if (newPass !== confirmPass) {
      showCustomAlert("New passwords do not match", "warning");
      return;
    }
    if (newPass.length < 6) {
      showCustomAlert("Password must be at least 6 characters", "warning");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement backend password update mutation
      // For now, we simulate a delay and show a message
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showCustomAlert("Password update feature coming soon!", "warning");
    } catch (err) {
      showCustomAlert("Failed to update password", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView
      style={{
        flex: 1,
        paddingVertical: insets.top + 5,
        paddingHorizontal: 20,
      }}
    >
      <Pressable
        style={{ padding: 10, paddingLeft: 0 }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <FontAwesome6 name="arrow-left" color={Colors[theme].text} size={24} />
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "transparent" }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView>
          <ThemedText
            style={{ fontFamily: "NunitoBold", fontSize: 20, marginTop: 10 }}
          >
            Update Password
          </ThemedText>
          <Text
            style={{
              fontFamily: "NunitoLight",
              color: Colors[theme].text_secondary,
              fontSize: 14,
            }}
          >
            Change your password and save changes
          </Text>
          <View style={{ marginTop: 5, flex: 1 }}>
            <CustomInput
              label="Old Password"
              placeholder="Type your old password"
              value={oldPass}
              setValue={setOldPass}
              password={true}
            />
            <CustomInput
              label="New Password"
              placeholder="Type new password"
              value={newPass}
              setValue={setNewPass}
              password={true}
            />
            <CustomInput
              label="Confirm Password"
              placeholder="Confirm your new password"
              value={confirmPass}
              setValue={setConfirmPass}
              password={true}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Pressable
        onPress={handleUpdate}
        disabled={isLoading}
        style={{
          width: "100%",
          backgroundColor: Colors[theme].primary,
          paddingVertical: 15,
          borderRadius: 50,
          opacity: isLoading ? 0.7 : 1,
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
          {isLoading ? "Updating..." : "Update password"}
        </Text>
      </Pressable>
    </ThemedView>
  );
};

export default UpdatePassword;

const styles = StyleSheet.create({});
