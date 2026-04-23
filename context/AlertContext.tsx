import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import CustomAlert from "@/components/CustomAlert";
import { useHapitcs } from "./HapticsContext";

type AlertTheme = "success" | "danger" | "warning";

interface AlertState {
  visible: boolean;
  msg: string;
  theme: AlertTheme;
}

interface CustomAlertContextType {
  showCustomAlert: (msg: string, theme: AlertTheme) => void;
  hideAlert: () => void;
  alert: AlertState;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(
  undefined
);

export const CustomAlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    msg: "",
    theme: "success", // default
  });

  const haptics = useHapitcs();

  const showCustomAlert = useCallback((msg: string, theme: AlertTheme) => {
    haptics.impact("success");
    setAlert({ visible: true, msg, theme });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <CustomAlertContext.Provider value={{ showCustomAlert, hideAlert, alert }}>
      {children}
      {/* The Alert Component lives here, so it overlays everything */}
      <CustomAlert
        visible={alert.visible}
        msg={alert.msg}
        theme={alert.theme}
        onHide={hideAlert}
      />
    </CustomAlertContext.Provider>
  );
};

export const useCustomAlert = () => {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error("useCustomAlert must be used within a CustomAlertProvider");
  }
  return context;
};

/**
 * Drop this component inside any <Modal> that needs to show custom alerts.
 * It renders a duplicate alert view within the Modal's native window,
 * sharing the same state from AlertContext. No extra logic needed.
 *
 * Usage:
 *   <Modal visible={...}>
 *     {/* ...your modal content... *\/}
 *     <CustomAlertPortal />
 *   </Modal>
 */
export const CustomAlertPortal = () => {
  const { alert, hideAlert } = useCustomAlert();

  return (
    <CustomAlert
      visible={alert.visible}
      msg={alert.msg}
      theme={alert.theme}
      onHide={hideAlert}
    />
  );
};
