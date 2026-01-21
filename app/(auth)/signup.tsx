import { ActivityIndicator, Pressable, Text, View } from "react-native";
import React, { useState } from "react";

import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

import { KeyboardStickyView } from "react-native-keyboard-controller";

import { useAuthActions } from "@convex-dev/auth/react";

import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "react-native";

import CustomInput from "@/components/auth/CustomInput";
import { Link, router } from "expo-router";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";
import { ConvexError } from "convex/values";

WebBrowser.maybeCompleteAuthSession();

const SignUpPage = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { showCustomAlert } = useCustomAlert();

  const { signIn } = useAuthActions();

  const [fullname, setFullname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [flow, setFlow] = useState<"signIn" | "signUp">("signUp");
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setBtnLoading(true);
    try {
      if (!email || !fullname || !password) {
        showCustomAlert("Please fill in required fields", "warning");
        return;
      }

      const formData = new FormData();
      formData.append("fullname", fullname.trim().toLowerCase());
      formData.append("email", email.trim().toLowerCase());
      formData.append("password", password);
      formData.append("flow", flow);

      await signIn("password", formData);
      showCustomAlert("Signed up successfully", "success");
    } catch (err: any) {

      console.log("Registration Error:", JSON.stringify(err)); // Helpful for debugging in adb logcat

      if (err.data !== undefined) {
        showCustomAlert(err.data, "danger");
        return;
      }

      const message = err.message || err.toString();

      if (message.includes("already exists")) {
        showCustomAlert("Email already in use", "danger");
      } else {
        showCustomAlert("An unexpected error occurred", "danger");
      }
    } finally {
      setBtnLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    setGoogleLoading(true);
    try {
      // 1. Create the return URL (must match your app.json scheme)
      const redirectTo = makeRedirectUri({
        scheme: "com.lawrencejr.habibee",
        path: "(auth)/signup"
      });

      // 2. Start OAuth with Convex Auth, get redirect URL
      const { redirect } = await signIn("google", { redirectTo });
      if (!redirect) {
        throw new Error("Authentication redirect URL not found.");
      }

      // 3. Open browser session with dismissBrowser option
      // This prevents the redirect from creating a new screen
      const result = await WebBrowser.openAuthSessionAsync(
        redirect.toString(),
        redirectTo,
        {
          dismissButtonStyle: "close",
          showInRecents: false,
        }
      );

      if (result.type !== "success" || !result.url) {
        throw new Error("Authentication cancelled or failed.");
      }

      // 4. Extract ?code= from callback URL
      const code = new URL(result.url).searchParams.get("code");
      if (!code) {
        throw new Error("Authentication code not found in the URL.");
      }

      // 5. Complete sign‑in with the code
      const final = await signIn("google", { code });

      if (!final.signingIn) {
        throw new Error("Authentication failed. Please try again.");
      }

      // Keep loading state active - let the auth navigation handle the redirect
      // The loading will be visible while auth state updates and navigation occurs

    } catch (error) {
      console.log("Sign-in error", error);
      // Only reset loading on error
      setGoogleLoading(false);
      showCustomAlert("Sign-in failed. Please try again.", "danger");
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
          Signup now! Let's get the best out of you
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
            onPress={handleGoogleSignin}
            disabled={googleLoading || btnLoading}
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
              opacity: googleLoading ? 0.6 : 1,
            }}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#1f2428" />
            ) : (
              <Image
                source={require("@/assets/icons/google.png")}
                style={{ height: 20, width: 20 }}
              />
            )}
            <Text
              style={{
                color: "#1f2428",
                fontFamily: "NunitoBold",
              }}
            >
              {googleLoading ? "Signing in..." : "Continue with google"}
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
              title="Fullname:"
              icon={require("@/assets/icons/user.png")}
              value={fullname}
              setValue={setFullname}
              placeHolder="Fullname"
            />
            <CustomInput
              title="Email:"
              icon={require("@/assets/icons/envelope.png")}
              value={email}
              setValue={setEmail}
              placeHolder="Email"
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
                marginVertical: 20,
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
                  Signup
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
                Already have an account?
              </Text>
              <Link
                href={"/(auth)/signin"}
                style={{
                  color: Colors[theme].accent1,
                  fontFamily: "NunitoRegular",
                }}
              >
                Signin
              </Link>
            </View>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
};

export default SignUpPage;
