import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import React, { useState } from "react";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "react-native";

import CustomInput from "@/components/auth/CustomInput";

const SigninPage = () => {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          alignSelf: "flex-start",
          marginVertical: 20,
          marginHorizontal: 5,
        }}
      >
        <Image
          source={require("@/assets/images/name-logo-black.png")}
          style={{
            width: 160,
            height: 40,
            alignSelf: "flex-start",
          }}
        />
        <Text
          style={{
            color: Colors[theme].text_secondary,
            fontFamily: "NunitoMedium",
            marginTop: 10,
          }}
        >
          Welcome back, we're happy to have u back
        </Text>
      </View>
      <View
        style={{
          width: "100%",
          backgroundColor: Colors[theme].surface,
          borderColor: Colors[theme].border,
          borderWidth: 3,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 20,
        }}
      >
        {/* Continue with google */}
        <View
          style={{
            backgroundColor: Colors[theme].text,
            paddingHorizontal: 20,
            paddingVertical: 7,
            borderRadius: 7,
            alignSelf: "center",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            source={require("@/assets/icons/google.png")}
            style={{ height: 20, width: 20 }}
          />
          <Text
            style={{
              color: Colors[theme].background,
              fontFamily: "NunitoBold",
            }}
          >
            Continue with google
          </Text>
        </View>
        {/* ---- OR ---- */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 20,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: Colors[theme].border,
            }}
          />
          <Text
            style={{
              marginHorizontal: 10,
              color: Colors[theme].text_secondary,
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            OR
          </Text>
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: Colors[theme].border,
            }}
          />
        </View>

        {/* Text inputs */}

        <View>
          <CustomInput
            title="Email/Username:"
            value={username}
            setValue={setUsername}
            placeHolder="Email or Username"
          />
          <CustomInput
            title="Password:"
            value={password}
            setValue={setPassword}
            placeHolder="Password"
            password={true}
          />

          <Pressable
            style={{
              backgroundColor: Colors[theme].primary,
              paddingVertical: 7,
              marginVertical: 20,
              width: "75%",
              alignSelf: "center",
              borderRadius: 7,
            }}
          >
            <Text
              style={{
                color: Colors[theme].text,
                textAlign: "center",
                fontFamily: "NunitoBold",
              }}
            >
              Signin
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default SigninPage;

const styles = StyleSheet.create({});
