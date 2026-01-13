import React, {
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  View,
  TextInput,
  Dimensions,
  Text,
  ActivityIndicator,
} from "react-native";
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
type AiChatMsgType = {
  role: "user" | "model";
  parts: { text: string }[];
  thoughtTime?: number;
};

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
    if (!input.trim()) return;

    setGenerating(true);
    haptics.impact();
    const startTime = Date.now();
    const userMsg = input; // Store input to use after clearing

    try {
      // Add user message immediately
      const new_message: AiChatMsgType = {
        role: "user",
        parts: [{ text: userMsg }]
      };

      setMessages((prev) => [...prev, new_message]);
      setInput(""); // Clear input immediately

      const response = await generate_habit({
        messages: [...messages, new_message].map(m => ({
          role: m.role,
          parts: m.parts
        }))
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const ai_message: AiChatMsgType = {
        role: "model",
        parts: [{ text: response }],
        thoughtTime: duration,
      };

      setMessages((prev) => [...prev, ai_message]);
    } catch (err: any) {
      showCustomAlert("An error occured", "danger");
      console.error(err);
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
                paddingHorizontal: 15,
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

            {/* Content Display */}
            {messages.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 20,
                  marginTop: 40,
                }}
              >
                <View style={{ marginBottom: 40, alignItems: "flex-start", width: "100%" }}>
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

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 15,
                    justifyContent: "center",
                  }}
                >
                  {suggestions.map((item) => (
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
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ paddingVertical: 20, paddingHorizontal: 15 }}>
                {messages.map((msg, index) => (
                  msg.role === "user" ? (
                    <UserChat key={index} text={msg.parts[0].text} />
                  ) : (
                    <ModelChat
                      key={index}
                      text={msg.parts[0].text}
                      thoughtTime={msg.thoughtTime}
                    />
                  )
                ))}

                {generating && (
                  <View
                    style={{
                      padding: 15,
                      borderRadius: 15,
                      alignSelf: "flex-start",
                    }}
                  >
                    <View
                      style={{
                        marginBottom: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View style={{ position: 'relative', width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={accentColor} style={{ position: 'absolute' }} />
                        <Image
                          source={require("@/assets/images/ai-icon.png")}
                          style={{ width: 20, height: 20, borderRadius: 10 }}
                        />
                      </View>
                      <Text
                        style={{
                          color: Colors[theme].text_secondary,
                          fontFamily: "NunitoBold",
                          fontSize: 12
                        }}
                      >
                        Thinking...
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
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
            <View style={{ paddingHorizontal: 15, paddingBottom: 10 }}>
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
                  onSubmitEditing={sendMessage}
                />

                <Pressable
                  onPress={sendMessage}
                  disabled={generating}
                  style={{
                    backgroundColor: generating ? Colors[theme].border : accentColor,
                    width: 35,
                    height: 35,
                    borderRadius: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: 10,
                  }}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Image
                      source={require("../../assets/icons/send.png")}
                      style={{
                        width: 16,
                        height: 16,
                        tintColor: "white",
                      }}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardStickyView>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const UserChat: FC<{ text: string }> = ({ text }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: Colors[theme].surface,
        maxWidth: "80%", // Limit width
        padding: 15,
        marginBottom: 20,
        borderRadius: 20,
        borderBottomRightRadius: 5, // Chat bubble effect
        alignSelf: "flex-end",
      }}
    >
      <Text
        style={{
          color: Colors[theme].text,
          fontFamily: "NunitoRegular",
          fontSize: 16
        }}
      >
        {text}
      </Text>
    </View>
  );
};

const ModelChat: FC<{ text: string, thoughtTime?: number }> = ({ text, thoughtTime }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        padding: 5,
        borderRadius: 15,
        alignSelf: "flex-start",
        marginBottom: 20,
        maxWidth: "100%"
      }}
    >
      <View
        style={{
          marginBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Image
          source={require("@/assets/images/ai-icon.png")}
          style={{ width: 24, height: 24, borderRadius: 10 }}
        />
        {thoughtTime !== undefined && (
          <Text
            style={{
              color: Colors[theme].text_secondary,
              fontFamily: "NunitoBold",
              fontSize: 12
            }}
          >
            Thought for {thoughtTime.toFixed(1)}s
          </Text>
        )}
      </View>
      <View style={{ paddingLeft: 32 }}>
        <Text
          style={{
            color: Colors[theme].text,
            fontFamily: "NunitoRegular",
            fontSize: 16,
            lineHeight: 22
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
};

export default AIChatModal;
