import React from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";

import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";

const AddButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const theme = useColorScheme();
  return (
    <View style={{ bottom: 10, right: 20, zIndex: 3, position: "absolute" }}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: Colors[theme ?? "light"].primary,
          width: 50,
          height: 50,
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
