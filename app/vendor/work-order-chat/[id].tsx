import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";

export default function WorkOrderChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Maintenance Chat",
          headerTintColor: Colors.themes.provider.primary,
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <ChatRoom workOrderId={id} />
    </SafeAreaView>
  );
}
