import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Spacing, BorderRadius } from "@/constants/Styles";
import { useSession } from "@/context/ctx";

type Role = "customer" | "provider" | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { setAppMode } = useSession();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const handleRoleSelect = async (role: Role) => {
    setSelectedRole(role);
    if (role === "customer") {
      await setAppMode("customer");
      router.push("/auth/customer/sign-in");
    } else {
      await setAppMode("vendor");
      router.push("/auth/vendor/sign-in");
    }

  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.neutral.white}
      />

      {/* Top Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require("@/assets/images/signin-illustration.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Tasker Company</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>
      </View>

      {/* Role Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Customer Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleRoleSelect("customer")}
          style={[
            styles.roleButton,
            styles.customerButton,
            selectedRole === "customer" && styles.buttonPressed,
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="person-outline"
              size={24}
              color={Colors.themes.customer.primary}
            />
          </View>
          <Text style={styles.roleButtonText}>I&apos;m a Customer</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={Colors.neutral.white}
          />
        </TouchableOpacity>

        {/* Provider Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleRoleSelect("provider")}
          style={[
            styles.roleButton,
            styles.providerButton,
            selectedRole === "provider" && styles.buttonPressed,
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="construct-outline"
              size={24}
              color={Colors.themes.provider.primary}
            />
          </View>
          <Text style={styles.roleButtonText}>I&apos;m a Service Provider</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={Colors.neutral.white}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  illustration: {
    width: 240,
    height: 240,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.text.secondary,
    textAlign: "center",
  },
  buttonsContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  customerButton: {
    backgroundColor: Colors.themes.customer.primary,
  },
  providerButton: {
    backgroundColor: Colors.themes.provider.primary,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md - 4,
  },
  roleButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.neutral.white,
  },
});
