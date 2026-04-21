import React from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface FloatingChatButtonProps {
  workOrderId?: number | string;
  conversationId?: number | string;
}

export function FloatingChatButton({ workOrderId, conversationId }: FloatingChatButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/chat",
      params: { workOrderId, conversationId }
    });
  };

  return (
    <TouchableOpacity 
        style={styles.button} 
        onPress={handlePress}
        activeOpacity={0.8}
    >
      <FontAwesome name="whatsapp" size={32} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#25D366", // WhatsApp green
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
