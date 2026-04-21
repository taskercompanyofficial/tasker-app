import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useNetwork } from "@/hooks/use-network";

export default function NetworkStatus() {
  const { isOffline } = useNetwork();
  const [visible, setVisible] = useState(false);
  const translateY = new Animated.Value(-40);

  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -40,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOffline]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: Colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 9999,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
