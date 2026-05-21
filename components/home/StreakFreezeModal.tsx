import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { ActivityIndicator, Pressable, Text, View, Image } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

import { Text as ThemedText } from "../Themed";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useHapitcs } from "@/context/HapticsContext";
import { useTheme } from "@/context/ThemeContext";
import { useCustomAlert } from "@/context/AlertContext";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePremium } from "@/context/PremiumContext";
import UpgradeModal from "@/components/account/UpgradeModal";

const adUnitId = __DEV__ ? TestIds.REWARDED : TestIds.REWARDED;

interface StreakFreezeModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const StreakFreezeModal: FC<StreakFreezeModalProps> = ({
  visible,
  setVisible,
}) => {
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["35%"], []);

  const user = useQuery(api.users.get_current_user);
  const addStreakFreeze = useMutation(api.users.add_streak_freeze);

  const today = new Date().toLocaleDateString("en-CA");
  const isStreakDone = user?.last_streak_date === today;

  const [loaded, setLoaded] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const rewarded = useRef(
    RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    }),
  ).current;

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
        setAdLoading(false);
      },
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async (reward) => {
        haptics.impact("soft");
        try {
          await addStreakFreeze();
          showCustomAlert("Streak freeze added!", "success");
        } catch (e) {
          showCustomAlert("Failed to add freeze", "danger");
        }
        // Load the next ad
        setLoaded(false);
        rewarded.load();
      },
    );

    rewarded.load();
    setAdLoading(true);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, [rewarded]);

  const currentFreezes = user?.freezes || 0;
  const maxFreezes = 5;
  const hasMaxFreezes = currentFreezes >= maxFreezes;

  const handleWatchAd = () => {
    haptics.impact();
    if (hasMaxFreezes) {
      showCustomAlert(
        "You have reached the maximum number of freezes.",
        "warning",
      );
      return;
    }
    if (loaded) {
      rewarded.show();
    } else {
      showCustomAlert("Ad is still loading. Please wait a moment.", "warning");
      if (!adLoading) {
        rewarded.load();
        setAdLoading(true);
      }
    }
  };

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

  if (!visible) return null;

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={true}
        enablePanDownToClose={true}
        onClose={() => setVisible(false)}
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

            {isPremium ? (
              <Pressable
                onPress={handleWatchAd}
                disabled={hasMaxFreezes || (!loaded && adLoading)}
                style={{
                  backgroundColor: hasMaxFreezes
                    ? Colors[theme].border
                    : Colors[theme].blue,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {!loaded && adLoading && !hasMaxFreezes ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    {!hasMaxFreezes && (
                      <Feather name="play" size={12} color="#fff" />
                    )}
                    <Text
                      style={{
                        fontFamily: "NunitoBold",
                        fontSize: 13,
                        color: "#fff",
                      }}
                    >
                      {hasMaxFreezes ? "Max" : "Watch Ad"}
                    </Text>
                  </>
                )}
              </Pressable>
            ) : (
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
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>
      <UpgradeModal
        visible={upgradeModalVisible}
        setVisible={setUpgradeModalVisible}
      />
    </>
  );
};

export default StreakFreezeModal;
