import { BACKEND_URL, GET_ME_USER_URL, VENDOR_ME_URL, VENDOR_STAFF_ME_URL } from "@/lib/api-endpoints";
import { User } from "@/types/user";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

const TOKEN_KEY = "session";
const TOKEN_CUSTOMER_KEY = "session_customer";
const TOKEN_VENDOR_KEY = "session_vendor";
const TOKEN_VENDOR_STAFF_KEY = "session_vendor_staff";
const APP_MODE_KEY = "app_mode";

type AppMode = "customer" | "vendor" | "vendor_staff";

interface Session {
  isLoading: boolean;
  token?: string | null;
  isAuthenticated: boolean;
  user: User | null;
  appMode: AppMode | null;
  customerToken?: string | null;
  vendorToken?: string | null;
  vendorStaffToken?: string | null;
  customerUser?: User | null;
  vendorUser?: User | null;
  vendorStaffUser?: User | null;
  fetchError?: string | null;
}

const AuthContext = createContext<{
  signIn: (token: string, mode?: AppMode) => Promise<void>;
  signOut: () => Promise<void>;
  signOutMode: (mode: AppMode) => Promise<void>;
  refetchUser: (mode?: AppMode) => Promise<void>;
  setAppMode: (mode: AppMode) => Promise<void>;
  session: Session;
}>({
  signIn: async () => { },
  signOut: async () => { },
  signOutMode: async () => { },
  refetchUser: async () => { },
  setAppMode: async () => { },
  session: {
    isLoading: true,
    token: null,
    isAuthenticated: false,
    user: null,
    appMode: null,
    customerToken: null,
    vendorToken: null,
    vendorStaffToken: null,
    customerUser: null,
    vendorUser: null,
    vendorStaffUser: null,
    fetchError: null,
  },
});

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session>({
    isLoading: true,
    token: null,
    isAuthenticated: false,
    user: null,
    appMode: null,
    customerToken: null,
    vendorToken: null,
    vendorStaffToken: null,
    customerUser: null,
    vendorUser: null,
    vendorStaffUser: null,
    fetchError: null,
  });
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      setSession((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }, 7000);
    (async () => {
      try {
        const [legacy, storedCustomer, storedVendor, storedVendorStaff, storedAppMode] =
          await Promise.all([
            SecureStore.getItemAsync(TOKEN_KEY),
            SecureStore.getItemAsync(TOKEN_CUSTOMER_KEY),
            SecureStore.getItemAsync(TOKEN_VENDOR_KEY),
            SecureStore.getItemAsync(TOKEN_VENDOR_STAFF_KEY),
            SecureStore.getItemAsync(APP_MODE_KEY),
          ]);

        let customerToken = storedCustomer;
        let vendorToken = storedVendor;
        let vendorStaffToken = storedVendorStaff;

        // Backward compatibility
        if (legacy && !customerToken && !vendorToken) {
          if (storedAppMode === "vendor") {
            vendorToken = legacy;
            await SecureStore.setItemAsync(TOKEN_VENDOR_KEY, legacy);
          } else {
            customerToken = legacy;
            await SecureStore.setItemAsync(TOKEN_CUSTOMER_KEY, legacy);
          }
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }

        const [customerUser, vendorUser, vendorStaffUser] = await Promise.all([
          customerToken ? fetchUser(customerToken, "customer") : Promise.resolve(null),
          vendorToken ? fetchUser(vendorToken, "vendor") : Promise.resolve(null),
          vendorStaffToken ? fetchUser(vendorStaffToken, "vendor_staff") : Promise.resolve(null),
        ]);

        let activeMode: AppMode | null = null;
        const hasCustomer = !!customerToken;
        const hasVendor = !!vendorToken;
        const hasVendorStaff = !!vendorStaffToken;

        if (storedAppMode === "vendor_staff" && hasVendorStaff) {
          activeMode = "vendor_staff";
        } else if (storedAppMode === "vendor" && hasVendor) {
          activeMode = "vendor";
        } else if (storedAppMode === "customer" && hasCustomer) {
          activeMode = "customer";
        } else if (hasVendorStaff) {
          activeMode = "vendor_staff";
        } else if (hasVendor) {
          activeMode = "vendor";
        } else if (hasCustomer) {
          activeMode = "customer";
        }

        try {
          if (activeMode) {
            await SecureStore.setItemAsync(APP_MODE_KEY, activeMode);
          } else {
            await SecureStore.deleteItemAsync(APP_MODE_KEY);
          }
        } catch { }

        const activeToken =
          activeMode === "vendor_staff"
            ? vendorStaffToken
            : activeMode === "vendor"
              ? vendorToken
              : activeMode === "customer"
                ? customerToken
                : null;
        const activeUser =
          activeMode === "vendor_staff"
            ? vendorStaffUser
            : activeMode === "vendor"
              ? vendorUser
              : activeMode === "customer"
                ? customerUser
                : null;
        const anyFail =
          (customerToken && !customerUser) || (vendorToken && !vendorUser) || (vendorStaffToken && !vendorStaffUser);

        setSession({
          isLoading: false,
          token: activeToken || null,
          isAuthenticated: !!(customerToken || vendorToken || vendorStaffToken),
          user: activeUser,
          appMode: activeMode,
          customerToken: customerToken || null,
          vendorToken: vendorToken || null,
          vendorStaffToken: vendorStaffToken || null,
          customerUser,
          vendorUser,
          vendorStaffUser,
          fetchError: anyFail ? "Unable to fetch account data" : null,
        });
      } catch {
        setSession((prev) => ({
          ...prev,
          isLoading: false,
          token: null,
          isAuthenticated: false,
          user: null,
          appMode: null,
          customerToken: null,
          vendorToken: null,
          vendorStaffToken: null,
          customerUser: null,
          vendorUser: null,
          vendorStaffUser: null,
          fetchError: "Unable to fetch account data",
        }));
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
        }
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const fetchUser = async (token: string, mode?: AppMode): Promise<User | null> => {
    try {
      const endpoint = mode === "vendor_staff" ? VENDOR_STAFF_ME_URL : mode === "vendor" ? VENDOR_ME_URL : GET_ME_USER_URL;
      const { data } = await axios.get<{ user: unknown }>(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data.user as User;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };

  const signIn = async (token: string, mode?: AppMode) => {
    const resolvedMode: AppMode = mode ?? (session.appMode ?? "customer");
    const userData = await fetchUser(token, resolvedMode);
    if (resolvedMode === "vendor_staff") {
      await SecureStore.setItemAsync(TOKEN_VENDOR_STAFF_KEY, token);
      setSession((prev) => ({
        ...prev,
        vendorStaffToken: token,
        vendorStaffUser: userData,
        token: prev.appMode === "vendor_staff" ? token : prev.token,
        user: prev.appMode === "vendor_staff" ? userData : prev.user,
        isAuthenticated: !!token || !!prev.customerToken || !!prev.vendorToken,
      }));
    } else if (resolvedMode === "vendor") {
      await SecureStore.setItemAsync(TOKEN_VENDOR_KEY, token);
      setSession((prev) => ({
        ...prev,
        vendorToken: token,
        vendorUser: userData,
        token: prev.appMode === "vendor" ? token : prev.token,
        user: prev.appMode === "vendor" ? userData : prev.user,
        isAuthenticated: !!token || !!prev.customerToken || !!prev.vendorStaffToken,
      }));
    } else {
      await SecureStore.setItemAsync(TOKEN_CUSTOMER_KEY, token);
      setSession((prev) => ({
        ...prev,
        customerToken: token,
        customerUser: userData,
        token: prev.appMode === "customer" ? token : prev.token,
        user: prev.appMode === "customer" ? userData : prev.user,
        isAuthenticated: !!token || !!prev.vendorToken || !!prev.vendorStaffToken,
      }));
    }
  };

  const signOut = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_CUSTOMER_KEY),
      SecureStore.deleteItemAsync(TOKEN_VENDOR_KEY),
      SecureStore.deleteItemAsync(TOKEN_VENDOR_STAFF_KEY),
      SecureStore.deleteItemAsync(APP_MODE_KEY),
    ]);
    setSession((prev) => ({
      ...prev,
      token: null,
      user: null,
      isAuthenticated: false,
      customerToken: null,
      vendorToken: null,
      vendorStaffToken: null,
      customerUser: null,
      vendorUser: null,
      vendorStaffUser: null,
      appMode: null,
    }));
  };

  const signOutMode = async (mode: AppMode) => {
    if (mode === "vendor_staff") {
      await SecureStore.deleteItemAsync(TOKEN_VENDOR_STAFF_KEY);
      setSession((prev) => {
        const fallbackMode = prev.vendorToken ? "vendor" : prev.customerToken ? "customer" : null;
        return {
          ...prev,
          vendorStaffToken: null,
          vendorStaffUser: null,
          appMode: fallbackMode,
          token: fallbackMode === "vendor" ? prev.vendorToken || null : fallbackMode === "customer" ? prev.customerToken || null : null,
          user: fallbackMode === "vendor" ? prev.vendorUser || null : fallbackMode === "customer" ? prev.customerUser || null : null,
          isAuthenticated: !!(prev.customerToken || prev.vendorToken),
        };
      });
    } else if (mode === "vendor") {
      await SecureStore.deleteItemAsync(TOKEN_VENDOR_KEY);
      setSession((prev) => {
        const fallbackMode = prev.customerToken ? "customer" : prev.vendorStaffToken ? "vendor_staff" : null;
        return {
          ...prev,
          vendorToken: null,
          vendorUser: null,
          appMode: fallbackMode,
          token: fallbackMode === "customer" ? prev.customerToken || null : fallbackMode === "vendor_staff" ? prev.vendorStaffToken || null : null,
          user: fallbackMode === "customer" ? prev.customerUser || null : fallbackMode === "vendor_staff" ? prev.vendorStaffUser || null : null,
          isAuthenticated: !!(prev.customerToken || prev.vendorStaffToken),
        };
      });
    } else {
      await SecureStore.deleteItemAsync(TOKEN_CUSTOMER_KEY);
      setSession((prev) => {
        const fallbackMode = prev.vendorToken ? "vendor" : prev.vendorStaffToken ? "vendor_staff" : null;
        return {
          ...prev,
          customerToken: null,
          customerUser: null,
          appMode: fallbackMode,
          token: fallbackMode === "vendor" ? prev.vendorToken || null : fallbackMode === "vendor_staff" ? prev.vendorStaffToken || null : null,
          user: fallbackMode === "vendor" ? prev.vendorUser || null : fallbackMode === "vendor_staff" ? prev.vendorStaffUser || null : null,
          isAuthenticated: !!(prev.vendorToken || prev.vendorStaffToken),
        };
      });
    }
    try {
      const fallback = session.vendorToken ? "vendor" : session.customerToken ? "customer" : session.vendorStaffToken ? "vendor_staff" : null;
      if (fallback) {
        await SecureStore.setItemAsync(APP_MODE_KEY, fallback);
      } else {
        await SecureStore.deleteItemAsync(APP_MODE_KEY);
      }
    } catch { }
  };

  const refetchUser = async (mode?: AppMode) => {
    const useMode = mode ?? session.appMode;
    if (!useMode) return;
    const token =
      useMode === "vendor_staff" ? session.vendorStaffToken : useMode === "vendor" ? session.vendorToken : session.customerToken;
    if (!token) return;
    const userData = await fetchUser(token, useMode);
    setSession((prev) => {
      const next = { ...prev };
      if (useMode === "vendor_staff") {
        next.vendorStaffUser = userData;
      } else if (useMode === "vendor") {
        next.vendorUser = userData;
      } else {
        next.customerUser = userData;
      }
      if (prev.appMode === useMode) {
        next.user = userData;
      }
      next.fetchError = userData ? null : "Unable to fetch account data";
      return next;
    });
  };

  const setAppMode = async (mode: AppMode) => {
    try {
      await SecureStore.setItemAsync(APP_MODE_KEY, mode);
    } catch { }
    setSession((prev) => ({
      ...prev,
      appMode: mode,
      token: mode === "vendor_staff" ? prev.vendorStaffToken || null : mode === "vendor" ? prev.vendorToken || null : prev.customerToken || null,
      user: mode === "vendor_staff" ? prev.vendorStaffUser || null : mode === "vendor" ? prev.vendorUser || null : prev.customerUser || null,
      isAuthenticated: !!(prev.customerToken || prev.vendorToken || prev.vendorStaffToken),
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        signOutMode,
        refetchUser,
        setAppMode,
        session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
