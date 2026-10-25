import { localizedToast } from "@/lib/i18n/localized-toast";
import AppTextInput from "@/components/common/AppTextInput";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import {
  VENDOR_OTP_URL,
  VENDOR_OTP_VERIFY_URL,
} from "@/lib/api-endpoints";
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

export default function VendorSignIn() {
  const { t } = useLanguage();
  const { signIn } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [sendMethod, setSendMethod] = useState<"sms" | "whatsapp">("whatsapp");
  const [resendTimer, setResendTimer] = useState(0);

  const { data, setData, processing, errors, post } = useForm({
    phone: "",
    otp: "",
    source: "vendor-app",
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

    post(VENDOR_OTP_URL, {
      onSuccess: (response) => {
        setStep("otp");
        setResendTimer(90);
        localizedToast({
          type: "success",
          text1:
            response?.message ||
            "OTP sent via WhatsApp successfully",
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
    post(VENDOR_OTP_VERIFY_URL, {
      onSuccess: async (response: {
        token?: string;
        message?: string;
        user_type?: string;
        user?: any;
        is_profile_complete?: boolean;
        isNew?: boolean;
      }) => {
        if (response.token) {
          const userType = (response.user_type || "vendor") as
            | "vendor"
            | "vendor_staff";

          setStep("success");
          localizedToast({
            type: "success",
            text1: response.message || "Login successful",
          });
          await signIn(response.token, userType, response.user);
          
          const vendorUser = response.user;
          const isVendor = userType === "vendor";
          const isProfileIncomplete =
            isVendor &&
            (!vendorUser?.cnic ||
              !vendorUser?.handled_categories ||
              (Array.isArray(vendorUser?.handled_categories) &&
                vendorUser.handled_categories.length === 0) ||
              !vendorUser?.experience ||
              (vendorUser?.name && vendorUser.name.startsWith("Partner ")));

          if (isProfileIncomplete) {
            router.replace("/vendor/complete-profile");
          } else {
            router.replace("/vendor/(tabs)/dashboard");
          }
        } else {
          setData((prev) => ({ ...prev, otp: "" }));
          localizedToast({ type: "error", text1: "Invalid OTP" });
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
        Colors.themes.provider.primaryDark,
        Colors.themes.provider.primary,
        Colors.themes.provider.primaryDark,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView edges={["top"]} style={styles.topSafeArea}>
        {/* Nav Icons with Center Logo */}
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.circleIconButton}
            activeOpacity={0.7}
          >
            <DirectionalIcon name="arrow-back" size={22} color="#FFFFFF" />
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
            <Ionicons name="headset" size={20} color="#FFFFFF" />
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
                  color={Colors.themes.provider.accent}
                />
                <AppText style={styles.licensedText}>{t.auth.partnerProgram}</AppText>
              </View>
            </View>
            <AppText style={styles.brandSubtitle}>
              {t.auth.vendorTagline}
            </AppText>
          </View>
        </View>
      </SafeAreaView>

      {/* Vendor Technician Illustration Positioned on Right Overlapping Sheet */}
      <Image
        source={require("@/assets/images/vendor-hero.png")}
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
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={Colors.themes.provider.primary}
                  />
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
                      openUrl("https://taskercompany.com/partner-terms")
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
                    color={Colors.themes.provider.primary}
                  />
                </View>
                <AppText style={styles.successTitle}>Welcome Back!</AppText>
                <AppText style={styles.successText}>
                  Opening your vendor portal...
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenterLogo: {
    width: 170,
    height: 58,
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
  licensedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  licensedText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 1,
  },
  heroIllustrationRight: {
    position: "absolute",
    right: -10,
    top: Platform.OS === "android" ? 70 : 60,
    width: 160,
    height: 230,
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
    width: 80,
    height: 3.5,
    backgroundColor: Colors.themes.provider.primary,
    borderRadius: 2,
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 6,
  },
  inputDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#18181B",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginBottom: 10,
    marginLeft: 4,
  },
  smsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.primary,
    height: 50,
    borderRadius: 14,
    marginTop: 12,
    gap: 8,
    ...Shadows.sm,
  },
  smsButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#25D366",
    height: 50,
    borderRadius: 14,
    marginTop: 10,
    gap: 8,
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  termsText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 22,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.themes.provider.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 16,
    lineHeight: 20,
  },
  boldPhone: {
    fontWeight: "700",
    color: "#111827",
  },
  otpContainer: {
    justifyContent: "center",
    height: 56,
  },
  otpInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 10,
    textAlign: "center",
    color: "#111827",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    gap: 8,
  },
  resendTimerText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  resendTimerHighlight: {
    color: Colors.themes.provider.primary,
    fontWeight: "700",
  },
  resendActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.themes.provider.primary,
  },
  resendDot: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  changeNumberBtn: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
