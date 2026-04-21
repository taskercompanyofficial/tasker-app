import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { addDebugLog } from "@/lib/debug-monitor";
import { 
  GET_ME_USER_URL, 
  VENDOR_ME_URL, 
  VENDOR_STAFF_ME_URL 
} from "@/lib/api-endpoints";
import { User } from "@/types/user";

export type AppMode = "customer" | "vendor" | "vendor_staff";

interface AuthState {
  // Common State
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  appMode: AppMode | null;
  fetchError: string | null;

  // Role-specific State
  customerToken: string | null;
  vendorToken: string | null;
  vendorStaffToken: string | null;
  customerUser: User | null;
  vendorUser: User | null;
  vendorStaffUser: User | null;

  // Actions
  signIn: (token: string, mode?: AppMode) => Promise<void>;
  signOut: () => Promise<void>;
  signOutMode: (mode: AppMode) => Promise<void>;
  setAppMode: (mode: AppMode) => Promise<void>;
  refetchUser: (mode?: AppMode) => Promise<void>;
  initialize: () => Promise<void>;
}

type PersistedAuthState = Pick<
  AuthState,
  "customerToken" | "vendorToken" | "vendorStaffToken" | "appMode"
>;

type StoreListener = () => void;

const STORAGE_KEY = "auth-storage";

const initialDataState: Omit<
  AuthState,
  "signIn" | "signOut" | "signOutMode" | "setAppMode" | "refetchUser" | "initialize"
> = {
  isLoading: true,
  isAuthenticated: false,
  token: null,
  user: null,
  appMode: null,
  fetchError: null,
  customerToken: null,
  vendorToken: null,
  vendorStaffToken: null,
  customerUser: null,
  vendorUser: null,
  vendorStaffUser: null,
};

const listeners = new Set<StoreListener>();
const hydrationListeners = new Set<() => void>();

let hydrated = false;

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

const partialize = (state: AuthState): PersistedAuthState => ({
  customerToken: state.customerToken,
  vendorToken: state.vendorToken,
  vendorStaffToken: state.vendorStaffToken,
  appMode: state.appMode,
});

const notify = () => {
  listeners.forEach((listener) => listener());
};

