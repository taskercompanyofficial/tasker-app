import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "session";
const TOKEN_CUSTOMER_KEY = "session_customer";
const TOKEN_VENDOR_KEY = "session_vendor";
const TOKEN_VENDOR_STAFF_KEY = "session_vendor_staff";
const APP_MODE_KEY = "app_mode";

const myAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Add request interceptor to inject token
myAxios.interceptors.request.use(
  async (config) => {
    try {
      const mode = (await SecureStore.getItemAsync(APP_MODE_KEY)) as
        | "customer"
        | "vendor"
        | "vendor_staff"
        | null;
      const activeToken =
        mode === "vendor_staff"
          ? await SecureStore.getItemAsync(TOKEN_VENDOR_STAFF_KEY)
          : mode === "vendor"
            ? await SecureStore.getItemAsync(TOKEN_VENDOR_KEY)
            : await SecureStore.getItemAsync(TOKEN_CUSTOMER_KEY);
      // Backward compatibility: fall back to legacy single token
      const token = activeToken || (await SecureStore.getItemAsync(TOKEN_KEY));
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

// Add response interceptor for error handling
myAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Response error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default myAxios;
