import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as IntentLauncher from "expo-intent-launcher";
import * as Application from "expo-application";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";

import Toast from "react-native-toast-message";
import axios from "axios";
import { BACKEND_URL } from "@/lib/api-endpoints";

export const VENDOR_BG_LOCATION_TASK = "TASKER_VENDOR_BG_LOCATION_TASK";

let iosLocationSubscription: Location.LocationSubscription | null = null;

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";
export const isDevOrExpoGo = isExpoGo;

/**
 * Request Notification Permissions (for Foreground Service Banner and Job Alerts)
 */
export async function requestVendorNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (err) {
    console.warn("[VendorBGLocation] Notification permission error:", err);
    return false;
  }
}

/**
 * Request Android Overlay Permission (No-op when SYSTEM_ALERT_WINDOW is disabled)
 */
export async function requestVendorOverlayPermission(): Promise<void> {
  return;
}

/**
 * Request Vendor Battery Optimization Exemption
 * Keeps live GPS, background tasks, and incoming job alerts alive when the device is locked or minimized.
 */
export async function requestVendorBatteryOptimizationIgnore(): Promise<void> {
  if (Platform.OS !== "android") return;
  const pkg = Application.applicationId || "com.taskercompany.company";
  try {
    // Shows direct Android system prompt: "Let Tasker always run in background? [Allow]"
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      { data: `package:${pkg}` }
    );
  } catch (err1) {
    try {
      // Fallback: Open Battery Optimization screen
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
    } catch (err2) {
      await Linking.openSettings();
    }
  }
}


/**
 * Helper to ping vendor location to backend (used by iOS foreground tracking)
 */
async function pingVendorLocationToBackend(loc: Location.LocationObject, workOrderId: string | number) {
  try {
    const [token, appMode] = await Promise.all([
      AsyncStorage.getItem("bg_auth_token"),
      AsyncStorage.getItem("bg_app_mode"),
    ]);

    if (!token) return;

    const prefix = appMode === "vendor_staff" ? "vendor-staff" : "vendor";
    const targetUrl = `${BACKEND_URL}/api/${prefix}/location/ping`;

    const payload = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      heading: loc.coords.heading ?? null,
      speed: loc.coords.speed ?? null,
      accuracy: loc.coords.accuracy ?? null,
      battery_level: 100,
      is_charging: false,
      work_order_id: Number(workOrderId),
      app_state: "foreground",
    };

    await axios.post(targetUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      timeout: 6000,
    });
  } catch (err: any) {
    console.warn("[VendorLocation:iOS] Ping error:", err?.message);
  }
}

/**
 * Start iOS Foreground Location Watcher
 */
export async function startIosForegroundTracking(workOrderId: string | number): Promise<void> {
  if (iosLocationSubscription) {
    iosLocationSubscription.remove();
    iosLocationSubscription = null;
  }

  try {
    iosLocationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 4000,
        distanceInterval: 8,
      },
      (loc) => {
        void pingVendorLocationToBackend(loc, workOrderId);
      }
    );
  } catch (e) {
    console.warn("[VendorLocation:iOS] watchPositionAsync error:", e);
  }
}

/**
 * Stop iOS Foreground Location Watcher
 */
export function stopIosForegroundTracking(): void {
  if (iosLocationSubscription) {
    iosLocationSubscription.remove();
    iosLocationSubscription = null;
  }
}

/**
 * Request Vendor Foreground Location Permissions & Notifications
 */
export async function requestVendorBackgroundLocationPermissions(): Promise<boolean> {
  try {
    // Foreground location ("While using the app")
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      Toast.show({
        type: "error",
        text1: "Location Required",
        text2: "Location access is needed for live navigation.",
      });
      return false;
    }

    // Notifications
    await requestVendorNotificationPermissions();

    return true;
  } catch (err) {
    console.warn("[VendorBGLocation] Permission error:", err);
    return false;
  }
}

/**
 * Start Vendor Navigation
 *
 * - Stores work order context in AsyncStorage for pings
 * - Starts foreground watchPositionAsync compliant with foreground-only location
 */
export async function startVendorBackgroundNavigation(
  workOrderId: string | number,
  workOrderNumber: string,
  customerName?: string,
): Promise<boolean> {
  try {
    const hasPermissions = await requestVendorBackgroundLocationPermissions();
    if (!hasPermissions) return false;

    // Persist work order ID so the location service can send it in each ping
    await AsyncStorage.setItem("active_work_order_id", String(workOrderId));

    await startIosForegroundTracking(workOrderId);
    console.log("[VendorLocation] Foreground tracking started ✅");

    return true;
  } catch (err) {
    console.warn("[VendorBGLocation] Start error:", err);
    return false;
  }
}

/**
 * Stop Vendor Location Task
 * Call when the trip ends or the vendor goes offline.
 */
export async function stopVendorBackgroundNavigation(): Promise<void> {
  try {
    await AsyncStorage.removeItem("active_work_order_id");
    stopIosForegroundTracking();
    console.log("[VendorLocation] Foreground tracking stopped ✅");
  } catch (err) {
    console.warn("[VendorBGLocation] Stop error:", err);
  }
}

/**
 * Setup AppState change listener for Vendor when app is minimized / backgrounded
 */
export function setupVendorAppStateNavigationNotice(workOrderNumber: string) {
  let appState = AppState.currentState;

  const subscription = AppState.addEventListener(
    "change",
    (nextAppState: AppStateStatus) => {
      if (
        appState.match(/active/) &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        if (Platform.OS === "android" || Platform.OS === "ios") {
          Toast.show({
            type: "info",
            text1: "Tasker Active in Background",
            text2: `Live tracking is active for #${workOrderNumber}`,
            position: "top",
            visibilityTime: 4000,
          });
        }
      }
      appState = nextAppState;
    },
  );

  return () => {
    subscription.remove();
  };
}

import { checkSystemOverlayPermission } from "@/lib/floatingBubble";

export interface VendorPermissionsCheck {
  hasForeground: boolean;
  hasBackground: boolean;
  hasOverlay: boolean;
  isReady: boolean;
}

/**
 * Checks all required permissions before allowing the vendor to go ONLINE.
 * Returns true for isReady when Foreground location is granted.
 */
export async function checkVendorOnlineReadiness(): Promise<VendorPermissionsCheck> {
  if (isExpoGo) {
    return {
      hasForeground: true,
      hasBackground: true,
      hasOverlay: true,
      isReady: true,
    };
  }

  // Foreground Location ("While using the app")
  const fg = await Location.getForegroundPermissionsAsync();
  const hasForeground = fg.status === "granted";

  return {
    hasForeground,
    hasBackground: true,
    hasOverlay: true,
    isReady: hasForeground,
  };
}

