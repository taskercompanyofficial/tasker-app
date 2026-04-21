import { useState, useEffect, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setIsInternetReachable(state.isInternetReachable);
    return state.isConnected && state.isInternetReachable;
  }, []);

  return {
    isConnected,
    isInternetReachable,
    isOffline: !isConnected || !isInternetReachable,
    checkConnection,
  };
}
