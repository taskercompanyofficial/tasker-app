import React, { createContext, useMemo, PropsWithChildren } from "react";
import { useAuthStore, AppMode } from "./auth-store";
import { User } from "@/types/user";

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
  const isLoading = useAuthStore((state) => state.isLoading);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const appMode = useAuthStore((state) => state.appMode);
  const customerToken = useAuthStore((state) => state.customerToken);
  const vendorToken = useAuthStore((state) => state.vendorToken);
  const vendorStaffToken = useAuthStore((state) => state.vendorStaffToken);
  const customerUser = useAuthStore((state) => state.customerUser);
  const vendorUser = useAuthStore((state) => state.vendorUser);
  const vendorStaffUser = useAuthStore((state) => state.vendorStaffUser);
  const fetchError = useAuthStore((state) => state.fetchError);
  const signIn = useAuthStore((state) => state.signIn);
  const signOut = useAuthStore((state) => state.signOut);
  const signOutMode = useAuthStore((state) => state.signOutMode);
  const refetchUser = useAuthStore((state) => state.refetchUser);
  const setAppMode = useAuthStore((state) => state.setAppMode);

  const session = useMemo(
    () => ({
      isLoading,
      token,
      isAuthenticated,
      user,
      appMode,
      customerToken,
      vendorToken,
      vendorStaffToken,
      customerUser,
      vendorUser,
      vendorStaffUser,
      fetchError,
    }),
    [
      isLoading,
      token,
      isAuthenticated,
      user,
      appMode,
      customerToken,
      vendorToken,
      vendorStaffToken,
      customerUser,
      vendorUser,
      vendorStaffUser,
      fetchError,
    ],
  );

  return useMemo(
    () => ({
      signIn,
      signOut,
      signOutMode,
      refetchUser,
      setAppMode,
      session,
    }),
    [signIn, signOut, signOutMode, refetchUser, setAppMode, session],
  );
}

export function SessionProvider({ children }: PropsWithChildren) {
  // We keep this as a shell to avoid breaking the root layout's provider structure
  return <>{children}</>;
}
