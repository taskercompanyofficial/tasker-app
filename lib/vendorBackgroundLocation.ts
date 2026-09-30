import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as IntentLauncher from "expo-intent-launcher";
import * as Application from "expo-application";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";

import Toast from "react-native-toast-message";

export const VENDOR_BG_LOCATION_TASK = "TASKER_VENDOR_BG_LOCATION_TASK";

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
 * Request Android Overlay Permission ("Display over other apps" / SYSTEM_ALERT_WINDOW)
 * Allows Tasker floating logo/bubble and popups when the app is minimized.
 */
export async function requestVendorOverlayPermission(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Linking.sendIntent("android.settings.action.MANAGE_OVERLAY_PERMISSION");
  } catch (err) {
    try {
      await Linking.openSettings();
    } catch (e) {
      console.warn("[VendorBGLocation] Overlay settings open error:", e);
    }
  }
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
 * Request Vendor Foreground + Background Location Permissions & Notifications
 */
export async function requestVendorBackgroundLocationPermissions(): Promise<boolean> {
  try {
    // 1. Foreground location ("While using the app")
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      Toast.show({
        type: "error",
        text1: "Location Required",
        text2: "Location access is needed for live navigation.",
      });
      return false;
    }

    // 2. Background location — shows system dialog on Android 10+
    //    On iOS this upgrades the permission to "Always Allow"
    if (!isExpoGo) {
      try {
        await Location.requestBackgroundPermissionsAsync();
        // Proceed even if background is denied — foreground task still works
      } catch (_) {
        // Some older device APIs don't support this call
      }
    }

    // 3. Notifications for the Android Foreground Service banner
    await requestVendorNotificationPermissions();

    return true;
  } catch (err) {
    console.warn("[VendorBGLocation] Permission error:", err);
    return false;
  }
}

/**
 * Start Vendor Background Navigation
 *
 * - Stores work order context in AsyncStorage for the background task to read
 * - Starts expo-location background updates (foreground service on Android)
 * - The task handler is defined in tasks/vendorLocationTask.ts which MUST be
 *   imported at the app root (_layout.tsx) before any navigation loads
 *
 * @param workOrderId     - DB id of the active work order (passed to backend ping)
 * @param workOrderNumber - Human-readable number shown in the notification
 * @param customerName    - Optional customer name for the notification body
 */
export async function startVendorBackgroundNavigation(
  workOrderId: string | number,
  workOrderNumber: string,
  customerName?: string,
): Promise<boolean> {
  try {
    // Expo Go doesn't support custom native background tasks
    if (isExpoGo) {
      console.log("[VendorBGLocation] Expo Go — background task skipped");
      return true;
    }

    const hasPermissions = await requestVendorBackgroundLocationPermissions();
    if (!hasPermissions) return false;

    // Persist work order ID so the background task can send it in each ping
    await AsyncStorage.setItem("active_work_order_id", String(workOrderId));
    // auth_token & app_mode are synced separately in auth-store.ts persistState()

    // Guard against double-start
    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
      VENDOR_BG_LOCATION_TASK,
    ).catch(() => false);

    if (alreadyRunning) {
      console.log("[VendorBGLocation] Task already running — skipping start");
      return true;
    }

    await Location.startLocationUpdatesAsync(VENDOR_BG_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,

      // Fire every 4s OR when moved 8m (whichever comes first)
      timeInterval: 4000,
      distanceInterval: 8,

      // Android: persistent Foreground Service notification (required for reliable GPS)
      foregroundService: {
        notificationTitle: "On The Way",
        notificationBody: customerName
          ? `Heading to ${customerName} • Job #${workOrderNumber}`
          : `Live tracking active • Job #${workOrderNumber}`,
        notificationColor: "#10B981",
        killServiceOnDestroy: false, // survive force-close
      },

      // iOS: show the blue bar at the top of the screen
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      mayShowUserSettingsDialog: true,
    });

    console.log("[VendorBGLocation] Background task started ✅");
    return true;
  } catch (err) {
    console.warn("[VendorBGLocation] Start error:", err);
    return false;
  }
}

/**
 * Stop Vendor Background Location Task
 * Call when the trip ends or the vendor goes offline.
 */
export async function stopVendorBackgroundNavigation(): Promise<void> {
  try {
    await AsyncStorage.removeItem("active_work_order_id");

    if (isExpoGo) return;

    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      VENDOR_BG_LOCATION_TASK,
    ).catch(() => false);

    if (isRunning) {
      await Location.stopLocationUpdatesAsync(VENDOR_BG_LOCATION_TASK);
      console.log("[VendorBGLocation] Background task stopped ✅");
    }
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
 * Returns true for isReady only when Foreground, Background ("Allow all the time"),
 * and Android Overlay ("Display over other apps") are all granted.
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

  // 1. Foreground Location
  const fg = await Location.getForegroundPermissionsAsync();
  const hasForeground = fg.status === "granted";

  // 2. Background Location ("Allow all the time")
  let hasBackground = false;
  if (hasForeground) {
    const bg = await Location.getBackgroundPermissionsAsync();
    hasBackground = bg.status === "granted";
  }

  // 3. Display over other apps (Android only)
  let hasOverlay = true;
  if (Platform.OS === "android") {
    hasOverlay = await checkSystemOverlayPermission();
  }

  return {
    hasForeground,
    hasBackground,
    hasOverlay,
    isReady: hasForeground && hasBackground && hasOverlay,
  };
}

