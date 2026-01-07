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

const UpdatePassword = () => {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();

  const [oldPass, setOldPass] = useState<string>("");
  const [newPass, setNewPass] = useState<string>("");
  const [confirmPass, setConfirmPass] = useState<string>("");

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
          Update password
        </Text>
      </Pressable>
    </ThemedView>
  );
};

export default UpdatePassword;

const styles = StyleSheet.create({});
