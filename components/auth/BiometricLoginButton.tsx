import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

interface BiometricLoginButtonProps {
  onPress: () => void;
  biometryType?: "FaceID" | "TouchID" | "Fingerprint" | "Iris" | "None" | null;
  loading?: boolean;
}

export default function BiometricLoginButton({
  onPress,
  biometryType,
  loading = false,
}: BiometricLoginButtonProps) {
  const getIcon = () => {
    switch (biometryType) {
      case "FaceID":
        return "scan-outline";
      case "TouchID":
      case "Fingerprint":
        return "finger-print-outline";
      default:
        return "finger-print-outline";
    }
  };

  const getLabel = () => {
    switch (biometryType) {
      case "FaceID":
        return "Login with Face ID";
      case "TouchID":
        return "Login with Touch ID";
      case "Fingerprint":
        return "Login with Fingerprint";
      default:
        return "Login with Biometrics";
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} disabled={loading}>
      <Ionicons name={getIcon() as any} size={22} color={Colors.themes.provider.primary} />
      <Text style={styles.text}>{loading ? "Verifying..." : getLabel()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.themes.provider.primary + "30",
    backgroundColor: Colors.themes.provider.primary + "08",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.themes.provider.primary,
  },
});
