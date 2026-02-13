import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";
import AlertModal from "@/components/common/AlertModal";

export default function OTAUpdateManager() {
  const [visible, setVisible] = useState(false);
  const lastCheck = useRef(0);

  const checkAndFetch = useCallback(async () => {
    if (__DEV__) return;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        setVisible(true);
      }
    } catch (e) {}
    lastCheck.current = Date.now();
  }, []);

  useEffect(() => {
    checkAndFetch();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && Date.now() - lastCheck.current > 5 * 60 * 1000) {
        checkAndFetch();
      }
    });
    return () => sub.remove();
  }, [checkAndFetch]);

  return (
    <AlertModal
      visible={visible}
      type="info"
      title="Update Available"
      message="A new version has been downloaded. Restart to apply updates."
      onClose={() => setVisible(false)}
      primaryButton={{
        text: "Restart now",
        onPress: () => {
          void Updates.reloadAsync();
        },
      }}
      secondaryButton={{
        text: "Later",
        onPress: () => {},
      }}
    />
  );
}

