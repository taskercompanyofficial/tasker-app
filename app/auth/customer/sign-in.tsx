import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { OTP_URL, OTP_VERIFY_URL } from "@/lib/api-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
type Step = "phone" | "otp" | "success";

export default function Signin() {
  const { signIn, setAppMode } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const { data, setData, processing, errors, post } = useForm({
    phone: "",
    source: "tasker-app",
    otp: "",
  });
  const isValidPhone = /^03\d{9}$/.test(data.phone);
  useEffect(() => {
    void setAppMode("customer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSendOtp = () => {
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
          text1: error.message,
        });
      },
    });
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [step]);
  const handleVerifyOtp = async () => {
    post(OTP_VERIFY_URL, {
      onSuccess: (response: {
        message: string;
        token: string;
        isNew: boolean;
      }) => {
        setStep("success");
        signIn(response.token, "customer");
        void setAppMode("customer");
        router.replace("/customer");
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error?.message || "Something went wrong",
        });
      },
    });
  };
  const isValidOtp = /^\d{6}$/.test(data.otp);

  const handleGoogleSignIn = () => {
    console.log("Google sign in");
  };

  const autoVerifyRef = useRef(false);
  const clipboardIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    autoVerifyRef.current = false;
    if (clipboardIntervalRef.current) {
      clearInterval(clipboardIntervalRef.current);
      clipboardIntervalRef.current = null;
    }
    if (step !== "otp") {
      return;
    }
    const checkClipboard = async () => {
      try {
        const Clipboard = await import("expo-clipboard");
        const text = await Clipboard.getStringAsync();
        if (text && /^\d{6}$/.test(text)) {
          if (data.otp !== text) {
            setData({ ...data, otp: text });
          }
        }
      } catch {}
    };
    void checkClipboard();
    const id = setInterval(() => {
      void checkClipboard();
    }, 1500) as unknown as number;
    clipboardIntervalRef.current = id;
    return () => {
      if (clipboardIntervalRef.current) {
        clearInterval(clipboardIntervalRef.current);
        clipboardIntervalRef.current = null;
      }
    };
  }, [step, data, setData]);

  useEffect(() => {
    if (step === "otp" && isValidOtp && !processing && !autoVerifyRef.current) {
      autoVerifyRef.current = true;
      void handleVerifyOtp();
    }
  }, [step, isValidOtp, processing]);

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/signin-illustration.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome to Tasker</Text>
          <Text style={styles.subtitle}>
            {step === "phone" && "Enter your WhatsApp number to continue"}
            {step === "otp" && "Enter the verification code"}
            {step === "success" && "Welcome back!"}
          </Text>
        </View>

        <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
          {step === "phone" && (
            <View style={styles.stepContainer}>
              <Input
                label="WhatsApp Number"
                placeholder="03XXXXXXXXX"
                value={data.phone}
                onChangeText={(text) => {
                  setData({ ...data, phone: text });
                }}
                keyboardType="phone-pad"
                error={errors.phone}
                leftIcon={
                  <Ionicons
                    name="logo-whatsapp"
                    size={18}
                    color={Colors.themes.customer.primary}
                  />
                }
              />

              <Button
                title={processing ? "Sending OTP..." : "Continue"}
                onPress={handleSendOtp}
                fullWidth
                loading={processing}
                disabled={!isValidPhone}
              />
            </View>
          )}

          {step === "otp" && (
            <View style={styles.stepContainer}>
              <Text style={styles.otpInfo}>
                We&apos;ve sent a 6-digit code to your WhatsApp.{" "}
                <Text
                  style={styles.changeNumber}
                  onPress={() => setStep("phone")}
                >
                  Change number
                </Text>
              </Text>

              <Input
                label="Enter OTP"
                placeholder="000000"
                value={data.otp}
                onChangeText={(text) => {
                  setData({ ...data, otp: text });
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={errors.otp}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={Colors.themes.customer.primary}
                  />
                }
              />

              <Button
                title={processing ? "Verifying..." : "Verify OTP"}
                onPress={handleVerifyOtp}
                fullWidth
                loading={processing}
                disabled={!isValidOtp}
              />

              <TouchableOpacity
                onPress={handleSendOtp}
                style={styles.resendButton}
              >
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
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
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80, // Increased to account for header
    paddingBottom: Spacing.xl,
  },
  content: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
  },
  stepContainer: {
    gap: Spacing.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.text.tertiary,
    fontSize: 12,
  },
  otpInfo: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  changeNumber: {
    color: Colors.themes.customer.primary,
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
  illustration: {
    width: 200,
    height: 200,
  },
});
