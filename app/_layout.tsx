import Splash from "@/components/splash";
import { SessionProvider, useSession } from "@/context/ctx";
import { Stack } from "expo-router";
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <RootNavigator />
      <Toast />
    </SessionProvider>
  )
}

function RootNavigator() {
  const { session } = useSession()

  if (session.isLoading) {
    return <Splash />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session.isAuthenticated}>
        <Stack.Screen
          name="auth/onboarding"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/sign-in"
          options={{ headerShown: false }}
        />
      </Stack.Protected>
      <Stack.Protected guard={session.isAuthenticated}>
        <Stack.Screen
          name="/"
        />
        <Stack.Screen
          name="(tabs)/index"
          options={{ headerShown: false }}
        />
      </Stack.Protected>
    </Stack>
  )
}
