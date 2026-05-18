import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const adUnitId = __DEV__ ? TestIds.REWARDED : TestIds.REWARDED; // User requested test ids for now

interface StreakFreezeModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const StreakFreezeModal: FC<StreakFreezeModalProps> = ({
  visible,
  setVisible,
}) => {
  const insets = useSafeAreaInsets();
  const haptics = useHapitcs();
  const { showCustomAlert } = useCustomAlert();
  const { theme } = useTheme();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["60%"], []);

  const user = useQuery(api.users.get_current_user);
  const addStreakFreeze = useMutation(api.users.add_streak_freeze);

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

    // Start loading the rewarded ad straight away
    rewarded.load();
    setAdLoading(true);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, [rewarded]);

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        bottomSheetRef.current?.close();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [visible, setVisible]);

  if (!visible) return null;

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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={() => setVisible(false)}
      backgroundStyle={{ backgroundColor: Colors[theme].background }}
      handleIndicatorStyle={{
        width: 40,
        height: 4,
        backgroundColor: Colors[theme].border,
        marginTop: 10,
        opacity: 0.5,
      }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors[theme].background,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 10,
            }}
          >
            <Pressable
              style={{ padding: 8 }}
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

          <View style={{ alignItems: "center", marginTop: 10 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: Colors[theme].surface,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: Colors[theme].primary,
              }}
            >
              <Image
                source={require("@/assets/icons/snowflake.png")}
                style={{
                  width: 50,
                  height: 50,
                  tintColor: Colors[theme].primary,
                }}
              />
            </View>

            <ThemedText
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 24,
                marginTop: 20,
              }}
            >
              Streak Freeze
            </ThemedText>

            <Text
              style={{
                fontFamily: "NunitoRegular",
                fontSize: 16,
                color: Colors[theme].text_secondary,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              A streak freeze protects your streaks if you miss a day. Freezes
              apply to both your general streak and habit streaks!
            </Text>
          </View>

          <View
            style={{
              marginTop: 30,
              backgroundColor: Colors[theme].surface,
              padding: 20,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: Colors[theme].border,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "NunitoBold",
                  fontSize: 14,
                  color: Colors[theme].text_secondary,
                }}
              >
                Available Freezes
              </Text>
              <ThemedText
                style={{
                  fontFamily: "NunitoExtraBold",
                  fontSize: 24,
                  marginTop: 5,
                }}
              >
                {currentFreezes} / {maxFreezes}
              </ThemedText>
            </View>
            <View style={{ flexDirection: "row" }}>
              {Array.from({ length: maxFreezes }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 7.5,
                    backgroundColor:
                      i < currentFreezes
                        ? Colors[theme].primary
                        : Colors[theme].border,
                    marginLeft: 5,
                  }}
                />
              ))}
            </View>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: insets.bottom + 20,
              left: 20,
              right: 20,
            }}
          >
            <Pressable
              onPress={handleWatchAd}
              disabled={hasMaxFreezes || (!loaded && adLoading)}
              style={{
                backgroundColor: hasMaxFreezes
                  ? Colors[theme].border
                  : Colors[theme].primary,
                paddingVertical: 16,
                borderRadius: 50,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                opacity: hasMaxFreezes || (!loaded && adLoading) ? 0.5 : 1,
              }}
            >
              {!loaded && adLoading && !hasMaxFreezes ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text
                  style={{
                    fontFamily: "NunitoExtraBold",
                    fontSize: 16,
                    color: "#fff",
                  }}
                >
                  {hasMaxFreezes
                    ? "Max freezes reached"
                    : "Watch Ad for Freeze"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default StreakFreezeModal;
