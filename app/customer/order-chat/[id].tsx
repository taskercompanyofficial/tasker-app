import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatRoom workOrderId={id} />
    </SafeAreaView>
  );
}
