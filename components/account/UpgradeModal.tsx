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
  { icon: "layers" as const, text: "Unlimited habits" },
  { icon: "eye-off" as const, text: "Ad-free experience" },
  { icon: "star" as const, text: "Premium themes & icons" },
  { icon: "bar-chart-2" as const, text: "Advanced statistics" },
  { icon: "headphones" as const, text: "Priority support" },
];

const UpgradeModal: FC<UpgradeModalProps> = ({ visible, setVisible }) => {
  const { theme } = useTheme();
  const haptics = useHapitcs();
  const { purchasePackage, restorePurchases, monthlyPackage, lifetimePackage } =
    usePremium();
  const { showCustomAlert } = useCustomAlert();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">(
    "monthly"
  );
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["80%"], []);

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

  const monthlyPrice = monthlyPackage?.product?.priceString ?? "$3.99";
  const lifetimePrice = lifetimePackage?.product?.priceString ?? "$29.99";

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
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.crownBadge,
              { backgroundColor: Colors[theme].primary + "20" },
            ]}
          >
            <Text style={{ fontSize: 28 }}>👑</Text>
          </View>
          <Text
            style={[
              styles.title,
              { color: Colors[theme].text },
            ]}
          >
            Habibee Premium
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: Colors[theme].text_secondary },
            ]}
          >
            Unlock the full experience
          </Text>
        </View>

        {/* Benefits */}
        <View
          style={[
            styles.benefitsCard,
            {
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
            },
          ]}
        >
          {BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View
                style={[
                  styles.checkIcon,
                  { backgroundColor: Colors[theme].primary + "18" },
                ]}
              >
                <Feather
                  name={benefit.icon}
                  size={16}
                  color={Colors[theme].primary}
                />
              </View>
              <Text
                style={[
                  styles.benefitText,
                  { color: Colors[theme].text },
                ]}
              >
                {benefit.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        <Text
          style={[
            styles.sectionLabel,
            { color: Colors[theme].text_secondary },
          ]}
        >
          Choose your plan
        </Text>
        <View style={styles.plansRow}>
          {/* Monthly */}
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
                    : Colors[theme].surface,
                borderColor:
                  selectedPlan === "monthly"
                    ? Colors[theme].primary
                    : Colors[theme].border,
              },
            ]}
          >
            {selectedPlan === "monthly" && (
              <View
                style={[
                  styles.selectedDot,
                  { backgroundColor: Colors[theme].primary },
                ]}
              />
            )}
            <Text
              style={[styles.planName, { color: Colors[theme].text }]}
            >
              Monthly
            </Text>
            <Text
              style={[styles.planPrice, { color: Colors[theme].text }]}
            >
              {monthlyPrice}
            </Text>
            <Text
              style={[
                styles.planSubtitle,
                { color: Colors[theme].text_secondary },
              ]}
            >
              per month
            </Text>
          </Pressable>

          {/* Lifetime */}
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
                    : Colors[theme].surface,
                borderColor:
                  selectedPlan === "lifetime"
                    ? Colors[theme].primary
                    : Colors[theme].border,
              },
            ]}
          >
            {selectedPlan === "lifetime" && (
              <View
                style={[
                  styles.selectedDot,
                  { backgroundColor: Colors[theme].primary },
                ]}
              />
            )}
            <View
              style={[
                styles.bestValueBadge,
                { backgroundColor: Colors[theme].primary },
              ]}
            >
              <Text style={styles.bestValueText}>Best Value</Text>
            </View>
            <Text
              style={[styles.planName, { color: Colors[theme].text }]}
            >
              Lifetime
            </Text>
            <Text
              style={[styles.planPrice, { color: Colors[theme].text }]}
            >
              {lifetimePrice}
            </Text>
            <Text
              style={[
                styles.planSubtitle,
                { color: Colors[theme].text_secondary },
              ]}
            >
              one-time purchase
            </Text>
          </Pressable>
        </View>

        {/* Subscribe Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing}
          style={[
            styles.subscribeButton,
            {
              backgroundColor: Colors[theme].primary,
              opacity: purchasing ? 0.7 : 1,
            },
          ]}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeText}>
              {selectedPlan === "lifetime"
                ? "Get Lifetime Access"
                : "Subscribe Now"}
            </Text>
          )}
        </Pressable>

        {/* Restore Purchases */}
        <Pressable
          onPress={handleRestore}
          disabled={restoring}
          style={styles.restoreButton}
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
              Restore Purchases
            </Text>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  crownBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "NunitoExtraBold",
    fontSize: 24,
  },
  subtitle: {
    fontFamily: "NunitoMedium",
    fontSize: 14,
    marginTop: 4,
  },
  benefitsCard: {
    borderWidth: 2,
    borderRadius: 15,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontFamily: "NunitoMedium",
    fontSize: 15,
    flex: 1,
  },
  sectionLabel: {
    fontFamily: "NunitoBold",
    fontSize: 14,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  plansRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  selectedDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bestValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  bestValueText: {
    fontFamily: "NunitoBold",
    fontSize: 10,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planName: {
    fontFamily: "NunitoBold",
    fontSize: 16,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: "NunitoExtraBold",
    fontSize: 22,
  },
  planSubtitle: {
    fontFamily: "NunitoRegular",
    fontSize: 12,
    marginTop: 2,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeText: {
    fontFamily: "NunitoBold",
    fontSize: 17,
    color: "#fff",
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  restoreText: {
    fontFamily: "NunitoMedium",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

export default UpgradeModal;
