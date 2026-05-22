import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
} from "react";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";

interface PremiumBenefitsModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const BENEFITS = [
  {
    title: "Unlimited Habits",
    description: "Build and track as many habits as you need without limits.",
    icon: "layers",
  },
  {
    title: "Habibee AI Features",
    description: "Unlock smart AI analysis, custom habits generation, and chat advice.",
    icon: "cpu",
  },
  {
    title: "Sub-habit Reminders",
    description: "Set personalized sub-habit notifications to stay perfectly on track.",
    icon: "bell",
  },
  {
    title: "Monthly Streak Freezes",
    description: "Get 2 freezes every month to keep your streaks alive on busy days.",
    icon: "wind",
  },
  {
    title: "Priority Support",
    description: "Fast-tracked support directly from the Habibee developers team.",
    icon: "mail",
  },
];

const PremiumBenefitsModal: FC<PremiumBenefitsModalProps> = ({
  visible,
  setVisible,
}) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["85%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      onClose={() => setVisible(false)}
      backgroundStyle={{
        backgroundColor: Colors[theme].background,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 5,
        backgroundColor: "grey",
        marginTop: 10,
        borderRadius: 30,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          backgroundColor: Colors[theme].background,
          paddingVertical: 10,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
        {/* Header Hero Area */}
        <View style={styles.heroContainer}>
          <Image
            source={require("../../assets/icons/premium.png")}
            style={{
              width: 60,
              height: 60,
              tintColor: Colors[theme].primary,
              marginBottom: 16,
            }}
          />
          <Text style={[styles.pageTitleText, { color: Colors[theme].text }]}>
            You are a Pro Member!
          </Text>
          <Text
            style={[
              styles.pageSubtitleText,
              { color: Colors[theme].text_secondary },
            ]}
          >
            Thank you for supporting Habibee. You have full access to every premium feature.
          </Text>
        </View>

        {/* Benefits Cards/List */}
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
            },
          ]}
        >
          <Text style={[styles.cardTitleText, { color: Colors[theme].text }]}>
            Active Pro Benefits
          </Text>

          <View style={styles.benefitsContainer}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View
                  style={[
                    styles.iconWrapper,
                    { backgroundColor: Colors[theme].primary + "15" },
                  ]}
                >
                  <Feather
                    name={benefit.icon as any}
                    size={18}
                    color={Colors[theme].primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.benefitTitle, { color: Colors[theme].text }]}
                  >
                    {benefit.title}
                  </Text>
                  <Text
                    style={[
                      styles.benefitDesc,
                      { color: Colors[theme].text_secondary },
                    ]}
                  >
                    {benefit.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Close/Acknowledge Button */}
        <Pressable
          onPress={() => {
            haptics.impact();
            setVisible(false);
          }}
          style={[
            styles.closeButton,
            {
              backgroundColor: Colors[theme].primary,
            },
          ]}
        >
          <Text style={[styles.closeText, { color: "#ffffff" }]}>
            Awesome
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  pageTitleText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 24,
    textAlign: "center",
  },
  pageSubtitleText: {
    fontFamily: "NunitoMedium",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
  mainCard: {
    borderWidth: 3,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardTitleText: {
    fontFamily: "NunitoBold",
    fontSize: 18,
    marginBottom: 16,
  },
  benefitsContainer: {
    gap: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontFamily: "NunitoBold",
    fontSize: 15,
    marginBottom: 2,
  },
  benefitDesc: {
    fontFamily: "NunitoRegular",
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  closeText: {
    fontFamily: "NunitoBold",
    fontSize: 16,
  },
});

export default PremiumBenefitsModal;
