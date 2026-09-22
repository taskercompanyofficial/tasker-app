import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

let Notifications: any = null;
const isExpoGo = Constants.appOwnership === "expo";

try {
  if (Platform.OS !== "web" && !isExpoGo) {
    Notifications = require("expo-notifications");
  }
} catch (e) {
  console.warn("[Push] expo-notifications module not loaded:", e);
}

// Global presentation handler: show alert banner, play sound, update badge
if (Notifications?.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (Platform.OS === "web" || !Notifications) return;

      if (isExpoGo) {
        console.warn(
          "[Push] Running in Expo Go: Remote push notifications require a Development Build in Expo SDK 53+. Bypassing registration."
        );
        return;
      }

      try {
        // Setup Android Notification Channels with high importance so incoming calls & messages pop up
        if (Platform.OS === "android" && Notifications.setNotificationChannelAsync) {
          // 1. Voice Calls: MAX priority for pop-up banner over any app or lockscreen
          await Notifications.setNotificationChannelAsync("voice_calls", {
            name: "Voice Calls",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 250, 500, 250, 500],
            lightColor: "#10B981",
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            sound: "default",
          });

          // 2. Chat Messages: HIGH priority
          await Notifications.setNotificationChannelAsync("chat_messages", {
            name: "Chat Messages",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#2563EB",
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            sound: "default",
          });

          // 3. Default Channel
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: "default",
          });
        }

        // Setup Notification Categories with Action Buttons (Accept & Decline for Voice Calls)
        if (Notifications.setNotificationCategoryAsync) {
          await Notifications.setNotificationCategoryAsync("voice_call_incoming", [
            {
              identifier: "ACCEPT_CALL",
              buttonTitle: "Accept",
              options: {
                opensAppToForeground: true,
              },
            },
            {
              identifier: "DECLINE_CALL",
              buttonTitle: "Decline",
              options: {
                opensAppToForeground: false,
                isDestructive: true,
              },
            },
          ]);
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
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
          Constants.easConfig?.projectId ??
          "4408fc40-2932-4da5-9fc6-77ea2457a8da";

        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        console.log("[Push] Expo push token obtained successfully:", tokenResponse.data);
        setExpoPushToken(tokenResponse.data);
      } catch (error) {
        console.warn("[Push] Error getting push token:", error);
      }
    }

    registerForPushNotificationsAsync();
  }, []);

  return { expoPushToken };
}
