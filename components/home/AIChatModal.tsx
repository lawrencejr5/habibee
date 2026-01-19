import React, {
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  Platform,
  Keyboard,
  Pressable,
  View,
  TextInput,
  Dimensions,
  Text,
  ActivityIndicator,
  BackHandler,
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
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { habitIcons } from "@/data/habits";

interface AIChatModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

type HabitData = {
  habit: string;
  duration?: number;
  goal: number;
  icon: string;
  theme: string;
  strict: boolean;
};

type ChatPart =
  | { type: "text"; content: string }
  | { type: "habit"; content: HabitData };

type AiChatMsgType = {
  role: "user" | "model";
  parts: ChatPart[];
  thoughtTime?: number;
  shouldAnimate?: boolean;
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

  // Serialize messages for the API (convert back to simple styling for context)
  const serializeMessagesForApi = (msgs: AiChatMsgType[]) => {
    return msgs.map((m) => ({
      role: m.role,
      parts: m.parts.map((p) => ({
        text:
          p.type === "text"
            ? p.content
            : `[Suggested Habit: ${p.content.habit}]`,
      })),
    }));
  };

  const sendMessage = async (customInput?: string) => {
    const messageContent = typeof customInput === "string" ? customInput : input;
    if (!messageContent.trim()) return;

    setGenerating(true);
    haptics.impact();
    const startTime = Date.now();
    const userMsg = messageContent; // Store message to use

    try {
      // Add user message immediately
      const new_message: AiChatMsgType = {
        role: "user",
        parts: [{ type: "text", content: userMsg }],
      };

      setMessages((prev) => [...prev, new_message]);
      setInput(""); // Clear input immediately

      // Send context to AI
      const apiMessages = serializeMessagesForApi([...messages, new_message]);
      const responseString = await generate_habit({
        messages: apiMessages,
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      let parsedResponse: { response: ChatPart[] };
      try {
        // Attempt to clean the response string on the client side as a failsafe
        const cleanJsonMatch = responseString.match(/\{[\s\S]*\}/);
        let jsonToParse = cleanJsonMatch ? cleanJsonMatch[0] : responseString;

        // Remove invalid control characters that might break JSON parsing
        // Preserving: \t (09), \n (0A), \r (0D)
        // Removing: 00-08, 0B, 0C, 0E-1F, 7F
        jsonToParse = jsonToParse.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

        parsedResponse = JSON.parse(jsonToParse);
      } catch (e) {
        console.error("Failed to parse JSON", e);
        // Fallback: Treat the entire raw string as a text response
        parsedResponse = {
          response: [{ type: "text", content: responseString }],
        };
      }

      const ai_message: AiChatMsgType = {
        role: "model",
        parts: parsedResponse.response,
        thoughtTime: duration,
        shouldAnimate: true,
      };

      setMessages((prev) => [...prev, ai_message]);
    } catch (err: any) {
      showCustomAlert("An error occured", "danger");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const markMessageAsAnimated = (index: number) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], shouldAnimate: false };
      }
      return updated;
    });
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


  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };
    const onHide = () => setKeyboardHeight(0);


    const showListener = Keyboard.addListener(showEvent, onShow);
    const hideListener = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        bottomSheetRef.current?.close()
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [visible, setVisible]);

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
            <Pressable
              onPress={() => {
                haptics.impact();
                setMessages([]);
              }}
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
            </Pressable>

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
          {/* Main Content */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: messages.length > 0 ? 100 + keyboardHeight : 100, // Dynamic space for sticky input + keyboard
            }}
          >


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
                        sendMessage(item.prompt);
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
                {messages.map((msg, index) =>
                  msg.role === "user" ? (
                    <UserChat key={index} text={(msg.parts[0].content as string)} />
                  ) : (
                    <ModelChat
                      key={index}
                      parts={msg.parts}
                      thoughtTime={msg.thoughtTime}
                      shouldAnimate={msg.shouldAnimate}
                      onAnimationComplete={() => markMessageAsAnimated(index)}
                    />
                  )
                )}

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
                  maxHeight: 150,
                  padding: 5,
                  paddingHorizontal: 15,
                  backgroundColor: Colors[theme].surface,
                  borderColor: Colors[theme].border,
                  borderWidth: 1.5,
                  borderRadius: 25,
                  flexDirection: "row",
                  alignItems: "flex-end", // Align items to bottom as it grows
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
                    maxHeight: 130, // Limit internal growth
                  }}
                  placeholder="Ask Habibee anything..."
                  placeholderTextColor={Colors[theme].text_secondary}
                  value={input}
                  onChangeText={setInput}
                  multiline={true}
                  blurOnSubmit={true}
                  onSubmitEditing={() => sendMessage()}
                />

                <Pressable
                  onPress={() => sendMessage()}
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

// Text Parsing Helper
const parseText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return {
        type: "bold",
        content: part.slice(2, -2),
      };
    }
    return {
      type: "text",
      content: part,
    };
  });
};

