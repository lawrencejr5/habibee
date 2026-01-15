import {
  Pressable,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";

import * as Haptics from "expo-haptics";

import { View as ThemedView, Text as ThemedText } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

import CustomInput from "@/components/account/CustomInput";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCustomAlert } from "@/context/AlertContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/context/UserContext";


const PersonalInfo = () => {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  const { signedIn } = useUser();
  const { showCustomAlert } = useCustomAlert();
  const updateUserDetails = useMutation(api.users.update_user_details);
  const [isLoading, setIsLoading] = useState(false);

  const [fullname, setFullname] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (signedIn) {
      setFullname(signedIn.fullname || "");
      setUsername(signedIn.username || "");
      setEmail(signedIn.email || "");
    }
  }, [signedIn]);

  const handleSave = async () => {
    if (!fullname || !username) {
      showCustomAlert("Please fill in all fields", "warning");
      return;
    }
    setIsLoading(true);
    try {
      await updateUserDetails({
        fullname: fullname.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      });
      showCustomAlert("Profile updated successfully", "success");
      router.back();
    } catch (err: any) {
      const message =
        err.message || (typeof err === "string" ? err : "") || JSON.stringify(err);
      showCustomAlert("Failed to update profile", "danger");
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
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "transparent" }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <Pressable
          style={{ padding: 10, paddingLeft: 0 }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <FontAwesome6
            name="arrow-left"
            color={Colors[theme].text}
            size={24}
          />
        </Pressable>
        <ScrollView>
          <ThemedText
            style={{ fontFamily: "NunitoBold", fontSize: 20, marginTop: 10 }}
          >
            Personal Details
          </ThemedText>
          <Text
            style={{
              fontFamily: "NunitoLight",
              color: Colors[theme].text_secondary,
              fontSize: 14,
            }}
          >
            Edit your personal details and save changes
          </Text>
          <View style={{ marginTop: 5, flex: 1 }}>
            <CustomInput
              label="Full name"
              placeholder="Type new name"
              value={fullname}
              setValue={setFullname}
            />
            <CustomInput
              label="Username"
              placeholder="Type new username"
              value={username}
              setValue={setUsername}
            />
            <CustomInput
              label="Email"
              placeholder="Type new email"
              value={email}
              setValue={setEmail}
              disabled={true}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Pressable
        onPress={handleSave}
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
          {isLoading ? "Saving..." : "Save Changes"}
        </Text>
      </Pressable>
    </ThemedView>
  );
};

export default PersonalInfo;

const styles = StyleSheet.create({});
