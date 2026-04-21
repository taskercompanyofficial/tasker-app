import Button from "@/components/Button";
import Input from "@/components/Input";
import BackButtonHeader from "@/components/auth/BackButtonHeader";
import LoginHeader from "@/components/auth/LoginHeader";
import Colors from "@/constants/Colors";
import { Spacing, Shadows } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { OTP_URL, OTP_VERIFY_URL } from "@/lib/api-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type Step = "phone" | "otp" | "success";

export default function Signin() {
  const { signIn } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");

  const { data, setData, processing, errors, post } = useForm({
    phone: "",
    source: "tasker-app",
    otp: "",
    intent: "login",
  });

  // Phone stored in 0302 format in database - send as-is
  const formattedPhone = data.phone.replace(/\D/g, "");
  const isValidPhone = /^03\d{9}$/.test(data.phone) || /^\+92[0-9]{10}$/.test(data.phone);
  const isValidOtp = /^\d{6}$/.test(data.otp);

  const handleSendOtp = () => {
    // Send phone as-is (0302 format stored in database)
    const phoneToSend = data.phone.replace(/\D/g, "");
    setData((prev) => ({ ...prev, phone: phoneToSend }));
    post(OTP_URL, {
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

  const handleVerifyOtp = async () => {
    post(OTP_VERIFY_URL, {
      onSuccess: async (response: {
        message: string;
        token: string;
        isNew: boolean;
      }) => {
        setStep("success");
        await signIn(response.token, "customer");
        router.replace("/customer");
      },
      onError: (error) => {
        // Clear OTP to prevent auto-submit useEffect from re-triggering
        setData((prev) => ({ ...prev, otp: "" }));
        Toast.show({
          type: "error",
          text1: error?.message || "Invalid OTP",
        });
      },
    });
  };

  // Auto-submit OTP when 6 digits entered
  useEffect(() => {
    if (step === "otp" && isValidOtp && !processing && data.otp) {
      void handleVerifyOtp();
    }
  }, [step, isValidOtp, processing, data.otp]);

  const handleBackPress = () => {
    if (step === "otp") {
      setStep("phone");
      setData((prev) => ({ ...prev, otp: "" }));
    } else {
      router.replace("/auth/role-selection");
    }
  };

  const getTitle = () => {
    if (step === "phone") return "Welcome Back!";
    if (step === "otp") return "Verify OTP";
    return "Success";
  };

  const getSubtitle = () => {
    if (step === "phone") return "Enter your WhatsApp number to continue";
    if (step === "otp") return `We sent a 6-digit code to ${data.phone}`;
    return "Redirecting to your dashboard...";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Background Accent */}
      <View style={styles.backgroundAccent} />

      {/* Header - Transparent */}
      <BackButtonHeader
        title="Customer Login"
        onBackPress={handleBackPress}
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Login Header - No Icon */}
          <LoginHeader
            title={getTitle()}
            subtitle={getSubtitle()}
            theme="customer"
            hideIcon
          />

          {/* Form */}
          <View style={styles.formContainer}>
            {step === "phone" && (
              <>
                <Input
                  label="WhatsApp Number"
                  placeholder="03XXXXXXXXX"
                  value={data.phone}
                  onChangeText={(text) =>
                    setData((prev) => ({ ...prev, phone: text }))
                  }
                  keyboardType="phone-pad"
                  error={errors.phone}
                  leftIcon={
                    <Ionicons
                      name="logo-whatsapp"
                      size={20}
                      color={Colors.themes.customer.primary}
                    />
                  }
                />

                <Button
                  title={processing ? "Sending OTP..." : "Continue with WhatsApp"}
                  onPress={handleSendOtp}
                  fullWidth
                  loading={processing}
                  disabled={!isValidPhone}
                  theme="customer"
                />

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons - Row Layout */}
                <View style={styles.socialRow}>
                  <TouchableOpacity
                    style={styles.socialButtonRow}
                    onPress={() => console.log("Google sign in")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.socialIcon, { backgroundColor: "#EA4335" }]}>
                      <Ionicons name="logo-google" size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialTextRow}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialButtonRow}
                    onPress={() => console.log("Facebook sign in")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.socialIcon, { backgroundColor: "#1877F2" }]}>
                      <Ionicons name="logo-facebook" size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialTextRow}>Facebook</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === "otp" && (
              <>
                {/* WhatsApp Icon */}
                <View style={styles.whatsappIconContainer}>
                  <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
                </View>

                <Input
                  label="Enter 6-Digit Code"
                  placeholder="000000"
                  value={data.otp}
                  onChangeText={(text) =>
                    setData((prev) => ({ ...prev, otp: text }))
                  }
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.otp}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  style={styles.otpInput}
                />

                <Button
                  title={processing ? "Verifying..." : "Verify & Continue"}
                  onPress={handleVerifyOtp}
                  fullWidth
                  loading={processing}
                  disabled={!isValidOtp}
                />

                <TouchableOpacity
                  onPress={handleSendOtp}
                  style={styles.resendButton}
                >
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep("phone");
                    setData((prev) => ({ ...prev, otp: "" }));
                  }}
                  style={styles.changeNumberButton}
                >
                  <Text style={styles.changeNumberText}>Change number</Text>
                </TouchableOpacity>
              </>
            )}

            {step === "success" && (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color={Colors.success}
                  />
                </View>
                <Text style={styles.successTitle}>Welcome Back!</Text>
                <Text style={styles.successText}>
                  Redirecting to your dashboard...
                </Text>
              </View>
            )}
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
  backgroundAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: Colors.themes.customer.primary + "10",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80, // Space for header
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  formContainer: {
    gap: Spacing.md,
    width: "100%",
  },
  otpInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
  },
  whatsappIconContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
  },
  socialButtonRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.white,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  socialTextRow: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.sm,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  changeNumberButton: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
  },
  changeNumberText: {
    color: Colors.themes.customer.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  resendButton: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
  },
  resendText: {
    color: Colors.themes.customer.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});
