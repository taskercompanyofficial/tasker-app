import { GET_ME_USER_URL } from '@/lib/api-endpoints';
import { User } from '@/types/user';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { createContext, type PropsWithChildren, use, useEffect, useState } from 'react';

const TOKEN_KEY = 'session';

interface Session {
  isLoading: boolean;
  token?: string | null;
  isAuthenticated: boolean;
  user: User | null;
}

const AuthContext = createContext<{
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  session: Session;
}>({
  signIn: async () => { },
  signOut: async () => { },
  session: { isLoading: true, token: null, isAuthenticated: false, user: null },
});

export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session>({
    isLoading: true,
    token: null,
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          const userData = await fetchUser(stored);
          setSession({
            isLoading: false,
            token: stored,
            isAuthenticated: true,
            user: userData,
          });
        } else {
          setSession({
            isLoading: false,
            token: null,
            isAuthenticated: false,
            user: null,
          });
        }
      } catch {
        setSession({
          isLoading: false,
          token: null,
          isAuthenticated: false,
          user: null,
        });
      }
    })();
  }, []);

  const fetchUser = async (token: string): Promise<User | null> => {
    try {
      const { data } = await axios.get<{ user: unknown }>(GET_ME_USER_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data.user as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const signIn = async (token: string) => {
    const userData = await fetchUser(token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setSession({
      isLoading: false,
      token,
      isAuthenticated: true,
      user: userData ? { ...userData } : null,
    });
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setSession({
      isLoading: false,
      token: null,
      isAuthenticated: false,
      user: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        session,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
