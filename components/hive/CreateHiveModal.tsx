import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
// import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View as ThemedView } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Image } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

interface CreateHiveModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const CreateHiveModal: React.FC<CreateHiveModalProps> = ({
  visible,
  setVisible,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const createHive = useMutation(api.hive.create_hive);

  const close = () => {
    haptics.impact();
    setName("");
    setCreatedCode(null);
    setVisible(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showCustomAlert("Enter a name for your hive", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await createHive({ name: name.trim() });
      setCreatedCode(result.code);
      showCustomAlert("Hive created!", "success");
    } catch (err: any) {
      showCustomAlert(err.message || "Failed to create hive", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (createdCode) {
      haptics.impact();
      // await Clipboard.setStringAsync(createdCode);
      showCustomAlert("Code copied!", "success");
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        close();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="slide">
      <ThemedView
        style={{
          flex: 1,
          paddingTop: insets.top + 10,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 50,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: Colors[theme].text,
              fontFamily: "NunitoExtraBold",
              fontSize: 26,
            }}
          >
            Create a Hive
          </Text>
          <Pressable
            style={{
              backgroundColor: Colors[theme].surface,
              padding: 7,
              borderWidth: 3,
              borderColor: Colors[theme].border,
              borderRadius: 50,
            }}
            onPress={close}
          >
            <Feather name="x" color={Colors[theme].text} size={25} />
          </Pressable>
        </View>

        {!createdCode ? (
          // ── Create Form ──
          <KeyboardStickyView
            style={{ flex: 1, justifyContent: "center" }}
            offset={{ opened: 200, closed: insets.bottom }}
          >
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Image
                source={require("@/assets/icons/hive.png")}
                style={{
                  width: 150,
                  height: 150,
                  tintColor: Colors[theme].border,
                }}
              />
            </View>
            <Text
              style={{
                fontFamily: "NunitoBold",
                fontSize: 16,
                color: Colors[theme].text_secondary,
                marginBottom: 10,
              }}
            >
              Name your hive
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Colors[theme].surface,
                borderRadius: 14,
                paddingHorizontal: 15,
                paddingVertical: 5,
                borderWidth: 3,
                borderColor: Colors[theme].border,
              }}
            >
              <Feather
                name="hexagon"
                size={20}
                color={Colors[theme].text_secondary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                placeholder="e.g. Morning Warriors"
                placeholderTextColor={Colors[theme].text_secondary}
                value={name}
                onChangeText={setName}
                autoFocus
                style={{
                  flex: 1,
                  fontFamily: "NunitoMedium",
                  fontSize: 15,
                  color: Colors[theme].text,
                }}
              />
            </View>

            <Pressable
              onPress={handleCreate}
              disabled={loading}
              style={{
                marginTop: 25,
                backgroundColor: Colors[theme].primary,
                paddingVertical: 15,
                borderRadius: 50,
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#eee" size="small" />
              ) : (
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 16,
                    color: "#eee",
                    textAlign: "center",
                  }}
                >
                  Create Hive
                </Text>
              )}
            </Pressable>
          </KeyboardStickyView>
        ) : (
          // ── Success: show code ──
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <View
              style={{
                backgroundColor: Colors[theme].primary + "15",
                padding: 20,
                borderRadius: 20,
                alignItems: "center",
                width: "100%",
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 18,
                  color: Colors[theme].text,
                  marginBottom: 5,
                }}
              >
                🎉 Hive Created!
              </Text>
              <Text
                style={{
                  fontFamily: "NunitoRegular",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Share this code with your friends to join
              </Text>

              {/* Code display */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {createdCode.split("").map((char, i) => (
                  <View
                    key={i}
                    style={{
                      width: 44,
                      height: 52,
                      borderRadius: 12,
                      backgroundColor: Colors[theme].surface,
                      borderWidth: 2,
                      borderColor: Colors[theme].primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "NunitoExtraBold",
                        fontSize: 22,
                        color: Colors[theme].primary,
                      }}
                    >
                      {char}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={handleCopyCode}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: Colors[theme].primary,
                  paddingVertical: 12,
                  paddingHorizontal: 30,
                  borderRadius: 50,
                }}
              >
                <Feather name="copy" size={16} color="#fff" />
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 14,
                    color: "#fff",
                  }}
                >
                  Copy Code
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={close}
              style={{
                marginTop: 20,
                paddingVertical: 12,
                paddingHorizontal: 40,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: Colors[theme].border,
              }}
            >
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 14,
                  color: Colors[theme].text,
                }}
              >
                Done
              </Text>
            </Pressable>
          </View>
        )}
      </ThemedView>
    </Modal>
  );
};

export default CreateHiveModal;
