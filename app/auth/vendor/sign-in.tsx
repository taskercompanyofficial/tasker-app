import Button from "@/components/Button";
import Input from "@/components/Input";
import BackButtonHeader from "@/components/auth/BackButtonHeader";
import BiometricLoginButton from "@/components/auth/BiometricLoginButton";
import LoginHeader from "@/components/auth/LoginHeader";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import {
  VENDOR_OTP_URL,
  VENDOR_OTP_VERIFY_URL,
  VENDOR_QUICK_LOGIN_REGISTER_URL,
  VENDOR_QUICK_LOGIN_URL,
  VENDOR_STAFF_QUICK_LOGIN_REGISTER_URL,
  VENDOR_STAFF_QUICK_LOGIN_URL,
} from "@/lib/api-endpoints";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
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
import { useBiometric } from "@/hooks/use-biometric";
import AsyncStorage from "@react-native-async-storage/async-storage";
import myAxios from "@/lib/axios.config";
import * as SecureStore from "expo-secure-store";

type LoginStep = "credentials" | "otp";

const LAST_USER_PHONE_KEY = "@last_user_phone";
const BIOMETRIC_VENDOR_CREDENTIAL_KEY = "@biometric_vendor_quick_login";

type QuickLoginCredential = {
  phone: string;
  quickLoginToken: string;
  expiresAt: string;
  userType: "vendor" | "vendor_staff";
};

