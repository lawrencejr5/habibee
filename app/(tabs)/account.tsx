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
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AccountInfoModal from "@/components/account/AccountInfoModal";
import { useState } from "react";

export default function Account() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();

  const [openAccountInfoModal, setOpenAccountInfoModal] =
    useState<boolean>(false);

  return (
    <>
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={{ paddingBottom: 20 }}>
          <ThemedText style={styles.title}>Account</ThemedText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              style={{ height: 70, width: 70, borderRadius: 50 }}
            />
            <View>
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  color: Colors[theme].text,
                  fontSize: 22,
                }}
              >
                Oputa Lawrence
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
                    }}
                  >
                    lawrencejr
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
                    style={{ height: 14, width: 14 }}
                  />
                  <Text
                    style={{
                      fontFamily: "NunitoBold",
                      color: Colors[theme].accent1,
                      fontSize: 12,
                    }}
                  >
                    365
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
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
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
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
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
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
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
                    Dark / Light Mode
                  </ThemedText>
                  <ToggleButton
                    isOn={theme === "dark"}
                    onToggle={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
                    isOn={theme === "dark"}
                    onToggle={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
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
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
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
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
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
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }
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
