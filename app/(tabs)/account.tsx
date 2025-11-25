import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Text as ThemedText, View as ThemedView } from "@/components/Themed";
import ToggleButton from "@/components/ToggleButton";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Account() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme();
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedText style={styles.title}>Account</ThemedText>

      <View
        style={{
          backgroundColor: Colors[theme].surface,
          borderColor: Colors[theme].border,
          borderWidth: 3,
          borderRadius: 15,
          padding: 10,
          marginTop: 20,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Image
            source={require("@/assets/images/avatar.png")}
            style={{ height: 70, width: 70, borderRadius: 50 }}
          />
          <View>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                color: Colors[theme].text,
                fontSize: 20,
              }}
            >
              Oputa Lawrence
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                alignItems: "center",
                marginTop: 5,
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoMedium",
                  color: Colors[theme].text_secondary,
                  fontSize: 14,
                }}
              >
                @lawrencejr
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Image
                  source={require("@/assets/icons/fire.png")}
                  style={{ height: 18, width: 18 }}
                />
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    color: Colors[theme].accent1,
                    fontSize: 16,
                    marginTop: 5,
                  }}
                >
                  365
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={{
            alignSelf: "center",
            padding: 2,
            borderRadius: 20,
            marginRight: 5,
          }}
        >
          <Image
            source={require("@/assets/icons/chevron-down.png")}
            style={{
              height: 20,
              width: 20,
              tintColor: Colors[theme].text_secondary,
            }}
          />
        </Pressable>
      </View>

      <View style={{ marginTop: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Feather
            name="settings"
            size={22}
            color={Colors[theme].text_secondary}
          />
          <Text
            style={{
              color: Colors[theme].text_secondary,
              fontFamily: "NunitoBold",
              fontSize: 18,
            }}
          >
            Settings
          </Text>
        </View>

        {/* Settings... */}
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
            style={styles.row}
          >
            <Feather
              name="user"
              size={18}
              color={Colors[theme].text_secondary}
              style={styles.icon}
            />
            <ThemedText style={[styles.rowText, { color: Colors[theme].text }]}>
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
            style={styles.row}
          >
            <Feather
              name="lock"
              size={18}
              color={Colors[theme].text_secondary}
              style={styles.icon}
            />
            <ThemedText style={[styles.rowText, { color: Colors[theme].text }]}>
              Change Password
            </ThemedText>
            <Feather
              name="chevron-right"
              size={18}
              color={Colors[theme].text_secondary}
            />
          </Pressable>

          <View style={styles.row}>
            <Feather
              name="sun"
              size={18}
              color={Colors[theme].text_secondary}
              style={styles.icon}
            />
            <ThemedText style={[styles.rowText, { color: Colors[theme].text }]}>
              Dark / Light Mode
            </ThemedText>
            <ToggleButton
              isOn={theme === "dark"}
              onToggle={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            />
          </View>

          <Pressable
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            }
            style={styles.row}
          >
            <Feather
              name="message-circle"
              size={18}
              color={Colors[theme].text_secondary}
              style={styles.icon}
            />
            <ThemedText style={[styles.rowText, { color: Colors[theme].text }]}>
              Help & Feedback
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
            style={styles.row}
          >
            <Feather
              name="info"
              size={18}
              color={Colors[theme].text_secondary}
              style={styles.icon}
            />
            <ThemedText style={[styles.rowText, { color: Colors[theme].text }]}>
              About
            </ThemedText>
            <Feather
              name="chevron-right"
              size={18}
              color={Colors[theme].text_secondary}
            />
          </Pressable>
        </View>
      </View>
    </ThemedView>
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
    borderWidth: 3,
    borderRadius: 12,
    paddingVertical: 6,
    marginTop: 20,
    overflow: "hidden",
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
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