const HabitCard: FC<{ data: HabitData }> = ({ data }) => {
  const { theme } = useTheme();
  const createHabit = useMutation(api.habits.create_habit);
  const { showCustomAlert } = useCustomAlert();
  const haptics = useHapitcs();
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    haptics.impact();
    try {
      await createHabit({
        habit: data.habit,
        duration: data.duration,
        goal: data.goal,
        icon: data.icon,
        theme: data.theme,
        strict: data.strict
      });
      setSaved(true);
      showCustomAlert("Habit saved successfully!", "success");
    } catch (e: any) {
      console.log(e);
      const errorMessage = e.message || "An error occurred";
      if (errorMessage.includes("habit with same name already exists")) {
        showCustomAlert("Habit with same name already exists", "danger");
      } else {
        showCustomAlert("Failed to save habit", "danger");
      }
    }
  };

  return (
    <Pressable
      onPress={() => haptics.impact()}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        backgroundColor: Colors[theme].surface,
        paddingVertical: 15,
        paddingHorizontal: 5,
        marginVertical: 15,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: Colors[theme].border,
        maxWidth: 300
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 15,
          marginLeft: 5,
          flex: 1,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: data.theme + "20",
            justifyContent: "center",
            alignItems: "center",
            borderColor: data.theme,
          }}
        >
          <Image
            source={habitIcons[data.icon] || habitIcons["default"]}
            style={{
              width: 20,
              height: 20,
              tintColor: data.theme,
            }}
          />
        </View>

        <View>
          <ThemedText
            numberOfLines={1}
            style={{ fontFamily: "NunitoBold", fontSize: 14, width: 150 }}
          >
            {data.habit}
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 15,
              marginTop: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                width: 100,
              }}
            >
              <Image
                source={require("@/assets/icons/clock.png")}
                style={{
                  tintColor: Colors[theme].text_secondary,
                  width: 14,
                  height: 14,
                }}
              />
              <ThemedText
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 12,
                  color: Colors[theme].text_secondary,
                }}
                numberOfLines={1}
              >
                {data.duration ? `${data.duration} mins daily` : "Direct Task"}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <Pressable
        onPress={saved ? undefined : onSave}
        style={{
          borderLeftWidth: 3,
          borderColor: Colors[theme].border,
          width: 50,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          paddingHorizontal: 10,
        }}
      >
        <MaterialCommunityIcons
          name={saved ? "check-circle" : "download"}
          size={24}
          color={saved ? Colors[theme].primary : Colors[theme].text_secondary}
        />
      </Pressable>
    </Pressable>
  );
};

const ModelChat: FC<{
  parts: ChatPart[];
  thoughtTime?: number;
  shouldAnimate?: boolean;
  onAnimationComplete?: () => void;
}> = ({ parts, thoughtTime, shouldAnimate, onAnimationComplete }) => {
  const { theme } = useTheme();

  // Combine all text parts for animation calculation
  const textParts = parts.filter(p => p.type === 'text') as { type: 'text', content: string }[];
  const fullText = textParts.map(p => p.content).join('');

  const parsedText = useMemo(() => parseText(fullText), [fullText]);
  const totalLength = useMemo(() => parsedText.reduce((acc, part) => acc + part.content.length, 0), [parsedText]);

  const [visibleCount, setVisibleCount] = useState(shouldAnimate ? 0 : totalLength);

  useEffect(() => {
    if (!shouldAnimate) {
      setVisibleCount(totalLength);
      return;
    }

    let currentCount = 0;
    const intervalId = setInterval(() => {
      currentCount += 4;
      setVisibleCount(Math.min(currentCount, totalLength));

      if (currentCount >= totalLength) {
        clearInterval(intervalId);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [shouldAnimate, totalLength]);

  // Render logic
  let currentRenderCount = visibleCount;

  return (
    <View
      style={{
        padding: 5,
        borderRadius: 15,
        alignSelf: "flex-start",
        marginBottom: 20,
        maxWidth: "100%",
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
              fontSize: 12,
            }}
          >
            Thought for {thoughtTime.toFixed(1)}s
          </Text>
        )}
      </View>
      <View style={{ paddingLeft: 32 }}>
        {parts.map((part, index) => {
          if (part.type === 'habit') {
            return <HabitCard key={index} data={part.content} />;
          }

          const partParsed = parseText(part.content);
          const realLength = partParsed.reduce((acc, p) => acc + p.content.length, 0);

          let visibleForPart = 0;
          if (currentRenderCount > 0) {
            visibleForPart = Math.min(currentRenderCount, realLength);
            currentRenderCount -= visibleForPart;
          }

          if (visibleForPart <= 0) return null;

          let localCounter = visibleForPart;
          return (
            <Text key={index} style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {partParsed.map((token, tIndex) => {
                if (localCounter <= 0) return null;
                const tokenLen = token.content.length;
                const showLen = Math.min(localCounter, tokenLen);
                localCounter -= showLen;

                return (
                  <Text
                    key={tIndex}
                    style={{
                      color: Colors[theme].text,
                      fontFamily: token.type === "bold" ? "NunitoBold" : "NunitoRegular",
                      fontSize: 16,
                      lineHeight: 22,
                    }}
                  >
                    {token.content.slice(0, showLen)}
                  </Text>
                )
              })}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

export default AIChatModal;
