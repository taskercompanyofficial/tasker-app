/**
 * Native Android Floating System Bubble Client
 *
 * Communicates with the native FloatingBubbleModule / FloatingBubbleService.
 * Controls the true system overlay view that hovers over other apps (e.g. Google Maps,
 * Waze, WhatsApp) and the Android Home Screen while a vendor job is in progress.
 *
 * Safe on iOS and Web (all operations safely resolve false/no-op).
 */
import { AppState, AppStateStatus, Linking, NativeModules, Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { FloatingBubbleModule } = NativeModules;
const OVERLAY_ACK_KEY = "@vendor_overlay_acknowledged_v1";

/**
 * Check if the user has granted "Display over other apps" (SYSTEM_ALERT_WINDOW)
 */
export async function checkSystemOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  // 1. If native module is available in compiled APK, use real OS check
  if (FloatingBubbleModule?.checkPermission) {
    try {
      const granted = await FloatingBubbleModule.checkPermission();
      return Boolean(granted);
    } catch (_) {}
  }

  // 2. Fallback: Check if user has acknowledged/enabled overlay
  try {
    const ack = await AsyncStorage.getItem(OVERLAY_ACK_KEY);
    return ack === "true";
  } catch (_) {
    return false;
  }
}

/**
 * Open Android Settings page to allow "Display over other apps"
 */
export async function requestSystemOverlayPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  // Record that the user was directed to enable it
  try {
    await AsyncStorage.setItem(OVERLAY_ACK_KEY, "true");
  } catch (_) {}

  // 1. If native module is available, let it open the intent
  if (FloatingBubbleModule?.requestPermission) {
    try {
      const res = await FloatingBubbleModule.requestPermission();
      if (res) return true;
    } catch (_) {}
  }

  // 2. Direct intent: Jump right to "Display over other apps" for this specific app
  const pkg = Application.applicationId || "com.taskercompany.company";
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.MANAGE_OVERLAY_PERMISSION,
      { data: `package:${pkg}` }
    );
    return true;
  } catch (err1) {
    try {
      await Linking.sendIntent("android.settings.action.MANAGE_OVERLAY_PERMISSION");
      return true;
    } catch (err2) {
      await Linking.openSettings();
      return true;
    }
  }
}


/**
 * Show the native system bubble over other apps
 * @param workOrderNumber - The active work order code (e.g. "WO-1042")
 */
export async function showSystemFloatingBubble(
  workOrderNumber: string
): Promise<boolean> {
  if (Platform.OS !== "android" || !FloatingBubbleModule) return false;
  try {
    const hasPerm = await checkSystemOverlayPermission();
    if (!hasPerm) {
      console.log("[FloatingBubble] SYSTEM_ALERT_WINDOW not granted, skipping show");
      return false;
    }
    return await FloatingBubbleModule.showBubble(workOrderNumber);
  } catch (err) {
    console.warn("[FloatingBubble] showBubble error:", err);
    return false;
  }
}

/**
 * Hide and remove the native system bubble from the screen
 */
export async function hideSystemFloatingBubble(): Promise<boolean> {
  if (Platform.OS !== "android" || !FloatingBubbleModule) return false;
  try {
    return await FloatingBubbleModule.hideBubble();
  } catch (err) {
    console.warn("[FloatingBubble] hideBubble error:", err);
    return false;
  }
}

/**
 * Automatically show the native system bubble when the driver minimizes/swipes away the app,
 * and automatically hide it when the driver brings the app back to foreground.
 *
 * @param workOrderNumber - Active work order number
 * @returns cleanup function to unregister the AppState listener and hide the bubble
 */
export function setupSystemOverlayAppStateSync(workOrderNumber: string): () => void {
  if (Platform.OS !== "android") return () => {};

  let currentAppState = AppState.currentState;

  const subscription = AppState.addEventListener(
    "change",
    (nextState: AppStateStatus) => {
      if (
        currentAppState.match(/active/) &&
        (nextState === "background" || nextState === "inactive")
      ) {
        // Vendor left the app (e.g. switched to Google Maps) -> SHOW BUBBLE OVER MAPS
        showSystemFloatingBubble(workOrderNumber).catch(() => {});
      } else if (
        currentAppState.match(/background|inactive/) &&
        nextState === "active"
      ) {
        // Vendor returned to the Tasker app -> HIDE BUBBLE
        hideSystemFloatingBubble().catch(() => {});
      }

      currentAppState = nextState;
    }
  );

  return () => {
    subscription.remove();
    hideSystemFloatingBubble().catch(() => {});
  };
}
