import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import Toast from "react-native-toast-message";

export const VENDOR_BG_LOCATION_TASK = "TASKER_VENDOR_BG_LOCATION_TASK";

export const isDevOrExpoGo =
  __DEV__ ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === "expo";

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
    // Open Android "Display over other apps" special access settings for this package
    const url = "package:com.taskercompany.company";
    const supported = await Linking.canOpenURL(url).catch(() => false);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openSettings();
    }
  } catch (err) {
    console.warn("[VendorBGLocation] Overlay settings open error:", err);
    await Linking.openSettings().catch(() => {});
  }
}

/**
 * Request Vendor Battery Optimization Exemption
 * Keeps live GPS, background tasks, and incoming job alerts alive when the device is locked or minimized.
 */
export async function requestVendorBatteryOptimizationIgnore(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Linking.openSettings();
  } catch (err) {
    console.warn("[VendorBGLocation] Battery settings open error:", err);
  }
}

/**
 * Request Vendor Background Location Permissions & Notifications
 */
export async function requestVendorBackgroundLocationPermissions(): Promise<boolean> {
  try {
    // 1. Request Foreground Location
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      Toast.show({
        type: "error",
        text1: "Location Required",
        text2: "Foreground location access is needed for live navigation.",
      });
      return false;
    }

    // 2. Request Notifications for Foreground Service
    await requestVendorNotificationPermissions();

    // In dev / Expo Go mode, skip background permission request as it's unsupported
    if (isDevOrExpoGo) {
      return true;
    }

    // 3. Request Background Location Permission for vendors
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      console.warn("[VendorBGLocation] Background location permission denied by user");
    }

    return true;
  } catch (err) {
    console.warn("[VendorBGLocation] Permission error:", err);
    return isDevOrExpoGo ? true : false;
  }
}

/**
 * Start Vendor Background Location & Foreground Service Notification
 */
export async function startVendorBackgroundNavigation(
  workOrderNumber: string,
  customerName?: string,
): Promise<boolean> {
  try {
    const hasPermissions = await requestVendorBackgroundLocationPermissions();
    if (!hasPermissions) return false;

    // In dev / Expo Go, background location task cannot be registered
    if (isDevOrExpoGo) {
      console.log("[VendorBGLocation] Dev / Expo Go mode: skipping background location task");
      return true;
    }

    // Check if background location task is already running
    const isStarted = await Location.hasStartedLocationUpdatesAsync(
      VENDOR_BG_LOCATION_TASK,
    ).catch(() => false);

    if (!isStarted) {
      await Location.startLocationUpdatesAsync(VENDOR_BG_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 3000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: `Tasker Navigation #${workOrderNumber}`,
          notificationBody: customerName
            ? `Navigating to ${customerName} • Live background tracking active`
            : "Tasker is active in background with live tracking",
          notificationColor: "#2563EB",
        },
      });
    }

    return true;
  } catch (err) {
    console.warn("[VendorBGLocation] Start background tracking fallback:", err);
    return false;
  }
}

/**
 * Stop Vendor Background Location Task
 */
export async function stopVendorBackgroundNavigation(): Promise<void> {
  try {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(
      VENDOR_BG_LOCATION_TASK,
    ).catch(() => false);

    if (isStarted) {
      await Location.stopLocationUpdatesAsync(VENDOR_BG_LOCATION_TASK);
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
        // App closed/backgrounded by vendor
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
