import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { View as ThemedView } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { useHapitcs } from "@/context/HapticsContext";

const AddUsername = () => {
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { theme } = useTheme();

  const [username, setUsername] = useState<string>("");

  return (
    <ThemedView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 20,
      }}
    >
      <Pressable
        style={{ padding: 10, paddingLeft: 0 }}
        onPress={() => {
          haptics.impact("light");
          router.back();
        }}
      >
        <FontAwesome6 name="arrow-left" color={Colors[theme].text} size={24} />
      </Pressable>

      <View style={{ marginTop: 10 }}>
        <Text
          style={{
            fontFamily: "NunitoExtraBold",
            fontSize: 24,
            color: Colors[theme].text,
          }}
        >
          Add Username
        </Text>
        <Text
          style={{
            fontFamily: "NunitoRegular",
            fontSize: 14,
            color: Colors[theme].text_secondary,
          }}
        >
          Add a unique username of your choice.
        </Text>
      </View>

      <View style={{ marginBottom: 10, paddingTop: 20, flex: 1 }}>
        <View
          style={{
            backgroundColor: Colors[theme].surface,
            borderColor: Colors[theme].border,
            borderWidth: 3,
            marginTop: 10,
            paddingHorizontal: 10,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Image
            source={require("@/assets/icons/user.png")}
            style={{
              width: 15,
              height: 15,
              tintColor: Colors[theme].text_secondary,
            }}
          />
          <TextInput
            placeholder={"Username"}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            style={{
              fontFamily: "NunitoMedium",
              fontSize: 16,
              color: Colors[theme].text,
              width: "100%",
            }}
          />
        </View>
      </View>

      <Pressable
        style={{
          backgroundColor: Colors[theme].primary,
          padding: 15,
          borderRadius: 50,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "#eee",
            fontFamily: "NunitoBold",
          }}
        >
          Continue
        </Text>
      </Pressable>
    </ThemedView>
  );
};

export default AddUsername;

const styles = StyleSheet.create({});