export default function VendorSignIn() {
  const { signIn } = useSession();
  const { isAvailable, biometryType, isEnabled: biometricEnabled, authenticate, enableBiometric: enableBiometricAuth } = useBiometric();

  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const { data, setData, processing, errors, post } = useForm({
    phone: "",
    password: "",
    otp: "",
    source: "vendor-app",
    intent: "login",
  });

  // Phone stored in 0302 format in database - send as-is
  const formattedPhone = data.phone.replace(/\D/g, "");
  const isValidPhone = /^\+?[0-9]{10,15}$/.test(data.phone || "");
  const isValidOtp = data.otp?.length === 6;
  const canSubmit = isValidPhone && data.password && data.password.length >= 6;

  // Check saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      const [savedPhone, savedQuickRaw] = await Promise.all([
        AsyncStorage.getItem(LAST_USER_PHONE_KEY),
        SecureStore.getItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY),
      ]);

      if (savedPhone) {
        setData((prev) => ({ ...prev, phone: savedPhone }));
      }

      if (!savedQuickRaw) return;

      try {
        const savedQuick = JSON.parse(savedQuickRaw) as QuickLoginCredential;
        if (!savedQuick?.phone || !savedQuick?.quickLoginToken || !savedQuick?.expiresAt) {
          await SecureStore.deleteItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY);
          return;
        }
        if (new Date(savedQuick.expiresAt).getTime() <= Date.now()) {
          await SecureStore.deleteItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY);
          return;
        }
      } catch {
        await SecureStore.deleteItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY);
      }
    };
    loadSavedCredentials();
  }, []);

  // Step 1: Send OTP to phone
  const handleLogin = () => {
    if (!isValidPhone) {
      Toast.show({ type: "error", text1: "Enter a valid phone number" });
      return;
    }
    if (!data.password || data.password.length < 6) {
      Toast.show({ type: "error", text1: "Password must be at least 6 characters" });
      return;
    }

    // Debug logging
    console.log("Login attempt:", {
      phone: data.phone,
    });

    // Send OTP (password verified in step 2)
    // Backend will auto-detect if phone belongs to vendor or vendor_staff
    const otpUrl = VENDOR_OTP_URL;
    console.log("OTP URL:", otpUrl);

    post(otpUrl, {
      onSuccess: () => {
        setLoginStep("otp");
        Toast.show({
          type: "success",
          text1: "OTP sent to your WhatsApp",
        });
      },
      onError: (error) => {
        console.log("OTP Error:", error);
        // Show more helpful error message
        if (error.message?.includes("No account found")) {
          Toast.show({
            type: "error",
            text1: "No vendor account found",
            text2: "Please check your phone number",
          });
        } else {
          Toast.show({
            type: "error",
            text1: error.message || "Failed to send OTP",
          });
        }
      },
    });
  };

  // Step 2: Verify OTP and complete login
  const handleVerifyOtp = () => {
    if (!isValidOtp) {
      Toast.show({ type: "error", text1: "Enter a valid 6-digit OTP" });
      return;
    }

    // Backend will auto-detect if phone belongs to vendor or vendor_staff
    const verifyUrl = VENDOR_OTP_VERIFY_URL;

    post(verifyUrl, {
      onSuccess: async (response: { token?: string; message?: string; user_type?: string }) => {
        if (response.token) {
          // Save for next time
          await AsyncStorage.setItem(LAST_USER_PHONE_KEY, data.phone);

          const userType = (response.user_type || "vendor") as "vendor" | "vendor_staff";

          // Register secure quick-login credential for this device
          if (biometricEnabled) {
            try {
              const registerUrl =
                userType === "vendor_staff"
                  ? VENDOR_STAFF_QUICK_LOGIN_REGISTER_URL
                  : VENDOR_QUICK_LOGIN_REGISTER_URL;
              const quickResponse = await myAxios.post(
                registerUrl,
                { device_name: `${Platform.OS}-app` },
                { headers: { Authorization: `Bearer ${response.token}` } },
              );
              const payload = quickResponse.data || {};
              if (payload.quick_login_token && payload.expires_at) {
                const credential: QuickLoginCredential = {
                  phone: data.phone,
                  quickLoginToken: payload.quick_login_token,
                  expiresAt: payload.expires_at,
                  userType,
                };
                await SecureStore.setItemAsync(
                  BIOMETRIC_VENDOR_CREDENTIAL_KEY,
                  JSON.stringify(credential),
                );
              }
            } catch (e) {
              console.warn("[Biometric] Failed to register quick login token", e);
            }
          }

          Toast.show({ type: "success", text1: response.message || "Login successful" });
          await signIn(response.token, userType);
          router.replace("/vendor/(tabs)/dashboard");
        } else {
          Toast.show({ type: "error", text1: "Invalid OTP" });
        }
      },
      onError: (error) => {
        console.log("Verify Error:", error);
        if (error.message?.includes("Invalid password")) {
          Toast.show({
            type: "error",
            text1: "Incorrect password",
            text2: "Please check your password and try again",
          });
        } else {
          Toast.show({ type: "error", text1: error.message || "Invalid OTP" });
        }
      },
    });
  };

  // Biometric login
  const handleBiometricLogin = async () => {
    if (!data.phone) {
      Toast.show({ type: "error", text1: "Enter your phone number first" });
      return;
    }

    setBioLoading(true);
    try {
      const success = await authenticate("Verify your identity");
      if (!success) return;

      const quickRaw = await SecureStore.getItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY);
      if (!quickRaw) {
        Toast.show({
          type: "info",
          text1: "Biometric quick login not set",
          text2: "Login once with OTP and enable biometric again",
        });
        return;
      }

      const credential = JSON.parse(quickRaw) as QuickLoginCredential;
      const quickUrl =
        credential.userType === "vendor_staff"
          ? VENDOR_STAFF_QUICK_LOGIN_URL
          : VENDOR_QUICK_LOGIN_URL;

      const response = await myAxios.post(quickUrl, {
        phone: credential.phone,
        quick_login_token: credential.quickLoginToken,
      });

      const payload = response.data || {};
      const token = payload.token;
      if (!token) {
        Toast.show({ type: "error", text1: "Login failed" });
        return;
      }

      await AsyncStorage.setItem(LAST_USER_PHONE_KEY, credential.phone);
      setData((prev) => ({ ...prev, phone: credential.phone }));
      Toast.show({ type: "success", text1: payload.message || "Login successful" });
      const userType = (payload.user_type || "vendor") as "vendor" | "vendor_staff";
      await signIn(token, userType);
      router.replace("/vendor/(tabs)/dashboard");
    } catch (error: any) {
      await SecureStore.deleteItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY);
      Toast.show({
        type: "error",
        text1: error?.response?.data?.message || error?.message || "Login failed",
      });
    } finally {
      setBioLoading(false);
    }
  };

  // Enable biometric after successful password entry
  const handleEnableBiometric = async () => {
    const quickRaw = await SecureStore.getItemAsync(BIOMETRIC_VENDOR_CREDENTIAL_KEY);
    if (!quickRaw) {
      Toast.show({
        type: "error",
        text1: "Complete OTP login first",
        text2: "Then enable biometric quick login",
      });
      return;
    }

    const success = await enableBiometricAuth();
    if (success) {
      Toast.show({ type: "success", text1: "Biometric login enabled" });
    }
  };

  const handleBackPress = () => {
    if (loginStep === "otp") {
      setLoginStep("credentials");
      setData((prev) => ({ ...prev, otp: "" }));
    } else {
      router.replace("/auth/role-selection");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Background Accent */}
      <View style={styles.backgroundAccent} />

      {/* Header - Transparent */}
      <BackButtonHeader
        title="Vendor Login"
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
            title={
              loginStep === "otp"
                ? "Verify OTP"
                : "Vendor Login"
            }
            subtitle={
              loginStep === "otp"
                ? `Enter the 6-digit code sent to ${data.phone}`
                : "Login to manage your service business"
            }
            theme="vendor"
            hideIcon
          />

          {/* Form */}
          <View style={styles.formContainer}>
            {loginStep === "credentials" ? (
              <>
                {/* Phone Input */}
                <Input
                  label="Phone Number"
                  placeholder="03XXXXXXXXX"
                  value={data.phone}
                  onChangeText={(text) => setData((prev) => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                  error={errors.phone}
                  theme="vendor"
                  leftIcon={
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={Colors.themes.provider.primary}
                    />
                  }
                />

                {/* Password Input */}
                <Input
                  label="Password"
                  placeholder="Your password"
                  value={data.password}
                  onChangeText={(text) => setData((prev) => ({ ...prev, password: text }))}
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  theme="vendor"
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={Colors.themes.provider.primary}
                    />
                  }
                  rightIcon={
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={Colors.themes.provider.primary}
                    />
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => router.push("/auth/vendor/forgot-password")}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <Button
                  title={processing ? "Signing In..." : "Sign In"}
                  onPress={handleLogin}
                  fullWidth
                  loading={processing}
                  disabled={!canSubmit}
                  theme="vendor"
                />

                {/* Biometric Login Button */}
                {isAvailable && biometricEnabled && data.phone && (
                  <BiometricLoginButton
                    onPress={handleBiometricLogin}
                    biometryType={
                      biometryType === "FINGERPRINT"
                        ? "Fingerprint"
                        : biometryType === "FACIAL_RECOGNITION"
                          ? "FaceID"
                          : "Fingerprint"
                    }
                    loading={bioLoading}
                  />
                )}

                {/* Enable Biometric Toggle */}
                {isAvailable && !biometricEnabled && data.phone && loginStep === "credentials" && (
                  <TouchableOpacity style={styles.enableBiometric} onPress={handleEnableBiometric}>
                    <Ionicons name="finger-print-outline" size={18} color={Colors.themes.provider.primary} />
                    <Text style={styles.enableBiometricText}>
                      Enable {biometryType === "FACIAL_RECOGNITION" ? "Face ID" : "Fingerprint"} Login
                    </Text>
                  </TouchableOpacity>
                )}


                {/* Register Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don&apos;t have an account?</Text>
                  <TouchableOpacity onPress={() => router.push("/auth/vendor/register")}>
                    <Text style={styles.signUpText}>Register</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* OTP Icon */}
                <View style={styles.otpIconContainer}>
                  <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
                </View>

                {/* OTP Input */}
                <Input
                  label="Enter 6-Digit Code"
                  placeholder="000000"
                  value={data.otp}
                  onChangeText={(text) => setData((prev) => ({ ...prev, otp: text }))}
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.otp}
                  theme="vendor"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  style={styles.otpInput}
                />

                {/* Verify Button */}
                <Button
                  title={processing ? "Verifying..." : "Verify & Login"}
                  onPress={handleVerifyOtp}
                  fullWidth
                  loading={processing}
                  disabled={!isValidOtp}
                  theme="vendor"
                />

                {/* Resend OTP */}
                <TouchableOpacity onPress={handleLogin} style={styles.resendButton}>
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>

                {/* WhatsApp Note */}
                <View style={styles.whatsappNote}>
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={styles.whatsappNoteText}>
                    Check your WhatsApp for the OTP
                  </Text>
                </View>
              </>
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
    backgroundColor: Colors.themes.provider.primary + "10",
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: Colors.themes.provider.primary,
    fontWeight: "500",
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
  signUpText: {
    fontSize: 13,
    color: Colors.themes.provider.primary,
    fontWeight: "600",
  },
  enableBiometric: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  enableBiometricText: {
    fontSize: 13,
    color: Colors.themes.provider.primary,
    fontWeight: "500",
  },
  staffInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.themes.provider.background,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.themes.provider.accent + "30",
  },
  staffInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  otpIconContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  otpInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
  },
  resendButton: {
    alignSelf: "center",
    paddingVertical: Spacing.sm,
  },
  resendText: {
    color: Colors.themes.provider.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  whatsappNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#25D366" + "10",
    borderRadius: 8,
  },
  whatsappNoteText: {
    fontSize: 12,
    color: "#25D366",
    fontWeight: "500",
  },
});
