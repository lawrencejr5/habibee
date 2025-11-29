import React, { Dispatch, FC, SetStateAction } from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";

import { View as ThemedView, Text as ThemedText } from "@/components/Themed";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

interface CustomInputProps {
  label: string;
  placeholder: string;
  disabled?: boolean;
  password?: boolean;
  value: string;
  big?: boolean;
  setValue: Dispatch<SetStateAction<string>>;
}

const CustomInput: FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  setValue,
  disabled = false,
  password = false,
  big = false,
}) => {
  const theme = useColorScheme();

  return (
    <View style={{ marginTop: 25 }}>
      <ThemedText>{label}:</ThemedText>
      <View
        style={{
          backgroundColor: disabled
            ? Colors[theme].border
            : Colors[theme].surface,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 10,
          marginTop: 7,
          borderColor: Colors[theme].border,
          borderWidth: 2,
        }}
      >
        <TextInput
          placeholder={placeholder}
          value={value}
          editable={!disabled}
          secureTextEntry={password}
          onChangeText={setValue}
          multiline
          numberOfLines={12}
          textAlignVertical="top"
          style={{
            fontFamily: "NunitoMedium",
            color: Colors[theme].text,
            minHeight: big ? 200 : 0,
          }}
        />
      </View>
    </View>
  );
};

export default CustomInput;
