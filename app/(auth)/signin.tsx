import { ActivityIndicator, Pressable, Text, View } from "react-native";
import React, { useState } from "react";

import { KeyboardStickyView } from "react-native-keyboard-controller";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "react-native";

import CustomInput from "@/components/auth/CustomInput";
import { Link } from "expo-router";

import { useAuthActions } from "@convex-dev/auth/react";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";

const SigninPage = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showCustomAlert } = useCustomAlert();

  const { signIn } = useAuthActions();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setBtnLoading(true);
    try {
      if (!email || !password) {
        showCustomAlert("Please fill in required fields", "warning");
        return;
      }

      const formData = new FormData();
      formData.append("email", email.trim());
      formData.append("password", password);
      formData.append("flow", "signIn");

      await signIn("password", formData);
      showCustomAlert("Signed in successfully", "success");
    } catch (err) {
      showCustomAlert("An error occured", "danger");
    } finally {
      setBtnLoading(false);
    }
  };

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
          source={
            theme === "dark"
              ? require("@/assets/images/name-logo-black.png")
              : require("@/assets/images/name-logo-white.png")
          }
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
      <KeyboardStickyView
        style={{ paddingHorizontal: 10 }}
        offset={{ opened: 200, closed: insets.bottom }}
      >
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
          <Pressable
            style={{
              backgroundColor: "#fff",
              borderWidth: theme === "dark" ? 3 : 2,
              borderColor: Colors[theme].border,
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
                color: "#1f2428",
                fontFamily: "NunitoBold",
              }}
            >
              Continue with google
            </Text>
          </Pressable>
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
                height: theme === "dark" ? 4 : 2,
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
                height: theme === "dark" ? 4 : 2,
                backgroundColor: Colors[theme].border,
              }}
            />
          </View>

          {/* Text inputs */}

          <View>
            <CustomInput
              title="Email/Username:"
              icon={require("@/assets/icons/user.png")}
              value={email}
              setValue={setEmail}
              placeHolder="Email or Username"
            />
            <CustomInput
              title="Password:"
              icon={require("@/assets/icons/lock.png")}
              value={password}
              setValue={setPassword}
              placeHolder="Password"
              password={true}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={btnLoading}
              style={{
                backgroundColor: Colors[theme].primary,
                paddingVertical: 7,
                marginVertical: 15,
                width: "75%",
                alignSelf: "center",
                borderRadius: 7,
                opacity: btnLoading ? 0.5 : 1,
              }}
            >
              {btnLoading ? (
                <ActivityIndicator color={"#fff"} />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center", // This is optional since the Pressable is centering it
                    fontFamily: "NunitoBold",
                  }}
                >
                  Signin
                </Text>
              )}
            </Pressable>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: Colors[theme].text_secondary,
                  fontFamily: "NunitoRegular",
                }}
              >
                Don't have an account?
              </Text>
              <Link
                href={"/(auth)/signup"}
                style={{
                  color: Colors[theme].accent1,
                  fontFamily: "NunitoRegular",
                }}
              >
                Signup
              </Link>
            </View>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
};

export default SigninPage;
