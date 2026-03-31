import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View as ThemedView } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KeyboardStickyView } from "react-native-keyboard-controller";

interface JoinHiveModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const CODE_LENGTH = 6;

const JoinHiveModal: React.FC<JoinHiveModalProps> = ({
  visible,
  setVisible,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const joinHive = useMutation(api.hive.join_hive);

  const close = () => {
    haptics.impact();
    setCode("");
    setVisible(false);
  };

  const handleJoin = async () => {
    if (code.length < CODE_LENGTH) {
      showCustomAlert("Enter the full 6-character code", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await joinHive({ code });
      showCustomAlert(`Joined "${result.name}"!`, "success");
      setCode("");
      setVisible(false);
    } catch (err: any) {
      showCustomAlert(err.message || "Invalid code", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const clean = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, CODE_LENGTH);
    setCode(clean);
  };

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

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
            Join a Hive
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

        <KeyboardStickyView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          offset={{ opened: 200, closed: insets.bottom }}
        >
          <Text
            style={{
              fontFamily: "NunitoBold",
              fontSize: 16,
              color: Colors[theme].text_secondary,
              marginBottom: 25,
              textAlign: "center",
            }}
          >
            Enter the 6-character hive code
          </Text>

          {/* Hidden TextInput for keyboard */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={CODE_LENGTH}
            autoCapitalize="characters"
            style={{ position: "absolute", opacity: 0 }}
          />

          {/* Code cells */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            style={{ flexDirection: "row", gap: 10, marginBottom: 30 }}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const char = code[i] || "";
              const isFocused = i === code.length && code.length < CODE_LENGTH;
              return (
                <View
                  key={i}
                  style={{
                    width: 48,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: Colors[theme].surface,
                    borderWidth: isFocused ? 2.5 : 2,
                    borderColor: isFocused
                      ? Colors[theme].primary
                      : char
                        ? Colors[theme].primary + "60"
                        : Colors[theme].border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "NunitoExtraBold",
                      fontSize: 24,
                      color: Colors[theme].text,
                    }}
                  >
                    {char}
                  </Text>
                  {isFocused && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 10,
                        width: 20,
                        height: 2.5,
                        borderRadius: 2,
                        backgroundColor: Colors[theme].primary,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </Pressable>

          <Pressable
            onPress={handleJoin}
            disabled={loading || code.length < CODE_LENGTH}
            style={{
              width: "100%",
              backgroundColor: Colors[theme].primary,
              paddingVertical: 15,
              borderRadius: 50,
              opacity: loading || code.length < CODE_LENGTH ? 0.5 : 1,
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
                Join Hive
              </Text>
            )}
          </Pressable>
        </KeyboardStickyView>
      </ThemedView>
    </Modal>
  );
};

export default JoinHiveModal;
