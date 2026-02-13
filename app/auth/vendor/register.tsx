import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import { VENDOR_OTP_URL, VENDOR_OTP_VERIFY_URL } from "@/lib/api-endpoints";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type Step = "phone" | "otp" | "success";
export default function VendorRegister() {
  const router = useRouter();
  const { signIn, setAppMode } = useSession();
  const { data, setData, processing, errors, post } = useForm({
    name: "",
    phone: "",
    password: "",
    password_confirmation: "",
    source: "vendor-app",
    otp: "",
  });
  const [step, setStep] = React.useState<Step>("phone");

  useEffect(() => {
    void setAppMode("vendor");
  }, [setAppMode]);

  const handleSendOtp = () => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(data.phone)) {
      Toast.show({ type: "error", text1: "Enter a valid phone number" });
      return;
    }
    if (!data.name || data.name.trim().length < 2) {
      Toast.show({ type: "error", text1: "Enter your full name" });
      return;
    }
    if (!data.password || data.password.length < 8) {
      Toast.show({ type: "error", text1: "Password must be at least 8 characters" });
      return;
    }
    if (data.password !== data.password_confirmation) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    post(VENDOR_OTP_URL, {
      data: { phone: data.phone, source: data.source, intent: "register" },
      onSuccess: (response) => {
        setStep("otp");
        Toast.show({
          type: "success",
          text1: response?.message || "OTP sent successfully",
        });
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error.message || "Failed to send OTP",
        });
      },
    });
  };

  const handleVerifyOtp = () => {
    const isValidOtp = /^\d{6}$/.test(data.otp);
    if (!isValidOtp) {
      Toast.show({ type: "error", text1: "Enter valid 6-digit OTP" });
      return;
    }
    post(VENDOR_OTP_VERIFY_URL, {
      data: {
        phone: data.phone,
        otp: data.otp,
        name: data.name,
        password: data.password,
      },
      onSuccess: (response: { message: string; token: string }) => {
        setStep("success");
        Toast.show({
          type: "success",
          text1: response?.message || "Registration successful",
        });
        signIn(response.token, "vendor");
        void setAppMode("vendor");
        router.replace("/vendor/(tabs)/dashboard");
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error?.message || "Invalid OTP",
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
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Page</Text>
        <View style={{ width: 40 }} /> {/* Spacer to center title */}
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
            {/* Header Text - Left Aligned */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Register as Provider</Text>
              <Text style={styles.subtitle}>
                Join our platform today and start growing your business with us
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={data.name}
                onChangeText={(text) => setData({ ...data, name: text })}
                error={errors.name}
                theme="vendor"
                leftIcon={
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                }
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
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
                </View>
              </View>

              <Input
                label="Password"
                placeholder="Create a password"
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
                label="Confirm Password"
                placeholder="Confirm your password"
                value={data.password_confirmation}
                onChangeText={(text) =>
                  setData({ ...data, password_confirmation: text })
                }
                secureTextEntry
                error={errors.password_confirmation}
                theme="vendor"
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.themes.provider.primary}
                  />
                }
              />

              {step === "phone" && (
                <Button
                  title={processing ? "Sending OTP..." : "Continue"}
                  onPress={handleSendOtp}
                  fullWidth
                  loading={processing}
                  theme="vendor"
                />
              )}
              {step === "otp" && (
                <>
                  <Input
                    label="Enter OTP"
                    placeholder="000000"
                    value={data.otp}
                    onChangeText={(text) => setData({ ...data, otp: text })}
                    keyboardType="number-pad"
                    maxLength={6}
                    error={errors.otp}
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
                    title={processing ? "Verifying..." : "Verify OTP"}
                    onPress={handleVerifyOtp}
                    fullWidth
                    loading={processing}
                    theme="vendor"
                  />
                  <TouchableOpacity onPress={handleSendOtp} style={{ alignSelf: "center" }}>
                    <Text style={{ color: Colors.themes.provider.primary, fontSize: 12, fontWeight: "500" }}>Resend OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  centeredContent: {
    width: "100%",
  },
  headerTextContainer: {
    marginBottom: Spacing.xl,
    width: "100%",
  },
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
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  formContainer: {
    gap: Spacing.sm,
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  signInText: {
    fontSize: 13,
    color: Colors.themes.provider.primary,
    fontWeight: "600",
  },
});
