import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";

export default function ChatScreen() {
  const { workOrderId, conversationId } = useLocalSearchParams<{ 
    workOrderId?: string; 
    conversationId?: string; 
  }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={['top', 'bottom']}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <ChatRoom 
        workOrderId={workOrderId} 
        conversationId={conversationId} 
      />
    </SafeAreaView>
  );
}
