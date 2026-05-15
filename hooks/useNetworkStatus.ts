import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Subscribes to NetInfo and returns whether the device has an active internet
 * connection.  We treat `isInternetReachable === null` (unknown) as online to
 * avoid false-positive offline states on first mount.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Fetch immediately so we have the real state before the first render
    NetInfo.fetch().then((state) => {
      const connected =
        !!state.isConnected &&
        (state.isInternetReachable === null || !!state.isInternetReachable);
      setIsOnline(connected);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected =
        !!state.isConnected &&
        (state.isInternetReachable === null || !!state.isInternetReachable);
      setIsOnline(connected);
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
