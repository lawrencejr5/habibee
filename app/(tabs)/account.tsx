import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";
import ToggleButton from "@/components/ToggleButton";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AccountInfoModal from "@/components/account/AccountInfoModal";
import DeleteAccountModal from "@/components/account/DeleteAccountModal";
import { useState } from "react";
import { router } from "expo-router";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useLoadingContext } from "@/context/LoadingContext";
import { useUser } from "@/context/UserContext";
import { useConvexAuth } from "convex/react";
import Loading from "@/components/Loading";

export default function Account() {
  const insets = useSafeAreaInsets();

  const { theme, toggleTheme } = useTheme();
  const haptics = useHapitcs();

  const { appLoading } = useLoadingContext();
  const { signedIn } = useUser();
  const { isLoading: authLoading } = useConvexAuth();
  const today = new Date().toLocaleDateString("en-CA");

  const [openAccountInfoModal, setOpenAccountInfoModal] =
    useState<boolean>(false);
  const [openDeleteAccountModal, setOpenDeleteAccountModal] =
    useState<boolean>(false);

  if (appLoading || authLoading || !signedIn) return <Loading />;

  return (
    <>
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ paddingBottom: 20 }}>
          <ThemedText style={styles.title}>Account</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => {
              haptics.impact();
              setOpenAccountInfoModal(true);
            }}
            style={{
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
              borderWidth: 3,
              borderRadius: 15,
              padding: 10,
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Image
              source={require("@/assets/images/avatar.png")}
              style={{
                height: 70,
                width: 70,
                borderRadius: 50,
                borderColor: Colors[theme].text,
                borderWidth: 2,
              }}
            />
            <View>
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  color: Colors[theme].text,
                  fontSize: 22,
                  textTransform: "capitalize",
                }}
              >
                {signedIn.fullname}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: 15,
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Feather
                    name="user"
                    size={14}
                    color={Colors[theme].text_secondary}
                  />

                  <Text
                    style={{
                      fontFamily: "NunitoMedium",
                      color: Colors[theme].text_secondary,
                      fontSize: 13,
                      textTransform: "lowercase",
                    }}
                  >
                    {signedIn.username}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Image
                    source={require("@/assets/icons/fire.png")}
                    style={{
                      height: 14,
                      width: 14,
                      tintColor:
                        signedIn.last_streak_date === today
                          ? undefined
                          : Colors[theme].text_secondary,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: "NunitoBold",
                      color:
                        signedIn.last_streak_date === today
                          ? Colors[theme].accent1
                          : Colors[theme].text_secondary,
                      fontSize: 12,
                    }}
                  >
                    {signedIn.streak ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          <View style={{ marginTop: 30 }}>
            {/* Personal */}
            <View style={{ marginTop: 10 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Feather
                  name="settings"
                  size={18}
                  color={Colors[theme].text_secondary}
                />
                <Text
                  style={{
                    color: Colors[theme].text_secondary,
                    fontFamily: "NunitoBold",
                    fontSize: 16,
                  }}
                >
                  Personal & Account
                </Text>
              </View>

              <View
                style={[
                  styles.settingsContainer,
                  {
                    backgroundColor: Colors[theme].surface,
                    borderColor: Colors[theme].border,
                  },
                ]}
              >
                <Pressable
                  onPress={() => {
                    haptics.impact();
                    router.push("/account/personal_info");
                  }}
                  style={[styles.row]}
                >
                  <Feather
                    name="user"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Personal Information
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>

                <Pressable
                  onPress={() => {
                    haptics.impact();
                    router.push("/account/update_password");
                  }}
                  style={[styles.row]}
                >
                  <Feather
                    name="lock"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Change Password
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    haptics.impact();
                    setOpenDeleteAccountModal(true);
                  }}
                  style={[styles.row]}
                >
                  <Feather
                    name="trash"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Delete Account
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
              </View>
            </View>

            {/* Preferences */}
            <View style={{ marginTop: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Feather
                  name="settings"
                  size={18}
                  color={Colors[theme].text_secondary}
                />
                <Text
                  style={{
                    color: Colors[theme].text_secondary,
                    fontFamily: "NunitoBold",
                    fontSize: 16,
                  }}
                >
                  Preferences
                </Text>
              </View>

              <View
                style={[
                  styles.settingsContainer,
                  {
                    backgroundColor: Colors[theme].surface,
                    borderColor: Colors[theme].border,
                  },
                ]}
              >
                <View style={[styles.row]}>
                  <Feather
                    name="sun"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Dark Mode
                  </ThemedText>
                  <ToggleButton
                    isOn={theme === "dark"}
                    onToggle={() => {
                      toggleTheme();
                      haptics.impact();
                    }}
                  />
                </View>
                <View style={[styles.row]}>
                  <Feather
                    name="activity"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Haptic Feedback
                  </ThemedText>
                  <ToggleButton
                    isOn={haptics.enabled}
                    onToggle={() => {
                      haptics.toggleHaptics();
                      haptics.impact();
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Support */}
            <View style={{ marginTop: 10 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Feather
                  name="settings"
                  size={18}
                  color={Colors[theme].text_secondary}
                />
                <Text
                  style={{
                    color: Colors[theme].text_secondary,
                    fontFamily: "NunitoBold",
                    fontSize: 16,
                  }}
                >
                  Support
                </Text>
              </View>

              <View
                style={[
                  styles.settingsContainer,
                  {
                    backgroundColor: Colors[theme].surface,
                    borderColor: Colors[theme].border,
                  },
                ]}
              >
                <Pressable
                  onPress={() => {
                    haptics.impact();
                    router.push("/account/feedback");
                  }}
                  style={[styles.row]}
                >
                  <Feather
                    name="help-circle"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Help & Feedback
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
              </View>
            </View>

            {/* About */}
            <View style={{ marginTop: 10 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Feather
                  name="settings"
                  size={18}
                  color={Colors[theme].text_secondary}
                />
                <Text
                  style={{
                    color: Colors[theme].text_secondary,
                    fontFamily: "NunitoBold",
                    fontSize: 16,
                  }}
                >
                  App Info
                </Text>
              </View>

              <View
                style={[
                  styles.settingsContainer,
                  {
                    backgroundColor: Colors[theme].surface,
                    borderColor: Colors[theme].border,
                  },
                ]}
              >
                <Pressable
                  onPress={() => haptics.impact()}
                  style={[styles.row]}
                >
                  <Feather
                    name="info"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    About Habibee
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => haptics.impact()}
                  style={[styles.row]}
                >
                  <Feather
                    name="file-text"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Terms & Conditions
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => haptics.impact()}
                  style={[styles.row]}
                >
                  <Feather
                    name="shield"
                    size={18}
                    color={Colors[theme].text_secondary}
                    style={styles.icon}
                  />
                  <ThemedText
                    style={[styles.rowText, { color: Colors[theme].text }]}
                  >
                    Privacy Policy
                  </ThemedText>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={Colors[theme].text_secondary}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
      <AccountInfoModal
        visible={openAccountInfoModal}
        setVisible={setOpenAccountInfoModal}
      />
      <DeleteAccountModal
        visible={openDeleteAccountModal}
        setVisible={setOpenDeleteAccountModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontFamily: "NunitoBold",
  },
  settingsContainer: {
    width: "100%",
    paddingVertical: 6,
    overflow: "hidden",
    borderRadius: 15,
    borderWidth: 3,
    marginTop: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 5,
  },
  icon: {
    width: 28,
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    fontFamily: "NunitoMedium",
    fontSize: 16,
  },
});
