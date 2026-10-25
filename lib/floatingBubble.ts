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
  return false;
}

/**
 * Open Android Settings page to allow "Display over other apps" (Disabled)
 */
export async function requestSystemOverlayPermission(): Promise<boolean> {
  return false;
}

/**
 * Show the native system bubble over other apps (Disabled)
 */
export async function showSystemFloatingBubble(
  workOrderNumber: string
): Promise<boolean> {
  return false;
}

/**
 * Hide and remove the native system bubble from the screen (Disabled)
 */
export async function hideSystemFloatingBubble(): Promise<boolean> {
  return true;
}

/**
 * System overlay AppState sync (Disabled)
 */
export function setupSystemOverlayAppStateSync(workOrderNumber: string): () => void {
  return () => {};
}
