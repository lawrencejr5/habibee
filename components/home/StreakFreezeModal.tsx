import React, {
  Dispatch,
  FC,
  SetStateAction,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Pressable, Text, View, Image } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { Text as ThemedText } from "../Themed";
import Colors from "@/constants/Colors";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePremium } from "@/context/PremiumContext";
import UpgradeModal from "@/components/account/UpgradeModal";

interface StreakFreezeModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const StreakFreezeModal: FC<StreakFreezeModalProps> = ({
  visible,
  setVisible,
}) => {
  const haptics = useHapitcs();
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["35%"], []);

  const user = useQuery(api.users.get_current_user);

  const today = new Date().toLocaleDateString("en-CA");
  const isStreakDone = user?.last_streak_date === today;

  const currentFreezes = user?.freezes || 0;
  const maxFreezes = 2;
  const hasMaxFreezes = currentFreezes >= maxFreezes;

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={true}
        enablePanDownToClose={true}
        stackBehavior="push"
        onDismiss={() => setVisible(false)}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: Colors[theme].background }}
        handleIndicatorStyle={{
          width: 40,
          height: 4,
          backgroundColor: Colors[theme].border,
          marginTop: 10,
          opacity: 0.5,
        }}
      >
        <BottomSheetView
          style={{
            padding: 20,
            paddingBottom: 40,
            gap: 15,
          }}
        >
          {/* Card 1: Streak Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: Colors[theme].surface,
              padding: 15,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: Colors[theme].border,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Image
                key={isStreakDone ? "active" : "inactive"}
                source={require("@/assets/icons/fire.png")}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: isStreakDone
                    ? undefined
                    : Colors[theme].text_secondary,
                }}
              />
              <ThemedText style={{ fontFamily: "NunitoBold", fontSize: 16 }}>
                Current Streak
              </ThemedText>
            </View>
            <ThemedText
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 18,
                color: isStreakDone
                  ? Colors[theme].primary
                  : Colors[theme].text,
              }}
            >
              {user?.streak || 0}
            </ThemedText>
          </View>

          {/* Card 2: Streak Freeze Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: Colors[theme].surface,
              padding: 15,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: Colors[theme].border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                flex: 1,
                marginRight: 10,
              }}
            >
              <Image
                source={require("@/assets/icons/snowflake.png")}
                style={{
                  width: 24,
                  height: 24,
                }}
              />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontFamily: "NunitoBold", fontSize: 16 }}>
                  Streak Freezes
                </ThemedText>
                <Text
                  style={{
                    fontFamily: "NunitoMedium",
                    fontSize: 12,
                    color: Colors[theme].text_secondary,
                  }}
                  numberOfLines={2}
                >
                  {isPremium
                    ? `${currentFreezes}/${maxFreezes} available`
                    : "Protect your streaks"}
                </Text>
              </View>
            </View>

            {!isPremium ? (
              <Pressable
                onPress={() => {
                  haptics.impact();
                  setUpgradeModalVisible(true);
                }}
                style={{
                  backgroundColor: Colors[theme].primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "NunitoBold",
                    fontSize: 13,
                    color: "#fff",
                  }}
                >
                  Upgrade
                </Text>
              </Pressable>
            ) : (
              <ThemedText
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 18,
                  color: Colors[theme].blue,
                }}
              >
                {user?.freezes || 0}
              </ThemedText>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
      <UpgradeModal
        visible={upgradeModalVisible}
        setVisible={setUpgradeModalVisible}
      />
    </>
  );
};

export default StreakFreezeModal;
