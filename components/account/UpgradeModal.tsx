import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/context/ThemeContext";
import { useHapitcs } from "@/context/HapticsContext";
import { usePremium } from "@/context/PremiumContext";
import { useCustomAlert } from "@/context/AlertContext";

interface UpgradeModalProps {
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

const BENEFITS = [
  { text: "Unlimited Habits" },
  { text: "Habibee AI Features" },
  { text: "Sub-habit Reminders" },
  { text: "Streak Freezing" },
  { text: "Priority Support" },
];

const UpgradeModal: FC<UpgradeModalProps> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const { purchasePackage, restorePurchases, monthlyPackage, lifetimePackage } =
    usePremium();
  const { showCustomAlert } = useCustomAlert();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">(
    "monthly",
  );
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["93%"], []);

  useEffect(() => {
    if (visible) bottomSheetRef.current?.expand();
    else bottomSheetRef.current?.close();
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

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      haptics.impact();
      await purchasePackage(selectedPlan);
      showCustomAlert("Welcome to Habibee Premium! 🎉", "success");
      setVisible(false);
    } catch (err: any) {
      if (!err?.userCancelled) {
        showCustomAlert("Purchase failed. Please try again.", "danger");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      haptics.impact();
      await restorePurchases();
      showCustomAlert("Purchases restored successfully!", "success");
      setVisible(false);
    } catch {
      showCustomAlert("No purchases to restore.", "danger");
    } finally {
      setRestoring(false);
    }
  };

  const monthlyPrice = monthlyPackage?.product.priceString ?? "₦640";
  const lifetimePrice = lifetimePackage?.product?.priceString ?? "₦12,600";

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
        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitleText, { color: Colors[theme].text }]}>
            Get more from Habibee
          </Text>
          <Text
            style={[
              styles.pageSubtitleText,
              { color: Colors[theme].text_secondary },
            ]}
          >
            Choose the plan right for you
          </Text>
        </View>

        {/* Main Premium Container Card */}
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
            },
          ]}
        >
          {/* Card Header */}
          <Text style={[styles.cardTitleText, { color: Colors[theme].text }]}>
            Pro
          </Text>
          <Text
            style={[
              styles.cardSubtitleText,
              { color: Colors[theme].text_secondary },
            ]}
          >
            For ultimate habit building
          </Text>

          {/* Side-by-Side Plans Selector */}
          <View style={styles.plansSelectorRow}>
            {/* Monthly Plan */}
            <Pressable
              onPress={() => {
                haptics.impact();
                setSelectedPlan("monthly");
              }}
              style={[
                styles.planCard,
                {
                  backgroundColor:
                    selectedPlan === "monthly"
                      ? Colors[theme].primary + "12"
                      : "transparent",
                  borderColor:
                    selectedPlan === "monthly"
                      ? Colors[theme].primary
                      : Colors[theme].border,
                },
              ]}
            >
              <View style={styles.planCardTop}>
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor:
                        selectedPlan === "monthly"
                          ? Colors[theme].primary
                          : Colors[theme].text_secondary,
                    },
                  ]}
                >
                  {selectedPlan === "monthly" && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: Colors[theme].primary },
                      ]}
                    />
                  )}
                </View>
              </View>

              <View style={styles.planCardBottom}>
                <Text
                  style={[styles.planPriceText, { color: Colors[theme].text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {monthlyPrice}
                </Text>
                <Text
                  style={[
                    styles.planPeriodText,
                    { color: Colors[theme].text_secondary },
                  ]}
                >
                  Billed monthly
                </Text>
              </View>
            </Pressable>

            {/* Lifetime Plan */}
            <Pressable
              onPress={() => {
                haptics.impact();
                setSelectedPlan("lifetime");
              }}
              style={[
                styles.planCard,
                {
                  backgroundColor:
                    selectedPlan === "lifetime"
                      ? Colors[theme].primary + "12"
                      : "transparent",
                  borderColor:
                    selectedPlan === "lifetime"
                      ? Colors[theme].primary
                      : Colors[theme].border,
                },
              ]}
            >
              <View style={styles.planCardTop}>
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor:
                        selectedPlan === "lifetime"
                          ? Colors[theme].primary
                          : Colors[theme].text_secondary,
                    },
                  ]}
                >
                  {selectedPlan === "lifetime" && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: Colors[theme].primary },
                      ]}
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.badgeContainer,
                    { backgroundColor: Colors[theme].primary + "22" },
                  ]}
                >
                  <Text
                    style={[styles.badgeText, { color: Colors[theme].primary }]}
                  >
                    Best value
                  </Text>
                </View>
              </View>

              <View style={styles.planCardBottom}>
                <Text
                  style={[styles.planPriceText, { color: Colors[theme].text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {lifetimePrice}
                </Text>
                <Text
                  style={[
                    styles.planPeriodText,
                    { color: Colors[theme].text_secondary },
                  ]}
                >
                  Pay once forever
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Big Premium CTA Button */}
          <Pressable
            onPress={handlePurchase}
            disabled={purchasing}
            style={[
              styles.ctaButton,
              {
                backgroundColor: Colors[theme].primary,
              },
            ]}
          >
            {purchasing ? (
              <ActivityIndicator color={"#fff"} />
            ) : (
              <Text style={[styles.ctaText, { color: "#ffffff" }]}>
                {selectedPlan === "lifetime"
                  ? "Get Lifetime plan"
                  : "Get Pro plan"}
              </Text>
            )}
          </Pressable>

          {/* Subtle Separator Divider */}
          <View
            style={[styles.divider, { backgroundColor: Colors[theme].border }]}
          />

          {/* Benefits Section */}
          <View style={styles.benefitsContainer}>
            <Text
              style={[
                styles.benefitsHeader,
                { color: Colors[theme].text_secondary },
              ]}
            >
              Everything in Free, plus:
            </Text>

            {BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Feather
                  name="check"
                  size={16}
                  color={Colors[theme].text}
                  style={styles.checkIcon}
                />
                <Text
                  style={[styles.benefitText, { color: Colors[theme].text }]}
                >
                  {benefit.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Restore Purchases Button */}
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            style={styles.restoreContainer}
          >
            {restoring ? (
              <ActivityIndicator
                size="small"
                color={Colors[theme].text_secondary}
              />
            ) : (
              <Text
                style={[
                  styles.restoreText,
                  { color: Colors[theme].text_secondary },
                ]}
              >
                Restore purchases
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  pageTitleContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  pageTitleText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 25,
    textAlign: "center",
  },
  pageSubtitleText: {
    fontFamily: "NunitoMedium",
    fontSize: 16,
    marginTop: 6,
    textAlign: "center",
  },
  mainCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    marginBottom: 10,
  },
  cardTitleText: {
    fontFamily: "NunitoBold",
    fontSize: 22,
    marginBottom: 2,
  },
  cardSubtitleText: {
    fontFamily: "NunitoRegular",
    fontSize: 14,
    marginBottom: 20,
  },
  plansSelectorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    height: 126,
    justifyContent: "space-between",
  },
  planCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "NunitoBold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  planCardBottom: {
    marginTop: 10,
  },
  planPriceText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 20,
  },
  planPeriodText: {
    fontFamily: "NunitoRegular",
    fontSize: 12,
    marginTop: 2,
  },
  ctaButton: {
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ctaText: {
    fontFamily: "NunitoBold",
    fontSize: 16,
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 20,
  },
  benefitsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  benefitsHeader: {
    fontFamily: "NunitoBold",
    fontSize: 14,
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkIcon: {
    marginRight: 2,
  },
  benefitText: {
    fontFamily: "NunitoMedium",
    fontSize: 14,
  },
  restoreContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  restoreText: {
    fontFamily: "NunitoMedium",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

export default UpgradeModal;
