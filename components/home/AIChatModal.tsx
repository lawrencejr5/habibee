import React, {
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, View, TextInput, Dimensions, Keyboard } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { Image } from "react-native";

import Colors from "@/constants/Colors";
import { Text as ThemedText } from "../Themed";

import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AIChatModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}
type AiChatMsgType = { role: "user" | "model"; parts: { text: string }[] };

const { width } = Dimensions.get("window");

const AIChatModal: FC<AIChatModalProps> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { signedIn } = useUser();
  const { showCustomAlert } = useCustomAlert();

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<AiChatMsgType[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);

  const generate_habit = useAction(api.habits.generate_habit_ai);

  const sendMessage = async () => {
    setGenerating(true);
    haptics.impact();
    try {
      const new_message = { role: "user", parts: [{ text: input }] };
      setMessages((prev: any) => {
        return [...prev, new_message];
      });
      await generate_habit({ messages });
    } catch (err: any) {
      showCustomAlert("An error occured", "danger");
    } finally {
      setGenerating(false);
    }
  };

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  // Use the Habibee orange or your primary theme color
  const accentColor = Colors[theme].primary;

  // Suggested actions data
  const suggestions = [
    {
      id: 1,
      icon: "lightning-bolt-outline", // MaterialCommunityIcons
      label: "Generate new habits",
      prompt: "Can you help me generate some healthy habits?",
    },
    {
      id: 2,
      icon: "chart-timeline-variant", // MaterialCommunityIcons
      label: "Analyze my progress",
      prompt: "Analyze my current habit streaks and progress.",
    },
    {
      id: 3,
      icon: "fire", // MaterialCommunityIcons
      label: "Get motivation",
      prompt: "I'm feeling unmotivated, give me a pep talk.",
    },
    {
      id: 4,
      icon: "clock-outline", // MaterialCommunityIcons
      label: "Optimize routine",
      prompt: "How can I optimize my daily routine?",
    },
  ];

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      keyboardBehavior="interactive"
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onClose={() => setVisible(false)}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 4,
        backgroundColor: Colors[theme].border,
        marginTop: 10,
        opacity: 0.5,
      }}
    >
      <BottomSheetView style={{ flex: 1, height: "100%" }}>
        <View
          style={{
            flex: 1,
            height: "100%",
            backgroundColor: Colors[theme].background,
          }}
        >
          {/* Main Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 100, // Space for sticky input
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Image
                  source={require("../../assets/images/ai-icon.png")}
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: 12, // Slightly squarer for modern look
                  }}
                />
                <ThemedText
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 18,
                  }}
                >
                  Habibee AI
                </ThemedText>
              </View>

              <Pressable
                style={{
                  paddingHorizontal: 8,
                  paddingBottom: 8,
                }}
                onPress={() => {
                  haptics.impact();
                  bottomSheetRef.current?.close();
                }}
              >
                <Feather
                  name="chevron-down"
                  size={30}
                  color={Colors[theme].text}
                />
              </Pressable>
            </View>

            {/* Greeting & Suggestions Area */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 20,
                marginTop: -40,
              }}
            >
              {/* Greeting */}
              <View style={{ marginBottom: 40, alignItems: "flex-start" }}>
                <ThemedText
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 28,
                    textAlign: "left",
                    marginBottom: 5,
                    textTransform: "capitalize",
                  }}
                >
                  Hey, {signedIn?.username}! 👋
                </ThemedText>
                <ThemedText
                  style={{
                    fontFamily: "NunitoRegular",
                    fontSize: 16,
                    color: Colors[theme].text_secondary,
                    textAlign: "left",
                  }}
                >
                  How can I help you stay on track today?
                </ThemedText>
              </View>

              {/* Suggestions Grid */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 15,
                  justifyContent: "center",
                }}
              >
                {messages.length === 0 ? (
                  suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        haptics.impact();
                        setInput(item.prompt);
                      }}
                      style={({ pressed }) => ({
                        width: (width - 60) / 2, // 2 columns with padding calc
                        aspectRatio: 1.1, // Slightly taller than square
                        backgroundColor: Colors[theme].surface,
                        borderRadius: 20,
                        padding: 15,
                        justifyContent: "space-between",
                        borderWidth: 1,
                        borderColor: pressed
                          ? accentColor
                          : Colors[theme].border,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      })}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          backgroundColor: accentColor + "15", // 15% opacity orange
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={accentColor}
                        />
                      </View>
                      <ThemedText
                        style={{
                          fontFamily: "NunitoBold",
                          fontSize: 15,
                          lineHeight: 20,
                        }}
                      >
                        {item.label}
                      </ThemedText>
                    </Pressable>
                  ))
                ) : (
                  <></>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Input Area - Fixed at bottom */}
          <KeyboardStickyView
            style={{
              position: "absolute",
              bottom: insets.bottom - 20,
              width: "100%",
              backgroundColor: Colors[theme].background,
              paddingVertical: 10,
            }}
            offset={{ opened: 60, closed: 0 }} // Adjusted for bottom sheet
          >
            <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
              <View
                style={{
                  width: "100%",
                  minHeight: 50,
                  padding: 5,
                  paddingHorizontal: 15,
                  backgroundColor: Colors[theme].surface,
                  borderColor: Colors[theme].border,
                  borderWidth: 1.5,
                  borderRadius: 25,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: "transparent",
                    fontFamily: "NunitoBold",
                    color: Colors[theme].text,
                    paddingVertical: 10,
                  }}
                  placeholder="Ask Habibee anything..."
                  placeholderTextColor={Colors[theme].text_secondary}
                  value={input}
                  onChangeText={setInput}
                />

                <Pressable
                  onPress={sendMessage}
                  style={{
                    backgroundColor: accentColor + "cc",
                    width: 35,
                    height: 35,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: 10,
                  }}
                >
                  <Image
                    source={require("../../assets/icons/send.png")}
                    style={{
                      width: 16,
                      height: 16,
                      tintColor: "white",
                    }}
                  />
                </Pressable>
              </View>
            </View>
          </KeyboardStickyView>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default AIChatModal;
