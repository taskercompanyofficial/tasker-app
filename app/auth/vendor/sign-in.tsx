import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import {
  VENDOR_LOGIN_URL,
  VENDOR_OTP_URL,
  VENDOR_OTP_VERIFY_URL,
  VENDOR_STAFF_LOGIN_URL,
} from "@/lib/api-endpoints";
import { useEffect } from "react";
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

type Step = "phone" | "otp" | "success";
type LoginType = "vendor" | "staff";

export default function VendorSignIn() {
  const { signIn, setAppMode } = useSession();
  const { data, setData, processing, errors, post } = useForm({
    phone: "",
    source: "vendor-app",
    otp: "",
    password: "",
  });
  const [step, setStep] = React.useState<Step>("phone");
  const [useOtp, setUseOtp] = React.useState<boolean>(false);
  const [loginType, setLoginType] = React.useState<LoginType>("vendor");

  useEffect(() => {
    void setAppMode("vendor");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOtp = () => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(data.phone)) {
      Toast.show({ type: "error", text1: "Enter a valid phone number" });
      return;
    }
    post(VENDOR_OTP_URL, {
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
      onSuccess: (response: { message: string; token: string }) => {
        setStep("success");
        Toast.show({
          type: "success",
          text1: response?.message || "Login successful",
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

  const handlePasswordLogin = () => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(data.phone)) {
      Toast.show({ type: "error", text1: "Enter a valid phone number" });
      return;
    }
    if (!data.password || data.password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Password must be at least 6 characters",
      });
      return;
    }

    if (loginType === "staff") {
      // Staff login
      post(VENDOR_STAFF_LOGIN_URL, {
        onSuccess: (response: { message: string; token: string }) => {
          Toast.show({
            type: "success",
            text1: response.message || "Login successful",
          });
          signIn(response.token, "vendor_staff");
          void setAppMode("vendor_staff");
          router.replace("/vendor/(tabs)/dashboard");
        },
        onError: (error) => {
          Toast.show({
            type: "error",
            text1: error.message || "Login failed",
          });
        },
      });
    } else {
      // Vendor login
      post(VENDOR_LOGIN_URL, {
        onSuccess: (response: { message: string; token: string }) => {
          Toast.show({
            type: "success",
            text1: response.message || "Login successful",
          });
          signIn(response.token, "vendor");
          void setAppMode("vendor");
          router.replace("/vendor/(tabs)/dashboard");
        },
        onError: (error) => {
          Toast.show({
            type: "error",
            text1: error.message || "Login failed",
          });
        },
      });
    }
  };

  const isStaffMode = loginType === "staff";

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
        <Text style={styles.headerTitle}>
          {isStaffMode ? "Staff Login" : "Vendor Login"}
        </Text>
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
            {/* Login Type Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isStaffMode && styles.toggleButtonActive,
                ]}
                onPress={() => setLoginType("vendor")}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={!isStaffMode ? "#FFFFFF" : Colors.themes.provider.primary}
                />
                <Text
                  style={[
                    styles.toggleText,
                    !isStaffMode && styles.toggleTextActive,
                  ]}
                >
                  Vendor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isStaffMode && styles.toggleButtonActive,
                ]}
                onPress={() => setLoginType("staff")}
              >
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={isStaffMode ? "#FFFFFF" : Colors.themes.provider.primary}
                />
                <Text
                  style={[
                    styles.toggleText,
                    isStaffMode && styles.toggleTextActive,
                  ]}
                >
                  Staff
                </Text>
              </TouchableOpacity>
            </View>

            {/* Header Text - Left Aligned */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>
                {isStaffMode
                  ? "Staff Login"
                  : "Service Provider Login"}
              </Text>
              <Text style={styles.subtitle}>
                {isStaffMode
                  ? "Sign in with credentials provided by your vendor"
                  : "Sign in to manage your jobs and earnings"}
              </Text>
            </View>

            {/* Form */}
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

              {/* Staff always uses password login */}
              {(isStaffMode || !useOtp) && (
                <>
                  <Input
                    label="Password"
                    placeholder={isStaffMode ? "Enter your staff password" : "Enter your password"}
                    value={data.password}
                    onChangeText={(text) =>
                      setData({ ...data, password: text })
                    }
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
                  {!isStaffMode && (
                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotPasswordText}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Button
                    title={processing ? "Signing In..." : "Sign In"}
                    onPress={handlePasswordLogin}
                    fullWidth
                    loading={processing}
                    theme="vendor"
                  />
                </>
              )}
              {!isStaffMode && useOtp && (
                <>
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
                      <TouchableOpacity
                        onPress={handleSendOtp}
                        style={styles.forgotPassword}
                      >
                        <Text style={styles.forgotPasswordText}>
                          Resend OTP
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}

              {/* OTP toggle (only for vendor, not staff) */}
              {!isStaffMode && (
                <TouchableOpacity
                  onPress={() => setUseOtp(!useOtp)}
                  style={styles.footer}
                >
                  <Text style={styles.footerText}>
                    {useOtp ? "Use password instead" : "Use OTP instead"}
                  </Text>
                </TouchableOpacity>
              )}

              {!isStaffMode && (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Don&apos;t have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/auth/vendor/register")}
                  >
                    <Text style={styles.signUpText}>Register as Provider</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isStaffMode && (
                <View style={styles.staffInfoBox}>
                  <Ionicons name="information-circle-outline" size={18} color={Colors.themes.provider.primary} />
                  <Text style={styles.staffInfoText}>
                    Your default password is the last 6 digits of your phone number. Contact your vendor if you need help.
                  </Text>
                </View>
              )}
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
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.neutral.gray[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.themes.provider.primary,
    shadowColor: Colors.themes.provider.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.themes.provider.primary,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
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
  staffInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.themes.provider.background,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.themes.provider.accent + '30',
  },
  staffInfoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
