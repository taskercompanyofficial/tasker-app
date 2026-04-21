import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import * as Notifications from "expo-notifications";

// Notifications statically imported above.
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (Platform.OS === "web" || !Notifications) return;

      if (Constants.appOwnership === "expo") {
        console.warn(
          "[Push] Running in Expo Go: Push Notifications are disabled in Expo SDK 53+. Bypassing registration. Use a Development Build to test Push.",
        );
        return;
      }

      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("[Push] User denied notification permissions");
          return;
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        if (!projectId) {
          console.error("[Push] ERROR: Missing projectId from expo config!");
          return;
        }

        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        setExpoPushToken(tokenResponse.data);
      } catch (error) {
        console.warn("[Push] Error getting push token:", error);
      }
    }

    registerForPushNotificationsAsync();
  }, []);

  return { expoPushToken };
}
