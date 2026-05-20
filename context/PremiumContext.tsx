import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesPackage,
} from "react-native-purchases";

import { useUser } from "@/context/UserContext";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const RC_ANDROID_KEY = "goog_vujochFULxnATgbnJuwpBwhpXCO";
const RC_IOS_KEY = "appl_yCRKFOBwJCJGpwxmPKKJjoZDsaZ";

interface PremiumContextType {
  isPremium: boolean;
  planType: "monthly" | "lifetime" | null;
  loading: boolean;
  monthlyPackage: PurchasesPackage | null;
  lifetimePackage: PurchasesPackage | null;
  purchasePackage: (packageType: "monthly" | "lifetime") => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | null>(null);

export const PremiumProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { signedIn } = useUser();
  const updatePremium = useMutation(api.users.update_premium_status);

  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [planType, setPlanType] = useState<"monthly" | "lifetime" | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(
    null,
  );
  const [lifetimePackage, setLifetimePackage] =
    useState<PurchasesPackage | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Derive premium state from CustomerInfo
  const processCustomerInfo = useCallback((info: CustomerInfo) => {
    const entitlement = info.entitlements.active["premium"];
    if (entitlement) {
      setIsPremium(true);
      const productId = entitlement.productIdentifier || "";
      if (
        productId.toLowerCase().includes("lifetime") ||
        entitlement.expirationDate === null
      ) {
        setPlanType("lifetime");
      } else {
        setPlanType("monthly");
      }
    } else {
      setIsPremium(false);
      setPlanType(null);
    }
  }, []);

  // Sync premium status to Convex
  const syncToConvex = useCallback(
    async (premium: boolean, plan: "monthly" | "lifetime" | null) => {
      try {
        await updatePremium({
          is_premium: premium,
          sub_type: plan ?? undefined,
          date_of_sub: premium
            ? new Date().toLocaleDateString("en-CA")
            : undefined,
        });
      } catch (err) {
        console.warn("Failed to sync premium status to Convex:", err);
      }
    },
    [updatePremium],
  );

  // Initialize RevenueCat (Safeguarded against duplicate configurations)
  useEffect(() => {
    const init = async () => {
      try {
        const alreadyConfigured = await Purchases.isConfigured();
        if (alreadyConfigured) {
          setInitialized(true);
          return;
        }

        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        const apiKey = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;
        await Purchases.configure({ apiKey });
        setInitialized(true);
      } catch (err) {
        console.error("Failed to initialize RevenueCat:", err);
        setLoading(false);
      }
    };

    init();
  }, []);

  // Identify user and fetch layout offerings map smoothly
  useEffect(() => {
    if (!initialized || !signedIn?._id) return;

    let isMounted = true;

    const identify = async () => {
      try {
        setLoading(true);

        // logIn returns customerInfo directly—saves an unnecessary getCustomerInfo() network ping!
        const loginResult = await Purchases.logIn(signedIn._id);
        if (isMounted) {
          processCustomerInfo(loginResult.customerInfo);
        }

        const offerings = await Purchases.getOfferings();
        if (offerings.current && isMounted) {
          // 1. Grab monthly cleanly
          const monthly = offerings.current.monthly;
          setMonthlyPackage(monthly ?? null);

          // 2. Fallback check: try out-of-the-box shortcut first, if null, scour the active array manually
          const lifetime =
            offerings.current.lifetime ??
            offerings.current.availablePackages.find(
              (p) =>
                p.packageType === "LIFETIME" ||
                p.identifier.toLowerCase().includes("lifetime"),
            );

          setLifetimePackage(lifetime ?? null);
        }
      } catch (err) {
        console.warn("RevenueCat identify/fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    identify();

    return () => {
      isMounted = false;
    };
  }, [initialized, signedIn?._id, processCustomerInfo]);

  // Listen for background customer info updates
  useEffect(() => {
    if (!initialized) return;

    const listener = (info: CustomerInfo) => {
      processCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [initialized, processCustomerInfo]);

  // Purchase Execution
  const purchasePackage = useCallback(
    async (type: "monthly" | "lifetime") => {
      const pkg = type === "monthly" ? monthlyPackage : lifetimePackage;
      if (!pkg) {
        console.warn(`No ${type} package available for purchase operation`);
        return;
      }

      try {
        setLoading(true);
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        processCustomerInfo(customerInfo);

        const entitlement = customerInfo.entitlements.active["premium"];
        if (entitlement) {
          await syncToConvex(true, type);
        }
      } catch (err: any) {
        if (!err.userCancelled) {
          console.error("Purchase error:", err);
          throw err;
        }
      } finally {
        setLoading(false);
      }
    },
    [monthlyPackage, lifetimePackage, processCustomerInfo, syncToConvex],
  );

  // Restore Purchases
  const restorePurchases = useCallback(async () => {
    try {
      setLoading(true);
      const info = await Purchases.restorePurchases();
      processCustomerInfo(info);

      const entitlement = info.entitlements.active["premium"];
      if (entitlement) {
        const productId = entitlement.productIdentifier || "";
        const restoredPlan =
          productId.toLowerCase().includes("lifetime") ||
          entitlement.expirationDate === null
            ? "lifetime"
            : "monthly";
        await syncToConvex(true, restoredPlan);
      }
    } catch (err) {
      console.error("Restore purchases error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [processCustomerInfo, syncToConvex]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        planType,
        loading,
        monthlyPackage,
        lifetimePackage,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context)
    throw new Error("Premium context must be within the premium provider");
  return context;
};

export default PremiumProvider;
