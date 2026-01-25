import { ActivityIndicator, Pressable, Text, View } from "react-native";
import React, { useState } from "react";

import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "react-native";

import Colors from "@/constants/Colors";
import CustomInput from "@/components/auth/CustomInput";
import { Link, router } from "expo-router";

import { useAuthActions } from "@convex-dev/auth/react";
import { useCustomAlert } from "@/context/AlertContext";
import { useTheme } from "@/context/ThemeContext";

const ResetPasswordPage = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showCustomAlert } = useCustomAlert();
  const { signIn } = useAuthActions();

  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const handleSendCode = async () => {
    if (!email) {
      showCustomAlert("Please enter your email", "warning");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", { email: email.trim(), flow: "reset" });
      showCustomAlert("Code sent to your email", "success");
      setStep("otp");
    } catch (err: any) {
      showCustomAlert("Failed to send code, invalid email", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (code.length < 6) {
      showCustomAlert("Please enter a valid code", "warning");
      return;
    }

    setStep("password");
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showCustomAlert("Please fill in all fields", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showCustomAlert("Passwords do not match", "danger");
      return;
    }
    if (newPassword.length < 6) {
      showCustomAlert("Password must be at least 6 characters", "warning");
      return;
    }

    setLoading(true);
    try {
      await signIn("password", {
        email: email.trim(),
        code,
        newPassword,
        flow: "reset-verification",
      });
      showCustomAlert("Password reset successfully", "success");
      router.replace("/(auth)/signin");
    } catch (err: any) {
      console.error("Reset Verification Error:", err);
      // If it fails here, it's likely an invalid code or other issue
      showCustomAlert("Failed to reset password. Invalid otp", "danger");
      if (err.message?.includes("code") || err.message?.includes("otp")) {
        setStep("otp");
      }
    } finally {
      setLoading(false);
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
          {step === "email" && "Reset your password to get back in"}
          {step === "otp" && "Enter the 6-digit code sent to your email"}
          {step === "password" && "Create a new strong password"}
        </Text>
      </View>

      <KeyboardStickyView
        style={{ paddingHorizontal: 10, width: "100%" }}
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
          <Text
            style={{
              color: Colors[theme].text,
              fontFamily: "NunitoBold",
              fontSize: 20,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Password Reset
          </Text>

          {step === "email" && (
            <View>
              <CustomInput
                title="Email:"
                icon={require("@/assets/icons/envelope.png")}
                value={email}
                setValue={setEmail}
                placeHolder="Enter your email"
              />
              <Pressable
                onPress={handleSendCode}
                disabled={loading}
                style={{
                  backgroundColor: Colors[theme].primary,
                  paddingVertical: 10,
                  marginTop: 20,
                  marginBottom: 10,
                  width: "75%",
                  alignSelf: "center",
                  borderRadius: 7,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={"#fff"} />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontFamily: "NunitoBold",
                    }}
                  >
                    Send Code
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {step === "otp" && (
            <View>
              <CustomInput
                title="OTP Code:"
                icon={require("@/assets/icons/lock.png")}
                value={code}
                setValue={setCode}
                placeHolder="6-digit code"
              />
              <Pressable
                onPress={handleVerifyOtp}
                disabled={loading}
                style={{
                  backgroundColor: Colors[theme].primary,
                  paddingVertical: 10,
                  marginTop: 20,
                  marginBottom: 10,
                  width: "75%",
                  alignSelf: "center",
                  borderRadius: 7,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontFamily: "NunitoBold",
                  }}
                >
                  Continue
                </Text>
              </Pressable>

              <View style={{ gap: 10, marginTop: 5 }}>
                <Pressable onPress={handleSendCode} disabled={loading}>
                  <Text
                    style={{
                      color: Colors[theme].accent1,
                      textAlign: "center",
                      fontFamily: "NunitoMedium",
                      fontSize: 13,
                    }}
                  >
                    Resend Code
                  </Text>
                </Pressable>

                <Pressable onPress={() => setStep("email")}>
                  <Text
                    style={{
                      color: Colors[theme].text_secondary,
                      textAlign: "center",
                      fontFamily: "NunitoRegular",
                      fontSize: 13,
                    }}
                  >
                    Change Email
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {step === "password" && (
            <View>
              <CustomInput
                title="New Password:"
                icon={require("@/assets/icons/lock.png")}
                value={newPassword}
                setValue={setNewPassword}
                placeHolder="New password"
                password={true}
              />
              <CustomInput
                title="Confirm Password:"
                icon={require("@/assets/icons/lock.png")}
                value={confirmPassword}
                setValue={setConfirmPassword}
                placeHolder="Confirm password"
                password={true}
              />
              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                style={{
                  backgroundColor: Colors[theme].primary,
                  paddingVertical: 10,
                  marginTop: 20,
                  marginBottom: 10,
                  width: "75%",
                  alignSelf: "center",
                  borderRadius: 7,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={"#fff"} />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontFamily: "NunitoBold",
                    }}
                  >
                    Reset Password
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => setStep("otp")}>
                <Text
                  style={{
                    color: Colors[theme].text_secondary,
                    textAlign: "center",
                    fontFamily: "NunitoRegular",
                    fontSize: 13,
                  }}
                >
                  Back to OTP
                </Text>
              </Pressable>
            </View>
          )}

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
              Remembered your password?
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
      </KeyboardStickyView>
    </View>
  );
};

export default ResetPasswordPage;
