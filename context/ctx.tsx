import { GET_ME_USER_URL, VENDOR_ME_URL } from "@/lib/api-endpoints";
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
const APP_MODE_KEY = "app_mode";

interface Session {
  isLoading: boolean;
  token?: string | null; // Active mode token
  isAuthenticated: boolean; // Either mode authenticated
  user: User | null; // Active mode user
  appMode: "customer" | "vendor";
  customerToken?: string | null;
  vendorToken?: string | null;
  customerUser?: User | null;
  vendorUser?: User | null;
  fetchError?: string | null;
}

const AuthContext = createContext<{
  signIn: (token: string, mode?: "customer" | "vendor") => Promise<void>;
  signOut: () => Promise<void>;
  signOutMode: (mode: "customer" | "vendor") => Promise<void>;
  refetchUser: (mode?: "customer" | "vendor") => Promise<void>;
  setAppMode: (mode: "customer" | "vendor") => Promise<void>;
  session: Session;
}>({
  signIn: async () => {},
  signOut: async () => {},
  signOutMode: async () => {},
  refetchUser: async () => {},
  setAppMode: async () => {},
  session: {
    isLoading: true,
    token: null,
    isAuthenticated: false,
    user: null,
    appMode: "customer",
    customerToken: null,
    vendorToken: null,
    customerUser: null,
    vendorUser: null,
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
    appMode: "customer",
    customerToken: null,
    vendorToken: null,
    customerUser: null,
    vendorUser: null,
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
        const [legacy, storedCustomer, storedVendor, storedAppMode] =
          await Promise.all([
            SecureStore.getItemAsync(TOKEN_KEY),
            SecureStore.getItemAsync(TOKEN_CUSTOMER_KEY),
            SecureStore.getItemAsync(TOKEN_VENDOR_KEY),
            SecureStore.getItemAsync(APP_MODE_KEY),
          ]);

        let customerToken = storedCustomer;
        let vendorToken = storedVendor;

        // Backward compatibility: if legacy token exists, map to current app mode
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

        const [customerUser, vendorUser] = await Promise.all([
          customerToken ? fetchUser(customerToken, "customer") : Promise.resolve(null),
          vendorToken ? fetchUser(vendorToken, "vendor") : Promise.resolve(null),
        ]);

        // Decide active mode based on available sessions:
        // - If only one of the tokens exists, prefer that mode
        // - If both exist, honor stored app mode (default to customer if invalid)
        // - If none exist, default to customer
        let activeMode: "customer" | "vendor" = "customer";
        const hasCustomer = !!customerToken;
        const hasVendor = !!vendorToken;
        if (hasCustomer && !hasVendor) {
          activeMode = "customer";
        } else if (!hasCustomer && hasVendor) {
          activeMode = "vendor";
        } else if (hasCustomer && hasVendor) {
          activeMode =
            storedAppMode === "vendor" || storedAppMode === "customer"
              ? (storedAppMode as "customer" | "vendor")
              : "customer";
        } else {
          activeMode = "customer";
        }
        // Persist resolved app mode for consistency
        try {
          await SecureStore.setItemAsync(APP_MODE_KEY, activeMode);
        } catch {}

        const activeToken = activeMode === "vendor" ? vendorToken : customerToken;
        const activeUser = activeMode === "vendor" ? vendorUser : customerUser;
        const anyFail =
          (customerToken && !customerUser) || (vendorToken && !vendorUser);

        setSession({
          isLoading: false,
          token: activeToken || null,
          isAuthenticated: !!(customerToken || vendorToken),
          user: activeUser,
          appMode: activeMode,
          customerToken: customerToken || null,
          vendorToken: vendorToken || null,
          customerUser,
          vendorUser,
          fetchError: anyFail ? "Unable to fetch account data" : null,
        });
      } catch {
        setSession((prev) => ({
          ...prev,
          isLoading: false,
          token: null,
          isAuthenticated: false,
          user: null,
          appMode: "customer",
          customerToken: null,
          vendorToken: null,
          customerUser: null,
          vendorUser: null,
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

  const fetchUser = async (token: string, mode?: "customer" | "vendor"): Promise<User | null> => {
    try {
      const endpoint = mode === "vendor" ? VENDOR_ME_URL : GET_ME_USER_URL;
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

  const signIn = async (token: string, mode?: "customer" | "vendor") => {
    const useMode = mode || session.appMode;
    const userData = await fetchUser(token, useMode);
    if (useMode === "vendor") {
      await SecureStore.setItemAsync(TOKEN_VENDOR_KEY, token);
      setSession((prev) => ({
        ...prev,
        vendorToken: token,
        vendorUser: userData,
        token: prev.appMode === "vendor" ? token : prev.token,
        user: prev.appMode === "vendor" ? userData : prev.user,
        isAuthenticated: !!token || !!prev.customerToken,
      }));
    } else {
      await SecureStore.setItemAsync(TOKEN_CUSTOMER_KEY, token);
      setSession((prev) => ({
        ...prev,
        customerToken: token,
        customerUser: userData,
        token: prev.appMode === "customer" ? token : prev.token,
        user: prev.appMode === "customer" ? userData : prev.user,
        isAuthenticated: !!token || !!prev.vendorToken,
      }));
    }
  };

  const signOut = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_CUSTOMER_KEY),
      SecureStore.deleteItemAsync(TOKEN_VENDOR_KEY),
    ]);
    setSession((prev) => ({
      ...prev,
      token: null,
      user: null,
      isAuthenticated: false,
      customerToken: null,
      vendorToken: null,
      customerUser: null,
      vendorUser: null,
    }));
  };

  const signOutMode = async (mode: "customer" | "vendor") => {
    if (mode === "vendor") {
      await SecureStore.deleteItemAsync(TOKEN_VENDOR_KEY);
      setSession((prev) => ({
        ...prev,
        vendorToken: null,
        vendorUser: null,
        appMode: prev.customerToken ? "customer" : "customer",
        token: prev.customerToken || null,
        user: prev.customerUser || null,
        isAuthenticated: !!prev.customerToken,
      }));
    } else {
      await SecureStore.deleteItemAsync(TOKEN_CUSTOMER_KEY);
      setSession((prev) => ({
        ...prev,
        customerToken: null,
        customerUser: null,
        appMode: prev.vendorToken ? "vendor" : "customer",
        token: prev.vendorToken || null,
        user: prev.vendorUser || null,
        isAuthenticated: !!prev.vendorToken,
      }));
    }
  };

  const refetchUser = async (mode?: "customer" | "vendor") => {
    const useMode = mode || session.appMode;
    const token =
      useMode === "vendor" ? session.vendorToken : session.customerToken;
    if (!token) return;
    const userData = await fetchUser(token, useMode);
    setSession((prev) => {
      const next = { ...prev };
      if (useMode === "vendor") {
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

  const setAppMode = async (mode: "customer" | "vendor") => {
    try {
      await SecureStore.setItemAsync(APP_MODE_KEY, mode);
    } catch {}
    setSession((prev) => ({
      ...prev,
      appMode: mode,
      token: mode === "vendor" ? prev.vendorToken || null : prev.customerToken || null,
      user: mode === "vendor" ? prev.vendorUser || null : prev.customerUser || null,
      isAuthenticated: !!(prev.customerToken || prev.vendorToken),
    }));
    // Revalidate both sessions in background
    if (session.customerToken) {
      void refetchUser("customer");
    }
    if (session.vendorToken) {
      void refetchUser("vendor");
    }
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
