import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCustomAlert } from "@/context/AlertContext";

import * as Haptics from "expo-haptics";

import { View as ThemedView, Text as ThemedText } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

import CustomInput from "@/components/account/CustomInput";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";

const FeedbackPage = () => {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  const { showCustomAlert } = useCustomAlert();
  const sendFeedback = useMutation(api.feedback.send_feedback);

  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      showCustomAlert("Please enter a message", "warning");
      return;
    }

    setIsLoading(true);
    try {
      await sendFeedback({ message: message.trim() });
      showCustomAlert("Feedback sent! Thank you.", "success");
      setMessage("");
      router.back();
    } catch (err: any) {
      const errorMsg =
        err.message || (typeof err === "string" ? err : "") || JSON.stringify(err);
      showCustomAlert("Failed to send feedback: " + errorMsg, "danger");
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
      <ThemedText
        style={{ fontFamily: "NunitoBold", fontSize: 20, marginTop: 10 }}
      >
        Help and Feedback
      </ThemedText>
      <Text
        style={{
          fontFamily: "NunitoLight",
          color: Colors[theme].text_secondary,
          fontSize: 14,
        }}
      >
        Send your feedback to help us improve
      </Text>
      <View style={{ marginTop: 5, flex: 1 }}>
        <CustomInput
          label="Feedback"
          placeholder="Describe your issue or message..."
          big={true}
          value={message}
          setValue={setMessage}
        />
      </View>
      <Pressable
        onPress={handleSubmit}
        disabled={isLoading}
        style={{
          width: "100%",
          backgroundColor: Colors[theme].primary,
          paddingVertical: 15,
          borderRadius: 50,
          opacity: isLoading ? 0.7 : 1,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#eee" size="small" />
        ) : (
          <Text
            style={{
              fontFamily: "NunitoBold",
              fontSize: 16,
              color: "#eee",
              textAlign: "center",
            }}
          >
            Send
          </Text>
        )}
      </Pressable>
    </ThemedView>
  );
};

export default FeedbackPage;

const styles = StyleSheet.create({});
