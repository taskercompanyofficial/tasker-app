import * as Location from "expo-location";
import { AppState, AppStateStatus, Platform } from "react-native";
import Toast from "react-native-toast-message";

export const VENDOR_BG_LOCATION_TASK = "TASKER_VENDOR_BG_LOCATION_TASK";

/**
 * Request Vendor Background Location Permissions
 */
export async function requestVendorBackgroundLocationPermissions(): Promise<boolean> {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      Toast.show({
        type: "error",
        text1: "Location Required",
        text2: "Foreground location access is needed for live navigation.",
      });
      return false;
    }

    // Request background location permission for vendors
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      console.warn("[VendorBGLocation] Background location permission denied by user");
    }

    return true;
  } catch (err) {
    console.warn("[VendorBGLocation] Permission error:", err);
    return false;
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
          notificationTitle: `Navigation Active #${workOrderNumber}`,
          notificationBody: customerName
            ? `Navigating to ${customerName} • Live background tracking active`
            : "Live background navigation active",
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
            text1: "Navigation Running in Background",
            text2: `Tasker is tracking live location for #${workOrderNumber}`,
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
