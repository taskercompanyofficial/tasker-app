import Splash from "@/components/splash";
import { SessionProvider, useSession } from "@/context/ctx";
import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';


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
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Protected guard={!session.isAuthenticated}>
        <Stack.Screen
          name="auth/onboarding"
        />
        <Stack.Screen
          name="auth/sign-in"
        />
      </Stack.Protected>
      <Stack.Protected guard={session.isAuthenticated}>
        <Stack.Screen
          name="index"
        />
        <Stack.Screen
          name="services/[slug]"
        />
        <Stack.Screen
          name="(tabs)"
        />
      </Stack.Protected>
    </Stack>
  )
}
