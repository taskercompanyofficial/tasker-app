import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import { VENDOR_OTP_URL } from "@/lib/api-endpoints";
import { router } from "expo-router";
import React from "react";
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

export default function VendorForgotPassword() {
  const { data, setData, processing, errors, post } = useForm({
    phone: "",
    source: "vendor-app",
    intent: "forgot_password",
  });

  const handleSendOtp = () => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(data.phone)) {
      Toast.show({ type: "error", text1: "Enter a valid phone number" });
      return;
    }
    
    post(VENDOR_OTP_URL, {
      onSuccess: (response) => {
        Toast.show({
          type: "success",
          text1: response?.message || "Reset Code sent to WhatsApp",
        });
        // Navigate to verify passing the phone number as params
        router.push({
          pathname: "/auth/vendor/reset-password",
          params: { phone: data.phone }
        });
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error.message || "Failed to send reset code",
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
        <Text style={styles.headerTitle}>Forgot Password</Text>
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
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter the phone number associated with your account. We will send a 6-digit WhatsApp code to securely reset your password.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <Input
                label="Phone Number"
                placeholder="03XXXXXXXXX"
                value={data.phone}
                onChangeText={(text) => setData({ ...data, phone: text })}
                keyboardType="phone-pad"
                error={errors.phone}
                theme="vendor"
                leftIcon={
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                }
              />

              <Button
                title={processing ? "Sending Code..." : "Send Reset Code"}
                onPress={handleSendOtp}
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
