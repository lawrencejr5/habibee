import React, { Dispatch, FC, SetStateAction, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import BottomSheet, {
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { Text as ThemedText } from "../Themed";
import { useHapitcs } from "@/context/HapticsContext";
import { Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface AIChatModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const AIChatModal: FC<AIChatModalProps> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%"], []);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onClose={() => setVisible(false)}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
      }}
      handleIndicatorStyle={{
        width: 0,
        height: 0,
        backgroundColor: "grey",
        marginTop: 10,
        borderRadius: 30,
      }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          minHeight: "100%",
        }}
      >
        <View
          style={{
            flex: 1,
            height: "100%",
            backgroundColor: Colors[theme].background,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 100,
              flexGrow: 1,
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
              <Image
                source={require("../../assets/images/ai-icon.png")}
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: 20,
                  borderColor: Colors[theme].text_secondary,
                  borderWidth: 2,
                }}
              />

              <ThemedText
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 20,
                }}
              >
                Habibee Ai
              </ThemedText>

              <Pressable
                style={{
                  padding: 8,
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

            {/* Chat Area */}
            <View
              style={{
                flex: 1,
                marginHorizontal: 20,
                marginTop: 20,
              }}
            >
              {/* Chat content will go here */}
            </View>
          </ScrollView>

          {/* Input Area - Fixed at bottom */}
          <View
            style={{
              paddingHorizontal: 20,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: "100%",
                padding: 5,
                paddingHorizontal: 10,
                backgroundColor: Colors[theme].surface,
                borderColor: Colors[theme].border,
                borderWidth: 3,
                borderRadius: 50,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <BottomSheetTextInput
                style={{
                  backgroundColor: "transparent",
                  fontFamily: "NunitoBold",
                }}
                placeholder="Describe what you want..."
              />

              <Image
                source={require("../../assets/icons/send.png")}
                style={{
                  width: 20,
                  height: 20,
                  tintColor: Colors[theme].primary,
                }}
              />
            </View>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default AIChatModal;

const styles = StyleSheet.create({});
