import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { useAuthStore } from "@/context/auth-store";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { APP_LOGS_INGEST_URL } from "@/lib/api-endpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";

const myAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Cache prefix to separate network cache from other AsyncStorage data
const CACHE_PREFIX = "@network_cache_";

// Helper to generate cache key based on URL and params
const getCacheKey = (config: InternalAxiosRequestConfig) => {
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${CACHE_PREFIX}${url}_${params}`;
};

// Add request interceptor to inject token from auth store
myAxios.interceptors.request.use(
  (config) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.Accept = "application/json";

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

let isHandlingAuthError = false;

// Add response interceptor for error handling and caching
myAxios.interceptors.response.use(
  async (response: AxiosResponse) => {
    // Cache successful GET requests for offline support
    if (response.config.method?.toLowerCase() === "get") {
      try {
        const cacheKey = getCacheKey(response.config);
        // Only cache the data part to save space
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch (e) {
        console.warn("Failed to cache API response:", e);
      }
    }
    return response;
  },
  async (error) => {
    const requestUrl = error?.config?.url as string | undefined;
    if (requestUrl && requestUrl.includes(APP_LOGS_INGEST_URL)) {
      return Promise.reject(error);
    }

    // --- OFFLINE SUPPORT FALLBACK ---
    // If it's a network error (no response)
    if (!error.response) {
      const method = error.config?.method?.toLowerCase();

      if (method === "get") {
        try {
          const cacheKey = getCacheKey(error.config);
          const cachedData = await AsyncStorage.getItem(cacheKey);

          if (cachedData) {
            console.log(`[Offline Mode] Serving cached data for: ${requestUrl}`);
            return Promise.resolve({
              data: JSON.parse(cachedData),
              status: 200,
              statusText: "OK",
              headers: {},
              config: error.config,
            });
          }
        } catch (e) {
          console.warn("Failed to retrieve cached data:", e);
        }
      } else if (method === "post" || method === "put" || method === "delete") {
        try {
          // Enqueue the mutation action for later sync
          const { useOfflineStore } = require("@/context/offline-store");
          useOfflineStore.getState().enqueueAction({
            url: error.config.url,
            method: error.config.method,
            data: error.config.data,
            headers: error.config.headers,
          });

          console.log(`[Offline Mode] Queued action: ${method.toUpperCase()} ${requestUrl}`);
          Toast.show({
            type: "info",
            text1: "Action Queued",
            text2: "Will submit when internet is restored.",
          });

          // Return a dummy successful response (202 Accepted) so the UI doesn't crash
          return Promise.resolve({
            data: { queued: true, message: "Action stored offline" },
            status: 202,
            statusText: "Accepted",
            headers: {},
            config: error.config,
          });
        } catch (e) {
          console.warn("Failed to queue offline action:", e);
        }
      }
    }

    // --- STANDARD ERROR HANDLING ---
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

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
          await signOutMode(currentMode);

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

