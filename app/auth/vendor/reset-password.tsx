import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { VENDOR_LOGIN_URL } from "@/lib/api-endpoints";
const VENDOR_RESET_PASSWORD_URL = VENDOR_LOGIN_URL.replace("/login", "/auth/reset-password");

export default function VendorResetPassword() {
  const params = useLocalSearchParams<{ phone: string }>();
  const { signIn, setAppMode } = useSession();

  const { data, setData, processing, errors, post } = useForm({
    phone: params.phone || "",
    otp: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!data.phone) {
      Toast.show({ type: "error", text1: "Missing phone number" });
      router.back();
    }
  }, [data.phone]);

  const handleResetPassword = () => {
    const isValidOtp = /^\d{6}$/.test(data.otp);
    if (!isValidOtp) {
      Toast.show({ type: "error", text1: "Enter valid 6-digit OTP" });
      return;
    }
    if (!data.password || data.password.length < 8) {
      Toast.show({ type: "error", text1: "Password must be at least 8 characters" });
      return;
    }
    if (data.password !== data.confirm_password) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }

    post(VENDOR_RESET_PASSWORD_URL, {
      onSuccess: (response: { message: string, token: string }) => {
        Toast.show({
          type: "success",
          text1: response?.message || "Password successfully reset!",
        });
        // Redirect the user back to the login screen instead of auto-logging them in
        router.replace("/auth/vendor/sign-in");
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error.message || "Failed to reset password",
        });
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/auth/role-selection")}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify & Reset</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centeredContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Secure Reset</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code we sent to {data.phone} via WhatsApp, then choose your new password.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <Input
                label="WhatsApp Code (OTP)"
                placeholder="000000"
                value={data.otp}
                onChangeText={(text) => setData({ ...data, otp: text })}
                keyboardType="number-pad"
                maxLength={6}
                error={errors.otp}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                importantForAutofill="yes"
                theme="vendor"
                leftIcon={
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                }
              />

              <Input
                label="New Password"
                placeholder="Minimum 8 characters"
                value={data.password}
                onChangeText={(text) => setData({ ...data, password: text })}
                secureTextEntry
                error={errors.password}
                theme="vendor"
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                }
              />

              <Input
                label="Confirm New Password"
                placeholder="Re-enter password"
                value={data.confirm_password}
                onChangeText={(text) => setData({ ...data, confirm_password: text })}
                secureTextEntry
                error={errors.confirm_password || (data.password && data.confirm_password && data.password !== data.confirm_password ? "Passwords do not match" : "")}
                theme="vendor"
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                }
              />

              <Button
                title={processing ? "Resetting Password..." : "Reset Password"}
                onPress={handleResetPassword}
                fullWidth
                loading={processing}
                theme="vendor"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.white },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-start" },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.text.primary },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  centeredContent: { width: "100%" },
  headerTextContainer: { marginBottom: Spacing.xl, width: "100%" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: "left",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "left",
    lineHeight: 20,
  },
  formContainer: { gap: Spacing.md, width: "100%" },
});