const persistState = async () => {
  try {
    const payload = {
      state: partialize(state),
      version: 0,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[AuthStore] Failed to persist auth state", error);
  }
};

const setState = (
  updater:
    | Partial<AuthState>
    | ((prev: AuthState) => Partial<AuthState> | AuthState),
) => {
  const nextPatch = typeof updater === "function" ? updater(state) : updater;
  const nextState = { ...state, ...nextPatch };

  if (nextState === state) return;

  state = nextState;
  void persistState();
  notify();
};

const getState = () => state;

const actions: Pick<
  AuthState,
  "initialize" | "signIn" | "setAppMode" | "signOut" | "signOutMode" | "refetchUser"
> = {
  initialize: async () => {
    const currentState = getState();
    addDebugLog("auth_initialize_start", {
      appMode: currentState.appMode,
      hasCustomerToken: !!currentState.customerToken,
      hasVendorToken: !!currentState.vendorToken,
      hasVendorStaffToken: !!currentState.vendorStaffToken,
    });

    const { customerToken, vendorToken, vendorStaffToken, appMode } = currentState;

    try {
      const [custU, vendU, staffU] = await Promise.all([
        customerToken ? fetchUser(customerToken, "customer") : Promise.resolve(null),
        vendorToken ? fetchUser(vendorToken, "vendor") : Promise.resolve(null),
        vendorStaffToken
          ? fetchUser(vendorStaffToken, "vendor_staff")
          : Promise.resolve(null),
      ]);

      let activeMode = appMode;
      if (activeMode === "vendor_staff" && !vendorStaffToken) activeMode = null;
      if (activeMode === "vendor" && !vendorToken) activeMode = null;
      if (activeMode === "customer" && !customerToken) activeMode = null;

      if (!activeMode) {
        if (vendorStaffToken) activeMode = "vendor_staff";
        else if (vendorToken) activeMode = "vendor";
        else if (customerToken) activeMode = "customer";
      }

      const activeToken =
        activeMode === "vendor_staff"
          ? vendorStaffToken
          : activeMode === "vendor"
            ? vendorToken
            : customerToken;
      const activeUser =
        activeMode === "vendor_staff"
          ? staffU
          : activeMode === "vendor"
            ? vendU
            : custU;

      setState({
        isLoading: false,
        customerUser: custU,
        vendorUser: vendU,
        vendorStaffUser: staffU,
        appMode: activeMode,
        token: activeToken || null,
        user: activeUser || null,
        isAuthenticated: !!activeToken,
        fetchError: activeToken && !activeUser ? "Unable to fetch account data" : null,
      });

      addDebugLog("auth_initialize_done", {
        activeMode,
        isAuthenticated: !!activeToken,
        hasUser: !!activeUser,
        fetchError: activeToken && !activeUser ? "Unable to fetch account data" : null,
      });
    } catch (e) {
      setState({ isLoading: false, fetchError: "Initialization failed" });
      addDebugLog("auth_initialize_error", {
        message: e instanceof Error ? e.message : "Initialization failed",
      });
    }
  },

  signIn: async (token, mode) => {
    const currentState = getState();
    const resolvedMode = mode ?? (currentState.appMode ?? "customer");
    addDebugLog("auth_sign_in_start", {
      requestedMode: mode,
      resolvedMode,
      hadActiveMode: currentState.appMode,
    });
    const userData = await fetchUser(token, resolvedMode);

    const updates: Partial<AuthState> = {};
    if (resolvedMode === "vendor_staff") {
      updates.vendorStaffToken = token;
      updates.vendorStaffUser = userData;
    } else if (resolvedMode === "vendor") {
      updates.vendorToken = token;
      updates.vendorUser = userData;
    } else {
      updates.customerToken = token;
      updates.customerUser = userData;
    }

    updates.appMode = resolvedMode;
    updates.token = token;
    updates.user = userData;
    updates.isAuthenticated = !!token;

    setState(updates);
    addDebugLog("auth_sign_in_done", {
      mode: resolvedMode,
      hasUser: !!userData,
      isAuthenticated: !!token,
    });
  },

  setAppMode: async (mode) => {
    const currentState = getState();
    const activeToken =
      mode === "vendor_staff"
        ? currentState.vendorStaffToken
        : mode === "vendor"
          ? currentState.vendorToken
          : currentState.customerToken;
    const activeUser =
      mode === "vendor_staff"
        ? currentState.vendorStaffUser
        : mode === "vendor"
          ? currentState.vendorUser
          : currentState.customerUser;

    setState({
      appMode: mode,
      token: activeToken || null,
      user: activeUser || null,
      isAuthenticated: !!activeToken,
    });
    addDebugLog("auth_set_mode", {
      mode,
      hasToken: !!activeToken,
      hasUser: !!activeUser,
    });
  },

  signOut: async () => {
    addDebugLog("auth_sign_out_all");
    setState({
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
      fetchError: null,
    });
  },

  signOutMode: async (mode) => {
    addDebugLog("auth_sign_out_mode_start", { mode });
    const updates: Partial<AuthState> = {};

    if (mode === "vendor_staff") {
      updates.vendorStaffToken = null;
      updates.vendorStaffUser = null;
    } else if (mode === "vendor") {
      updates.vendorToken = null;
      updates.vendorUser = null;
    } else {
      updates.customerToken = null;
      updates.customerUser = null;
    }

    setState((prev) => {
      const newState = { ...prev, ...updates };
      const fallbackMode = newState.vendorToken
        ? "vendor"
        : newState.vendorStaffToken
          ? "vendor_staff"
          : newState.customerToken
            ? "customer"
            : null;

      addDebugLog("auth_sign_out_mode_done", {
        removedMode: mode,
        fallbackMode,
        hasCustomerToken: !!newState.customerToken,
        hasVendorToken: !!newState.vendorToken,
        hasVendorStaffToken: !!newState.vendorStaffToken,
      });

      return {
        ...newState,
        appMode: fallbackMode,
        token:
          fallbackMode === "vendor"
            ? newState.vendorToken
            : fallbackMode === "vendor_staff"
              ? newState.vendorStaffToken
              : newState.customerToken,
        user:
          fallbackMode === "vendor"
            ? newState.vendorUser
            : fallbackMode === "vendor_staff"
              ? newState.vendorStaffUser
              : newState.customerUser,
        isAuthenticated: !!fallbackMode,
      };
    });
  },

  refetchUser: async (mode) => {
    const currentState = getState();
    const useMode = mode ?? currentState.appMode;
    if (!useMode) return;
    const targetToken =
      useMode === "vendor_staff"
        ? currentState.vendorStaffToken
        : useMode === "vendor"
          ? currentState.vendorToken
          : currentState.customerToken;
    if (!targetToken) return;

    const userData = await fetchUser(targetToken, useMode);
    const updates: Partial<AuthState> = {};
    if (useMode === "vendor_staff") updates.vendorStaffUser = userData;
    else if (useMode === "vendor") updates.vendorUser = userData;
    else updates.customerUser = userData;

    if (currentState.appMode === useMode) {
      updates.user = userData;
    }
    setState(updates);
  },
};

let state: AuthState = {
  ...initialDataState,
  ...actions,
};

const hydrateFromStorage = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as
        | { state?: PersistedAuthState }
        | PersistedAuthState;

      const persisted =
        parsed && typeof parsed === "object" && "state" in parsed
          ? parsed.state
          : (parsed as PersistedAuthState);

      if (persisted) {
        state = {
          ...state,
          customerToken: persisted.customerToken ?? null,
          vendorToken: persisted.vendorToken ?? null,
          vendorStaffToken: persisted.vendorStaffToken ?? null,
          appMode: persisted.appMode ?? null,
        };
      }
    }
  } catch (error) {
    console.warn("[AuthStore] Failed to hydrate auth state", error);
  } finally {
    hydrated = true;
    hydrationListeners.forEach((listener) => listener());
    hydrationListeners.clear();
    notify();
  }
};

void hydrateFromStorage();

const identitySelector = (value: AuthState) => value;

type Selector<T> = (state: AuthState) => T;

type UseAuthStore = {
  (): AuthState;
  <T>(selector: Selector<T>): T;
  getState: () => AuthState;
  setState: typeof setState;
  subscribe: (listener: StoreListener) => () => void;
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (callback: () => void) => () => void;
  };
};

export const useAuthStore = ((selector?: Selector<unknown>) => {
  const selected = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => (selector ?? identitySelector)(state),
    () => (selector ?? identitySelector)(state),
  );

  return selected;
}) as UseAuthStore;

useAuthStore.getState = getState;
useAuthStore.setState = setState;
useAuthStore.subscribe = (listener: StoreListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
useAuthStore.persist = {
  hasHydrated: () => hydrated,
  onFinishHydration: (callback: () => void) => {
    if (hydrated) {
      callback();
      return () => {};
    }

    hydrationListeners.add(callback);
    return () => {
      hydrationListeners.delete(callback);
    };
  },
};
