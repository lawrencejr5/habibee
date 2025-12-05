import { StyleSheet, Text, TextInput, View } from "react-native";
import React, { Dispatch, FC, SetStateAction } from "react";

import Colors from "@/constants/Colors";
import { useColorScheme } from "../useColorScheme";
import { Image } from "react-native";

interface CustomInputProps {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  title: string;
  icon: any;
  placeHolder: string;
  password?: boolean;
}

const CustomInput: FC<CustomInputProps> = ({
  value,
  setValue,
  icon,
  placeHolder,
  password = false,
}) => {
  const theme = useColorScheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <View
        style={{
          borderColor: Colors[theme].border,
          borderWidth: theme === "dark" ? 3 : 2,
          marginTop: 10,
          paddingHorizontal: 10,
          borderRadius: 5,
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
        }}
      >
        <Image
          source={icon}
          style={{
            width: 15,
            height: 15,
            tintColor: Colors[theme].text_secondary,
          }}
        />
        <TextInput
          placeholder={placeHolder}
          secureTextEntry={password}
          autoCapitalize="none"
          value={value}
          onChangeText={setValue}
          style={{
            fontFamily: "NunitoMedium",
            color: Colors[theme].text,
            width: "100%",
          }}
        />
      </View>
    </View>
  );
};

export default CustomInput;
