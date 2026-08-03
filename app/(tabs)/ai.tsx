/**
 * app/(tabs)/ai.tsx
 * Habibee AI – dedicated bottom tab screen.
 * All chat logic is ported from AIChatModal and adapted to a full-screen tab.
 */
import React, {
  FC,
  useMemo,
  useRef,
  useState,
  useEffect,
  useContext,
} from "react";
import {
  Platform,
  Keyboard,
  Pressable,
  View,
  TextInput,
  Text,
  ActivityIndicator,
  Image,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { KeyboardStickyView } from "react-native-keyboard-controller";

import Colors from "@/constants/Colors";
import { Text as ThemedText } from "@/components/Themed";
import { LiquidTabContext } from "./_layout";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useCustomAlert } from "@/context/AlertContext";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { habitIcons } from "@/data/habits";
import { usePremium } from "@/context/PremiumContext";
import UpgradeModal from "@/components/account/UpgradeModal";
import AnalysisCard, { AnalyticsData } from "@/components/home/AnalysisCard";

// ─── Types ───────────────────────────────────────────────────────────────────

type HabitData = {
  habit: string;
  duration?: number;
  goal: number;
  icon: string;
  theme: string;
  strict: boolean;
  sub_habits?: string[];
};

type ChatPart =
  | { type: "text"; content: string }
  | { type: "habit"; content: HabitData }
  | { type: "analysis"; content: AnalyticsData };

type AiChatMsgType = {
  role: "user" | "model";
  parts: ChatPart[];
  thoughtTime?: number;
  shouldAnimate?: boolean;
};

// ─── Text parsing helper ──────────────────────────────────────────────────────

const parseText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return { type: "bold", content: part.slice(2, -2) };
    }
    return { type: "text", content: part };
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const UserChat: FC<{ text: string }> = ({ text }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: Colors[theme].surface,
        maxWidth: "80%",
        padding: 15,
        marginBottom: 20,
        borderRadius: 20,
        borderBottomRightRadius: 5,
        alignSelf: "flex-end",
      }}
    >
      <Text
        style={{
          color: Colors[theme].text,
          fontFamily: "NunitoRegular",
          fontSize: 16,
        }}
      >
        {text}
      </Text>
    </View>
  );
};

