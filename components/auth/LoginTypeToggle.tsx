import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface LoginTypeToggleProps {
  value: "vendor" | "staff";
  onChange: (type: "vendor" | "staff") => void;
}

export default function LoginTypeToggle({ value, onChange }: LoginTypeToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, value === "vendor" && styles.buttonActive]}
        onPress={() => onChange("vendor")}
      >
        <Ionicons
          name="business-outline"
          size={18}
          color={value === "vendor" ? "#FFFFFF" : Colors.themes.provider.primary}
        />
        <Text style={[styles.text, value === "vendor" && styles.textActive]}>
          Vendor
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, value === "staff" && styles.buttonActive]}
        onPress={() => onChange("staff")}
      >
        <Ionicons
          name="person-outline"
          size={18}
          color={value === "staff" ? "#FFFFFF" : Colors.themes.provider.primary}
        />
        <Text style={[styles.text, value === "staff" && styles.textActive]}>
          Staff
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  buttonActive: {
    backgroundColor: Colors.themes.provider.primary,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.themes.provider.primary,
  },
  textActive: {
    color: "#FFFFFF",
  },
});
