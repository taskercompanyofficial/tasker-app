import { localizedToast } from "@/lib/i18n/localized-toast";
import AppTextInput from "@/components/common/AppTextInput";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { OTP_URL, OTP_VERIFY_URL } from "@/lib/api-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useLanguage } from "@/context/language-context";

type Step = "phone" | "otp" | "success";

export default function Signin() {
  const { t } = useLanguage();
  const { signIn } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [sendMethod, setSendMethod] = useState<"sms" | "whatsapp">("whatsapp");
  const [resendTimer, setResendTimer] = useState(0);

  const { data, setData, processing, errors, post } = useForm({
    phone: "",
    source: "tasker-app",
    otp: "",
    intent: "login",
    channel: "whatsapp",
  });

  const handlePhoneChange = (text: string) => {
    // Only allow digits and a single leading '+'
    let cleaned = text.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");

    // If Android SIM suggestion returns 923... without '+', auto prepend '+'
    if (cleaned.startsWith("923") && !cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }

    // Max length: 13 if starts with '+', otherwise 11 digits
    const maxLen = cleaned.startsWith("+") ? 13 : 11;
    if (cleaned.length > maxLen) {
      cleaned = cleaned.slice(0, maxLen);
    }

    setData((prev) => ({ ...prev, phone: cleaned }));
  };

  const isValidPhone =
    /^03\d{9}$/.test(data.phone) || /^\+92\d{10}$/.test(data.phone);
  const isValidOtp = /^\d{6}$/.test(data.otp);

  const handleSendOtp = (channel: "sms" | "whatsapp" = "whatsapp") => {
    setSendMethod(channel);
    const phoneToSend = data.phone.trim();
    setData((prev) => ({ ...prev, phone: phoneToSend, channel }));

    post(OTP_URL, {
      onSuccess: (response) => {
        setStep("otp");
        setResendTimer(90);
        localizedToast({
          type: "success",
          text1: response?.message || "OTP sent via WhatsApp successfully",
        });
      },
      onError: (error) => {
        localizedToast({
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
        if (response.isNew) {
          router.replace("/auth/customer/complete-profile");
        } else {
          router.replace("/customer");
        }
      },
      onError: (error) => {
        setData((prev) => ({ ...prev, otp: "" }));
        localizedToast({
          type: "error",
          text1: error?.message || "Invalid OTP",
        });
      },
    });
  };

  // Countdown timer for resend OTP (90 seconds)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
      setResendTimer(0);
      setData((prev) => ({ ...prev, otp: "" }));
    } else {
      router.replace("/auth/role-selection");
    }
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => { });
  };

  return (
    <LinearGradient
      colors={[
        Colors.themes.customer.primaryLight,
        Colors.themes.customer.primary,
        Colors.themes.customer.accent,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <SafeAreaView edges={["top"]} style={styles.topSafeArea}>
        {/* Nav Icons with Center Logo */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.circleIconButton}
            activeOpacity={0.7}
          >
            <DirectionalIcon name="arrow-back" size={22} color="#18181B" />
          </TouchableOpacity>

          <Image
            source={require("@/assets/images/tasker-logo.png")}
            style={styles.headerCenterLogo}
            resizeMode="contain"
          />

          <TouchableOpacity
            onPress={() => openUrl("tel:+923000000000")}
            style={styles.circleIconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="headset" size={20} color="#18181B" />
          </TouchableOpacity>
        </View>

        {/* Brand Header on Left */}
        <View style={styles.brandRow}>
          <View style={styles.brandInfo}>
            <View style={styles.titleBadgeRow}>
              <View style={styles.licensedPill}>
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={Colors.themes.customer.primaryDark}
                />
                <AppText style={styles.licensedText}>{t.auth.verifiedExperts}</AppText>
              </View>
            </View>
            <AppText style={styles.brandSubtitle}>{t.auth.customerTagline}</AppText>
          </View>
        </View>
      </SafeAreaView>

      {/* Customer Illustration Positioned on Right Overlapping Sheet */}
      <Image
        source={require("@/assets/images/customer-booking-hero.png")}
        style={styles.heroIllustrationRight}
        resizeMode="contain"
      />

      {/* Main Content White Sheet with Smooth Rounded Top */}
      <View style={styles.sheetContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === "phone" && (
              <View style={styles.formSection}>
                {/* Active Tab Heading (OTP Login only) */}
                <View style={styles.tabContainer}>
                  <View style={styles.activeTabWrapper}>
                    <AppText style={styles.tabTitle}>{t.auth.signIn}</AppText>
                    <View style={styles.tabUnderline} />
                  </View>
                </View>

                {/* Phone Input Box */}
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#6B7280" />
                  <View style={styles.inputDivider} />
                  <AppTextInput
                    style={styles.phoneInput}
                    placeholder={t.auth.enterPhone}
                    placeholderTextColor="#9CA3AF"
                    value={data.phone}
                    onChangeText={handlePhoneChange}
                    textDirection="ltr"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    importantForAutofill="yes"
                    autoCorrect={false}
                    maxLength={data.phone.startsWith("+") ? 13 : 11}
                    autoFocus={false}
                  />
                </View>
                {errors.phone && (
                  <AppText style={styles.errorText}>{errors.phone}</AppText>
                )}

                {/* Send via WhatsApp Button */}
                <TouchableOpacity
                  style={[
                    styles.smsButton,
                    (!isValidPhone || processing) && styles.buttonDisabled,
                  ]}
                  activeOpacity={0.88}
                  disabled={!isValidPhone || processing}
                  onPress={() => handleSendOtp("whatsapp")}
                >
                  {processing && sendMethod === "whatsapp" ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="logo-whatsapp"
                        size={21}
                        color="#25D366"
                      />
                      <AppText style={styles.smsButtonText}>
                        {t.auth.sendViaWhatsApp}
                      </AppText>
                    </>
                  )}
                </TouchableOpacity>

                {/* Terms and Privacy Policy */}
                <AppText style={styles.termsText}>
                  {t.auth.termsNotice}{" "}
                  <AppText
                    style={styles.termsLink}
                    onPress={() =>
                      openUrl("https://taskercompany.com/privacy-policy")
                    }
                  >
                    {t.auth.privacyPolicy}
                  </AppText>{" "}
                  &{" "}
                  <AppText
                    style={styles.termsLink}
                    onPress={() =>
                      openUrl("https://taskercompany.com/terms")
                    }
                  >
                    {t.auth.termsOfService}
                  </AppText>
                  .
                </AppText>
              </View>
            )}

            {step === "otp" && (
              <View style={styles.formSection}>
                <View style={styles.tabContainer}>
                  <View style={styles.activeTabWrapper}>
                    <AppText style={styles.tabTitle}>{t.auth.verifyOtpTitle}</AppText>
                    <View style={styles.tabUnderline} />
                  </View>
                </View>

                <AppText style={styles.otpSubtitle}>
                  {t.auth.codeSentTo}{" "}
                  <AppText style={styles.boldPhone}>{data.phone}</AppText>
                </AppText>

                {/* OTP Input */}
                <View style={[styles.inputContainer, styles.otpContainer]}>
                  <AppTextInput
                    style={styles.otpInput}
                    placeholder="• • • • • •"
                    placeholderTextColor="#D1D5DB"
                    value={data.otp}
                    onChangeText={(text) =>
                      setData((prev) => ({
                        ...prev,
                        otp: text.replace(/\D/g, ""),
                      }))
                    }
                    textDirection="ltr"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
                {errors.otp && (
                  <AppText style={styles.errorText}>{errors.otp}</AppText>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.smsButton,
                    (!isValidOtp || processing) && styles.buttonDisabled,
                  ]}
                  activeOpacity={0.88}
                  disabled={!isValidOtp || processing}
                  onPress={handleVerifyOtp}
                >
                  {processing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <AppText style={styles.smsButtonText}>{t.auth.verifyAndSignIn}</AppText>
                  )}
                </TouchableOpacity>

                {/* Resend Options */}
                {resendTimer > 0 ? (
                  <View style={styles.resendRow}>
                    <Ionicons name="time-outline" size={15} color="#6B7280" />
                    <AppText style={styles.resendTimerText}>
                      {t.auth.resendIn}{" "}
                      <AppText style={styles.resendTimerHighlight}>
                        {formatTimer(resendTimer)}
                      </AppText>
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.resendRow}>
                    <TouchableOpacity
                      onPress={() => handleSendOtp("whatsapp")}
                      disabled={processing}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                      <AppText style={styles.resendActionText}>
                        {t.auth.resendCode}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setStep("phone");
                    setResendTimer(0);
                    setData((prev) => ({ ...prev, otp: "" }));
                  }}
                  style={styles.changeNumberBtn}
                >
                  <AppText style={styles.changeNumberText}>{t.auth.changeNumber}</AppText>
                </TouchableOpacity>
              </View>
            )}

            {step === "success" && (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons
                    name="checkmark-circle"
                    size={72}
                    color={Colors.themes.customer.primary}
                  />
                </View>
                <AppText style={styles.successTitle}>Welcome Back!</AppText>
                <AppText style={styles.successText}>
                  Redirecting to your dashboard...
                </AppText>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? 12 : 0,
    paddingBottom: 28,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenterLogo: {
    width: 140,
    height: 38,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 110,
    marginBottom: Spacing.xs,
  },
  brandInfo: {
    maxWidth: "100%",
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  brandLogoBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#18181B",
    letterSpacing: 0.5,
  },
  licensedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderWidth: 1,
    borderColor: Colors.themes.customer.accent,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  licensedText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: Colors.themes.customer.primaryDark,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    marginTop: 1,
  },
  heroIllustrationRight: {
    position: "absolute",
    right: -10,
    top: Platform.OS === "android" ? 45 : 40,
    width: 170,
    height: 260,
    zIndex: 10,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    ...Shadows.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  formSection: {
    width: "100%",
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  activeTabWrapper: {
    alignItems: "flex-start",
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#18181B",
  },
  tabUnderline: {
    width: 76,
    height: 3.5,
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: 2,
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    height: 56,
    paddingHorizontal: 16,
    marginBottom: Spacing.md,
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#18181B",
    letterSpacing: 0.5,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: -8,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  smsButton: {
    backgroundColor: "#18181B",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 6,
    ...Shadows.sm,
  },
  smsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  whatsappButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  whatsappButtonText: {
    color: "#18181B",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  termsText: {
    fontSize: 11.5,
    color: "#6B7280",
    lineHeight: 18,
    marginTop: 18,
  },
  termsLink: {
    color: Colors.themes.customer.primaryDark,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  otpSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: Spacing.md,
  },
  boldPhone: {
    fontWeight: "700",
    color: "#18181B",
  },
  otpContainer: {
    justifyContent: "center",
  },
  otpInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 8,
    color: "#18181B",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: Spacing.lg,
  },
  resendTimerText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  resendTimerHighlight: {
    color: Colors.themes.customer.primaryDark,
    fontWeight: "700",
  },
  resendActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.themes.customer.primaryDark,
  },
  resendDot: {
    color: "#9CA3AF",
  },
  changeNumberBtn: {
    alignSelf: "center",
    marginTop: Spacing.sm,
    paddingVertical: 6,
  },
  changeNumberText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#18181B",
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    color: "#6B7280",
  },
});


