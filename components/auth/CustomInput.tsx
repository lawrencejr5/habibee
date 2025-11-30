import { StyleSheet, Text, TextInput, View } from "react-native";
import React, { Dispatch, FC, SetStateAction } from "react";

import Colors from "@/constants/Colors";
import { useColorScheme } from "../useColorScheme";

interface CustomInputProps {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  title: string;
  placeHolder: string;
  password?: boolean;
}

const CustomInput: FC<CustomInputProps> = ({
  value,
  setValue,
  title,
  placeHolder,
  password = false,
}) => {
  const theme = useColorScheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontFamily: "NunitoMedium", color: Colors[theme].text }}>
        {title}
      </Text>
      <View
        style={{
          borderColor: Colors[theme].border,
          borderWidth: 3,
          marginTop: 10,
          paddingHorizontal: 10,
          borderRadius: 5,
        }}
      >
        <TextInput
          placeholder={placeHolder}
          secureTextEntry={password}
          value={value}
          onChangeText={setValue}
          style={{
            fontFamily: "NunitoMedium",
            color: Colors[theme].text,
          }}
        />
      </View>
    </View>
  );
};

export default CustomInput;

const styles = StyleSheet.create({});
