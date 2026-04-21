import axios from "axios";
import { useAuthStore } from "@/context/auth-store";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { APP_LOGS_INGEST_URL } from "@/lib/api-endpoints";

const myAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Add request interceptor to inject token from auth store
myAxios.interceptors.request.use(
  (config) => {
    try {
      // getState() is synchronous — no race conditions, no async needed
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.Accept = "application/json";

        // Don't override Content-Type if it's already set (e.g., for FormData)
        if (!config.headers["Content-Type"]) {
          config.headers["Content-Type"] = "application/json";
        }
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Track if we're already handling an auth error to prevent multiple redirects
let isHandlingAuthError = false;

// Add response interceptor for error handling
myAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error?.config?.url as string | undefined;
    if (requestUrl && requestUrl.includes(APP_LOGS_INGEST_URL)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Handle 401 Unauthorized or 403 Forbidden (token expired or invalid)
    if ((status === 401 || status === 403) && !isHandlingAuthError) {
      isHandlingAuthError = true;

      const authState = useAuthStore.getState();
      const currentMode = authState.appMode;
      const { signOutMode, signOut } = authState;

      if (authState.token) {
        console.warn(`Auth error ${status} on mode=${currentMode}. Signing out current mode only.`);

        Toast.show({
          type: "error",
          text1: "Session Expired",
          text2: "Please sign in again",
        });

        if (currentMode) {
          // Only sign out the current mode — preserve other mode sessions
          await signOutMode(currentMode);

          // After signing out this mode, check if another session is available
          const next = useAuthStore.getState();
          if (next.appMode === "vendor" || next.appMode === "vendor_staff") {
            router.replace("/vendor/(tabs)/dashboard");
          } else if (next.appMode === "customer") {
            router.replace("/customer/(tabs)");
          } else {
            router.replace("/auth/role-selection");
          }
        } else {
          await signOut();
          router.replace("/auth/role-selection");
        }
      }

      setTimeout(() => {
        isHandlingAuthError = false;
      }, 1000);
    }

    console.error("Response error:", message);
    return Promise.reject(error);
  }
);

export default myAxios;

