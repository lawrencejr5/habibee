import { TextInput, View, Pressable, Image } from "react-native";
import React, { Dispatch, FC, SetStateAction, useState } from "react";
import { Feather } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

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
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
          height: 45, // Add a consistent height so eye icon is perfectly centered
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
          secureTextEntry={password && !showPassword}
          autoCapitalize="none"
          value={value}
          placeholderTextColor={Colors[theme].text_secondary}
          onChangeText={setValue}
          style={{
            fontFamily: "NunitoMedium",
            color: Colors[theme].text,
            flex: 1,
            height: "100%",
          }}
        />
        {password && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={{
              padding: 5,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color={Colors[theme].text_secondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default CustomInput;
