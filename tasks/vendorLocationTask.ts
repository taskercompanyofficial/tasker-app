/**
 * Vendor Background Location Task
 *
 * ⚠️  MUST be imported at the app root (_layout.tsx) before any navigation.
 *     TaskManager.defineTask() must run at module load time — not inside a component.
 *
 * When the vendor app is backgrounded or the screen is locked, the OS periodically
 * wakes this task and delivers GPS coordinates. We POST them to the Laravel backend
 * so the customer's map pin keeps moving in real time.
 */
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BACKEND_URL } from "@/lib/api-endpoints";

export const VENDOR_LOCATION_TASK = "TASKER_VENDOR_BG_LOCATION_TASK";

TaskManager.defineTask(VENDOR_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("❌ [BG-TASK:ERROR] TaskManager error:", error.message);
    return;
  }

  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations?.[0];
  if (!loc) return;

  console.log(
    `📡 [BG-TASK:LOCATION] OS GPS event: Lat ${loc.coords.latitude.toFixed(5)}, Lng ${loc.coords.longitude.toFixed(5)}, Acc: ${loc.coords.accuracy?.toFixed(1) ?? "?"}m`
  );

  try {
    // Read context written by startVendorBackgroundNavigation()
    const [token, workOrderId, appMode] = await Promise.all([
      AsyncStorage.getItem("bg_auth_token"),
      AsyncStorage.getItem("active_work_order_id"),
      AsyncStorage.getItem("bg_app_mode"),
    ]);

    // No active trip → nothing to ping
    if (!token || !workOrderId) {
      console.warn(
        `⚠️ [BG-TASK:SKIPPED] Missing context: token=${!!token}, active_work_order_id=${workOrderId}`
      );
      return;
    }

    const prefix =
      appMode === "vendor_staff" ? "vendor-staff" : "vendor";

    const targetUrl = `${BACKEND_URL}/api/${prefix}/location/ping`;
    console.log(
      `🚀 [BG-TASK:POSTING] -> ${targetUrl} (Order #${workOrderId})`
    );

    const payload = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      heading: loc.coords.heading ?? null,
      speed: loc.coords.speed ?? null,
      accuracy: loc.coords.accuracy ?? null,
      battery_level: 100,
      is_charging: false,
      work_order_id: Number(workOrderId),
      app_state: "background",
    };

    const res = await axios.post(targetUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      timeout: 6000, // Must complete fast — OS has a short background window
    });

    console.log(
      `✅ [BG-TASK:SUCCESS] Location ping accepted by backend! Status: ${res.status}`,
      res.data
    );
  } catch (err: any) {
    console.error(
      "❌ [BG-TASK:FAILED] Location ping failed:",
      err?.response?.status ?? err?.code ?? "Network Error",
      err?.response?.data ?? err?.message
    );
  }
});