const HabitCard: FC<{ data: HabitData; onUpgrade: () => void }> = ({
  data,
  onUpgrade,
}) => {
  const { theme } = useTheme();
  const createHabit = useMutation(api.habits.create_habit);
  const { showCustomAlert } = useCustomAlert();
  const haptics = useHapitcs();
  const [saved, setSaved] = useState(false);
  const { isPremium } = usePremium();
  const habitsData = useQuery(api.habits.get_user_habits);

  const onSave = async () => {
    haptics.impact();
    if (!isPremium && habitsData && habitsData.length >= 3) {
      onUpgrade();
      return;
    }
    try {
      await createHabit({
        habit: data.habit,
        duration: data.duration,
        goal: data.goal,
        icon: data.icon,
        theme: data.theme,
        strict: data.strict,
        sub_habits: data.sub_habits?.map((sh) => ({ name: sh })),
      });
      setSaved(true);
      showCustomAlert("Habit saved successfully!", "success");
    } catch (e: any) {
      const errorMessage = e.message || "An error occurred";
      if (errorMessage.includes("habit with same name already exists")) {
        showCustomAlert("Habit with same name already exists", "danger");
      } else {
        showCustomAlert("Failed to save habit", "danger");
      }
    }
  };

  return (
    <View style={{ width: "100%", marginVertical: 15 }}>
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
          borderRadius: 15,
          borderWidth: 2,
          borderColor: Colors[theme].border,
          maxWidth: 300,
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
              style={{ width: 20, height: 20, tintColor: data.theme }}
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
                  source={
                    data.duration
                      ? require("@/assets/icons/clock.png")
                      : require("@/assets/icons/calendar.png")
                  }
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
                  {data.duration
                    ? `${data.duration} mins daily`
                    : "Direct Task"}
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

      {data.sub_habits && data.sub_habits.length > 0 && (
        <View style={{ paddingLeft: 10, marginTop: 5 }}>
          {data.sub_habits.map((sh, idx) => (
            <View
              key={idx}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderBottomLeftRadius: 10,
                  borderLeftWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: Colors[theme].border,
                  marginBottom: 15,
                }}
              />
              <View
                style={{
                  flex: 1,
                  backgroundColor: Colors[theme].surface,
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: Colors[theme].border,
                  marginLeft: 5,
                  marginBottom: 5,
                  maxWidth: 250,
                }}
              >
                <ThemedText
                  style={{
                    fontFamily: "NunitoMedium",
                    fontSize: 13,
                    color: Colors[theme].text,
                  }}
                >
                  {sh}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const ModelChat: FC<{
  parts: ChatPart[];
  thoughtTime?: number;
  shouldAnimate?: boolean;
  onAnimationComplete?: () => void;
  onUpgrade: () => void;
}> = ({
  parts,
  thoughtTime,
  shouldAnimate,
  onAnimationComplete,
  onUpgrade,
}) => {
  const { theme } = useTheme();
  const textParts = parts.filter((p) => p.type === "text") as {
    type: "text";
    content: string;
  }[];
  const fullText = textParts.map((p) => p.content).join("");
  const parsedText = useMemo(() => parseText(fullText), [fullText]);
  const totalLength = useMemo(
    () => parsedText.reduce((acc, part) => acc + part.content.length, 0),
    [parsedText],
  );
  const [visibleCount, setVisibleCount] = useState(
    shouldAnimate ? 0 : totalLength,
  );

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
        onAnimationComplete?.();
      }
    }, 10);
    return () => clearInterval(intervalId);
  }, [shouldAnimate, totalLength]);

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
          if (part.type === "habit")
            return (
              <HabitCard
                key={index}
                data={part.content}
                onUpgrade={onUpgrade}
              />
            );
          if (part.type === "analysis")
            return <AnalysisCard key={index} data={part.content} />;
          if (part.type !== "text") return null;

          const partParsed = parseText(part.content);
          const realLength = partParsed.reduce(
            (acc, p) => acc + p.content.length,
            0,
          );
          let visibleForPart = 0;
          if (currentRenderCount > 0) {
            visibleForPart = Math.min(currentRenderCount, realLength);
            currentRenderCount -= visibleForPart;
          }
          if (visibleForPart <= 0) return null;

          let localCounter = visibleForPart;
          return (
            <Text
              key={index}
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              {partParsed.map((token, tIndex) => {
                if (localCounter <= 0) return null;
                const showLen = Math.min(localCounter, token.content.length);
                localCounter -= showLen;
                return (
                  <Text
                    key={tIndex}
                    style={{
                      color: Colors[theme].text,
                      fontFamily:
                        token.type === "bold" ? "NunitoBold" : "NunitoRegular",
                      fontSize: 16,
                      lineHeight: 22,
                    }}
                  >
                    {token.content.slice(0, showLen)}
                  </Text>
                );
              })}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AIScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { signedIn } = useUser();
  const isLiquidTab = useContext(LiquidTabContext);
  const { showCustomAlert } = useCustomAlert();
  const { isPremium } = usePremium();

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<AiChatMsgType[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const generate_habit = useAction(api.habits.generate_habit_ai);
  const accentColor = Colors[theme].primary;

  const suggestions = [
    {
      id: 1,
      icon: "lightning-bolt-outline",
      label: "Generate new habits",
      prompt: "Can you help me generate some healthy habits?",
    },
    {
      id: 2,
      icon: "chart-timeline-variant",
      label: "Analyze my progress",
      prompt: "Analyze my current habit streaks and progress.",
    },
  ];

  const scrollViewRef = useRef<ScrollView>(null);

  const serializeMessagesForApi = (msgs: AiChatMsgType[]) =>
    msgs.map((m) => ({
      role: m.role,
      parts: m.parts.map((p) => ({
        text:
          p.type === "text"
            ? p.content
            : p.type === "habit"
              ? `[Suggested Habit: ${p.content.habit}]`
              : "[Progress Analysis]",
      })),
    }));

  const sendMessage = async (customInput?: string) => {
    if (!isPremium) {
      haptics.impact();
      setUpgradeModalVisible(true);
      return;
    }
    const messageContent =
      typeof customInput === "string" ? customInput : input;
    if (!messageContent.trim()) return;

    Keyboard.dismiss();
    setGenerating(true);
    haptics.impact();
    const startTime = Date.now();

    try {
      const new_message: AiChatMsgType = {
        role: "user",
        parts: [{ type: "text", content: messageContent }],
      };
      setMessages((prev) => [...prev, new_message]);
      setInput("");

      const apiMessages = serializeMessagesForApi([...messages, new_message]);
      const responseString = await generate_habit({
        messages: apiMessages,
        today: new Date().toLocaleDateString("en-CA"),
        utcOffsetMinutes: -new Date().getTimezoneOffset(),
      });

      const duration = (Date.now() - startTime) / 1000;
      let parsedResponse: { response: ChatPart[] };
      try {
        const cleanJsonMatch = responseString.match(/\{[\s\S]*\}/);
        let jsonToParse = cleanJsonMatch ? cleanJsonMatch[0] : responseString;
        jsonToParse = jsonToParse.replace(
          /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
          "",
        );
        parsedResponse = JSON.parse(jsonToParse);
      } catch {
        parsedResponse = {
          response: [{ type: "text", content: responseString }],
        };
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: parsedResponse.response,
          thoughtTime: duration,
          shouldAnimate: true,
        },
      ]);
    } catch (err: any) {
      showCustomAlert("An error occurred", "danger");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const markMessageAsAnimated = (index: number) => {
    setMessages((prev) => {
      const updated = [...prev];
      if (updated[index])
        updated[index] = { ...updated[index], shouldAnimate: false };
      return updated;
    });
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e: any) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    };
    const onHide = () => setKeyboardHeight(0);
    const sl = Keyboard.addListener(showEvent, onShow);
    const hl = Keyboard.addListener(hideEvent, onHide);
    return () => {
      sl.remove();
      hl.remove();
    };
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages]);

  const scrollPaddingBottom = useMemo(() => {
    const basePadding = isLiquidTab ? 210 : 120;
    return basePadding + keyboardHeight;
  }, [isLiquidTab, keyboardHeight]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors[theme].background,
        paddingTop: insets.top,
      }}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 15,
              paddingTop: 10,
              paddingBottom: 10,
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
                source={require("@/assets/images/ai-icon.png")}
                style={{ width: 35, height: 35, borderRadius: 12 }}
              />
              <ThemedText
                style={{ fontFamily: "NunitoExtraBold", fontSize: 18 }}
              >
                Habibee AI
              </ThemedText>
            </Pressable>

            {messages.length > 0 && (
              <Pressable
                onPress={() => {
                  haptics.impact();
                  setMessages([]);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: Colors[theme].border,
                  backgroundColor: Colors[theme].surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 12,
                    color: Colors[theme].text_secondary,
                  }}
                >
                  Clear chat
                </Text>
              </Pressable>
            )}
          </View>

          {/* Messages / Empty State */}
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: scrollPaddingBottom,
            }}
          >
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
                <View
                  style={{
                    marginBottom: 40,
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
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
                  style={{ flexDirection: "column", width: "100%", gap: 15 }}
                >
                  {suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        if (!isPremium) {
                          haptics.impact();
                          setUpgradeModalVisible(true);
                        } else {
                          sendMessage(item.prompt);
                        }
                      }}
                      style={({ pressed }) => ({
                        width: "100%",
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Colors[theme].surface,
                        borderRadius: 20,
                        padding: 15,
                        borderWidth: 1,
                        borderColor: pressed
                          ? accentColor
                          : Colors[theme].border,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                        justifyContent: "space-between",
                      })}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 15,
                          flex: 1,
                        }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            backgroundColor: accentColor + "15",
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
                            fontSize: 16,
                            color: Colors[theme].text,
                          }}
                        >
                          {item.label}
                        </ThemedText>
                      </View>
                      {!isPremium && (
                        <Image
                          source={require("@/assets/icons/premium.png")}
                          style={{
                            width: 20,
                            height: 20,
                            tintColor: "#FFD700",
                            transform: [{ rotate: "30deg" }],
                          }}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ paddingVertical: 20, paddingHorizontal: 15 }}>
                {messages.map((msg, index) =>
                  msg.role === "user" ? (
                    <UserChat
                      key={index}
                      text={msg.parts[0].content as string}
                    />
                  ) : (
                    <ModelChat
                      key={index}
                      parts={msg.parts}
                      thoughtTime={msg.thoughtTime}
                      shouldAnimate={msg.shouldAnimate}
                      onAnimationComplete={() => markMessageAsAnimated(index)}
                      onUpgrade={() => setUpgradeModalVisible(true)}
                    />
                  ),
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
                      <View
                        style={{
                          position: "relative",
                          width: 24,
                          height: 24,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <ActivityIndicator
                          size="large"
                          color={accentColor}
                          style={{ position: "absolute" }}
                        />
                        <Image
                          source={require("@/assets/images/ai-icon.png")}
                          style={{ width: 20, height: 20, borderRadius: 10 }}
                        />
                      </View>
                      <Text
                        style={{
                          color: Colors[theme].text_secondary,
                          fontFamily: "NunitoBold",
                          fontSize: 12,
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

          {/* Sticky Input */}
          <KeyboardStickyView
            style={{
              position: "absolute",
              bottom: isLiquidTab ? insets.bottom + 48 : insets.bottom - 20,
              width: "100%",
              backgroundColor: Colors[theme].background,
              paddingVertical: 10,
            }}
            offset={{ opened: isLiquidTab ? 100 : 60, closed: 0 }}
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
                  alignItems: "flex-end",
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
                    maxHeight: 130,
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
                  onPress={() => {
                    if (!isPremium) {
                      haptics.impact();
                      setUpgradeModalVisible(true);
                    } else {
                      sendMessage();
                    }
                  }}
                  disabled={generating}
                  style={{
                    backgroundColor: generating
                      ? Colors[theme].border
                      : accentColor,
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
                  ) : !isPremium ? (
                    <Image
                      source={require("@/assets/icons/premium.png")}
                      style={{
                        width: 20,
                        height: 20,
                        tintColor: "#FFD700",
                        transform: [{ rotate: "30deg" }],
                      }}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/icons/send.png")}
                      style={{ width: 16, height: 16, tintColor: "white" }}
                    />
                  )}
                </Pressable>
              </View>
              <Text
                style={{
                  color: Colors[theme].text_secondary,
                  fontFamily: "NunitoRegular",
                  fontSize: 10,
                  textAlign: "center",
                  marginTop: 15,
                }}
              >
                Habibee AI can make mistakes
              </Text>
            </View>
          </KeyboardStickyView>
        </View>
      </Pressable>

      <UpgradeModal
        visible={upgradeModalVisible}
        setVisible={setUpgradeModalVisible}
      />
    </View>
  );
}
