import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";

interface AddButtonProps {
  onPress: () => void;
  onAiPress: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ onPress, onAiPress }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

  const [showBtns, setShowBtns] = useState<boolean>(false);

  const toggleBtns = () => {
    haptics.impact();
    setShowBtns((prev) => !prev);
  };

  return (
    <View
      style={{
        bottom: 10,
        right: 20,
        zIndex: 3,
        position: "absolute",
        height: "auto",
        backgroundColor: Colors[theme].background,
        borderColor: Colors[theme].border,
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 50,
        paddingVertical: 5,
        paddingHorizontal: 5,
        gap: 15,
      }}
    >
      {showBtns && (
        <>
          <Pressable
            onPress={onAiPress}
            style={{
              backgroundColor: Colors[theme].primary,
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
        </>
      )}

      <Pressable
        onPress={toggleBtns}
        style={{
          width: 45,
          height: 45,
          borderRadius: 35,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={
            showBtns
              ? require("@/assets/icons/times.png")
              : require("@/assets/icons/bars.png")
          }
          style={{
            height: showBtns ? 15 : 20,
            width: showBtns ? 15 : 20,
            tintColor: Colors[theme].text,
          }}
        />
      </Pressable>
    </View>
  );
};

export default AddButton;

const styles = StyleSheet.create({});
