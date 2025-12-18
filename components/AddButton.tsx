import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface AddButtonProps {
  onPress: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ onPress }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        bottom: 0,
        right: 20,
        zIndex: 3,
        position: "absolute",
        height: "auto",
        backgroundColor: Colors[theme].background,
        borderColor: Colors[theme].border,
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 25,
        paddingHorizontal: 5,
        gap: 15,
      }}
    >
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: Colors[theme ?? "light"].primary,
          width: 45,
          height: 45,
          borderRadius: 35,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <Image
          source={require("@/assets/images/ai-icon.png")}
          style={{ height: 40, width: 40, borderRadius: 25 }}
        />
      </Pressable>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: Colors[theme ?? "light"].primary,
          width: 45,
          height: 45,
          borderRadius: 35,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <Feather name="plus" color={"#fff"} size={30} />
      </Pressable>
    </View>
  );
};

export default AddButton;

const styles = StyleSheet.create({});
