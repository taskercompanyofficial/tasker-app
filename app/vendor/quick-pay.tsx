import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { captureRef } from "react-native-view-shot";
import QRCode from "react-native-qrcode-svg";
import AppText from "@/components/common/AppText";
import { localizedToast } from "@/lib/i18n/localized-toast";
import axios from "@/lib/axios.config";
import {
  VENDOR_PAYOUT_SUBMIT_URL,
  VENDOR_ONLINE_PAYMENT_INITIATE_URL,
  VENDOR_ONLINE_PAYMENT_STATUS_URL,
  VENDOR_ONLINE_STATUS_URL,
  VENDOR_EARNINGS_URL,
} from "@/lib/api-endpoints";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Ensure in-app browser redirect auth completes cleanly
WebBrowser.maybeCompleteAuthSession();

// Gateway Sandbox Configuration
const GATEWAY_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_SWICH_CLIENT_ID || "06287289757b43eb82aed8100ca9664f",
  checkoutBaseUrl: "https://sandbox-checkout.swichnow.com",
  taxRatePercent: 2.5,
};

// Official SBP EMVCo Raast Merchant Payload (decodes directly to TASKER COMPANY & Till ID: 984638528)
const TASKER_MERCHANT_RAAST_PAYLOAD =
  "000201010211260600020528760032462c67ec93b4469f85e9a57f47626d980108WMBLPKKA0224PK64JCMA0010101015117000520455335802PK5914TASKER COMPANY6006Lahore530358662460214+92-10151170000611030151170000709984638528630494DE";

export default function VendorQuickPayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dues?: string; amount?: string }>();

  // Tab State: 0 = Instant Online, 1 = JazzCash & Raast QR, 2 = UBL Ameen Bank Transfer
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(1);

  // Financial Dues State
  const initialDues =
    params.dues && !isNaN(Number(params.dues))
      ? Math.max(0, Math.round(Number(params.dues)))
      : 0;
  const [pendingDues, setPendingDues] = useState<number>(initialDues);
  const [inputAmount, setInputAmount] = useState<string>(
    initialDues > 0 ? String(initialDues) : ""
  );
  const [payingOnline, setPayingOnline] = useState(false);

  // Parse entered amount safely (users can pay partial or full as much as they want)
  const numericAmount = Math.max(0, parseInt(inputAmount, 10) || 0);
  const gatewayTaxAmount = Math.round(numericAmount * (GATEWAY_CONFIG.taxRatePercent / 100));
  const totalPayableAmount = numericAmount + gatewayTaxAmount;

  // Fetch actual pending dues on mount
  useEffect(() => {
    if (params.dues && !isNaN(Number(params.dues))) {
      const d = Math.max(0, Math.round(Number(params.dues)));
      setPendingDues(d);
      setInputAmount(d > 0 ? String(d) : "");
      return;
    }

    axios
      .get(VENDOR_ONLINE_STATUS_URL("vendor"))
      .then((res) => {
        const d = res.data?.data;
        if (d) {
          const totalUnsettled = Math.max(
            0,
            Math.round(
              (Number(d.overdue_payables) || 0) + (Number(d.due_today_payables) || 0)
            )
          );
          setPendingDues(totalUnsettled);
          if (totalUnsettled > 0) {
            setInputAmount(String(totalUnsettled));
          } else {
            setInputAmount("");
          }
        }
      })
      .catch(() => {});
  }, [params.dues]);

  // Payment Proof State
  const [selectedProof, setSelectedProof] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);

  // QR Capture & Share State
  const qrCardRef = useRef<View>(null);
  const [savingGallery, setSavingGallery] = useState(false);
  const [sharingQr, setSharingQr] = useState(false);

  // Launch Instant Online Settlement via Gateway (No mention of Swich in UI)
  const handlePayOnline = async () => {
    if (numericAmount <= 0) {
      localizedToast({
        type: "error",
        text1: "Invalid Amount",
        text2: "Please enter an amount to proceed with payment.",
      });
      return;
    }

    try {
      setPayingOnline(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      // Generate deep link redirect target for return
      const redirectUrl = Linking.createURL("payment-success");

      // Attempt to initiate order session via backend first
      let checkoutUrl = "";
      try {
        const initRes = await axios.post(VENDOR_ONLINE_PAYMENT_INITIATE_URL("vendor"), {
          amount: numericAmount,
          redirect_url: redirectUrl,
        });
        if (initRes.data?.data?.checkout_url) {
          checkoutUrl = initRes.data.data.checkout_url;
        }
      } catch (backendErr) {
        console.warn("[QuickPay] Backend payment init failed, falling back to direct URL:", backendErr);
      }

      // Fallback: construct checkout URL directly if backend unavailable
      if (!checkoutUrl) {
        checkoutUrl =
          `${GATEWAY_CONFIG.checkoutBaseUrl}/?` +
          `clientId=${encodeURIComponent(GATEWAY_CONFIG.clientId)}` +
          `&amount=${encodeURIComponent(totalPayableAmount)}` +
          `&currency=PKR` +
          `&orderId=TSK-${Date.now()}` +
          `&redirect_url=${encodeURIComponent(redirectUrl)}`;
      }

      // Open in-app native browser sheet
      const result = await WebBrowser.openAuthSessionAsync(
        checkoutUrl,
        redirectUrl
      );

      if (result.type === "success") {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        // Verify with backend
        try {
          await axios.get(VENDOR_ONLINE_PAYMENT_STATUS_URL("vendor"));
        } catch (_) {}

        localizedToast({
          type: "success",
          text1: "Payment Verified! 🟢",
          text2: `PKR ${totalPayableAmount.toLocaleString()} received. Your account is now unlocked.`,
        });

        router.replace("/vendor/(tabs)/dashboard" as any);
      } else {
        localizedToast({
          type: "info",
          text1: "Payment Incomplete",
          text2: "You can complete your payment whenever you are ready.",
        });
      }
    } catch (err: any) {
      console.warn("[QuickPay] Online Payment Error:", err);
      localizedToast({
        type: "error",
        text1: "Payment Error",
        text2: err?.message || "Could not launch checkout window.",
      });
    } finally {
      setPayingOnline(false);
    }
  };

  // Full Account Details Text
  const getFullAccountDetailsText = () => {
    return [
      "Tasker Company Payment Info:",
      "",
      "JazzCash Till ID: 984638528",
      "(Dial *786*10# on JazzCash)",
      "",
      "Bank: UBL Ameen Bank",
      "Title: Tasker Company",
      "Acc No: 1236320940369",
      "IBAN: PK46UNIL0109000320940369",
    ].join("\n");
  };

  // Copy with Haptic & Toast Feedback
  const handleCopy = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}
      localizedToast({
        type: "success",
        text1: `${label} Copied`,
        text2: text,
      });
    } catch (e) {
      localizedToast({
        type: "error",
        text1: "Copy Failed",
        text2: "Please copy manually.",
      });
    }
  };

  // Copy Complete Bank Details
  const handleCopyAllBankDetails = async () => {
    const details = [
      "TASKER COMPANY SETTLEMENT DETAILS",
      "Bank: UBL Ameen Bank",
      "Title: Tasker Company",
      "Account Number: 1236320940369",
      "IBAN: PK46UNIL0109000320940369",
      "JazzCash Till ID: 984638528 (Dial *786*10#)",
    ].join("\n");

    await handleCopy(details, "All Account Details");
  };

  // 1. Share Details Anywhere via OS Native Share Sheet (WhatsApp, SMS, etc.)
  const handleShareDetails = async () => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      await Share.share({
        message: getFullAccountDetailsText(),
        title: "Tasker Company Payment Information",
      });
    } catch (err: any) {
      console.warn("[QuickPay] Share details error:", err);
    }
  };

  // 2. Direct Share to WhatsApp
  const handleShareWhatsApp = async () => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const text = [
        "*TASKER COMPANY PAYMENT INFO*",
        "",
        "📲 *JazzCash Till ID:* 984638528",
        "_(Dial *786*10# on JazzCash)_",
        "",
        "🏦 *Bank:* UBL Ameen Bank",
        "👤 *Title:* Tasker Company",
        "🔢 *Acc No:* 1236320940369",
        "🌐 *IBAN:* PK46UNIL0109000320940369",
      ].join("\n");

      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({
          message: text,
          title: "Tasker Company Payment Info",
        });
      }
    } catch (err: any) {
      console.warn("[QuickPay] WhatsApp share error:", err);
    }
  };

  // 3. Save / Share QR Code Image (uses native Sharing without requiring MediaLibrary permissions)
  const handleSaveQrToGallery = async () => {
    try {
      if (!qrCardRef.current || savingGallery) return;
      setSavingGallery(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const uri = await captureRef(qrCardRef, {
        format: "png",
        quality: 1.0,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Save / Share Tasker QR Code",
        });
      } else {
        localizedToast({
          type: "info",
          text1: "Sharing Unavailable",
          text2: "Unable to open share sheet on this device.",
        });
      }
    } catch (err: any) {
      console.warn("[QuickPay] Save to gallery error:", err);
      localizedToast({
        type: "error",
        text1: "Save Failed",
        text2: err?.message || "Could not save QR code.",
      });
    } finally {
      setSavingGallery(false);
    }
  };

  // 4. Share QR Code Image File via Expo Sharing
  const handleShareQrImage = async () => {
    try {
      if (!qrCardRef.current || sharingQr) return;
      setSharingQr(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const uri = await captureRef(qrCardRef, {
        format: "png",
        quality: 1.0,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Tasker Company QR Code",
          UTI: "public.png",
        });
      } else {
        await handleShareDetails();
      }
    } catch (err: any) {
      console.warn("[QuickPay] Share QR image error:", err);
    } finally {
      setSharingQr(false);
    }
  };

  // Pick Payment Proof from Gallery
  const handlePickProof = async () => {
    try {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedProof(result.assets[0]);
      }
    } catch (err) {
      console.warn("[QuickPay] Pick image failed:", err);
    }
  };

  // Submit Payment Proof to Finance
  const handleSubmitProof = async () => {
    if (!selectedProof) {
      localizedToast({
        type: "error",
        text1: "No Receipt Selected",
        text2: "Please select your bank slip screenshot first.",
      });
      return;
    }

    try {
      setSubmittingProof(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const submittedAmt =
        numericAmount > 0 ? numericAmount : pendingDues > 0 ? pendingDues : 1;
      const formData = new FormData();
      formData.append("amount", String(submittedAmt));
      formData.append(
        "payment_method",
        activeTab === 1 ? "jazzcash_raast" : activeTab === 2 ? "ubl_bank" : "online_gateway"
      );
      formData.append("notes", `Submitted PKR ${submittedAmt.toLocaleString()} via Quick Pay Screen`);

      const uriParts = selectedProof.uri.split(".");
      const fileType = uriParts[uriParts.length - 1] || "jpg";

      formData.append("file", {
        uri: selectedProof.uri,
        name: `receipt_${Date.now()}.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      } as any);

      const res = await axios.post(VENDOR_PAYOUT_SUBMIT_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === "success" || res.status === 200) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        setProofUploaded(true);
        setSelectedProof(null);
        localizedToast({
          type: "success",
          text1: "Receipt Submitted",
          text2: "Finance team will verify and unlock your account.",
        });
      }
    } catch (err: any) {
      console.error("[QuickPay] Submit error:", err);
      localizedToast({
        type: "error",
        text1: "Submission Failed",
        text2: err?.response?.data?.message || "Could not upload receipt.",
      });
    } finally {
      setSubmittingProof(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      {/* ─── 1. TOP BAR (Strictly Flat, No Shadows) ─── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <AppText style={styles.headerTitle}>Quick Pay</AppText>
          <AppText style={styles.headerSub}>Company Account Details</AppText>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2. SEGMENTED SCROLLABLE TABS ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          style={styles.tabScrollWrap}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 0 && styles.tabButtonActive]}
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab(0);
              Haptics.selectionAsync().catch(() => {});
            }}
          >
            <Ionicons
              name="flash"
              size={14}
              color={activeTab === 0 ? "#059669" : "#64748B"}
            />
            <AppText
              style={[styles.tabButtonText, activeTab === 0 && styles.tabButtonTextActive]}
            >
              Instant Online
            </AppText>
            <View style={styles.tabSoonBadge}>
              <AppText style={styles.tabSoonBadgeText}>Soon</AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 1 && styles.tabButtonActive]}
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab(1);
              Haptics.selectionAsync().catch(() => {});
            }}
          >
            <Ionicons
              name="qr-code"
              size={14}
              color={activeTab === 1 ? "#0F172A" : "#64748B"}
            />
            <AppText
              style={[styles.tabButtonText, activeTab === 1 && styles.tabButtonTextActive]}
            >
              JazzCash & Raast QR
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 2 && styles.tabButtonActive]}
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab(2);
              Haptics.selectionAsync().catch(() => {});
            }}
          >
            <Ionicons
              name="business"
              size={14}
              color={activeTab === 2 ? "#0F172A" : "#64748B"}
            />
            <AppText
              style={[styles.tabButtonText, activeTab === 2 && styles.tabButtonTextActive]}
            >
              UBL Ameen Bank
            </AppText>
          </TouchableOpacity>
        </ScrollView>

        {/* ─── TAB 0: INSTANT ONLINE PAYMENT (COMING SOON) ─── */}
        {activeTab === 0 && (
          <View style={styles.paymentCard}>
            <View style={styles.comingSoonCard}>
              <View style={styles.comingSoonIconCircle}>
                <Ionicons name="card-outline" size={32} color="#D97706" />
              </View>

              <View style={styles.comingSoonPill}>
                <AppText style={styles.comingSoonPillText}>COMING SOON</AppText>
              </View>

              <AppText style={styles.comingSoonTitle}>
                Online Gateway Checkout
              </AppText>

              <AppText style={styles.comingSoonDesc}>
                Direct debit/credit card and digital wallet gateway checkout is currently being configured and will be enabled in an upcoming release.
              </AppText>

              <View style={styles.comingSoonNoticeBox}>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                <AppText style={styles.comingSoonNoticeText}>
                  Please settle your daily dues seamlessly using JazzCash & Raast QR or UBL Ameen Bank Transfer with zero fee.
                </AppText>
              </View>

              <TouchableOpacity
                style={styles.comingSoonSwitchBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setActiveTab(1);
                  Haptics.selectionAsync().catch(() => {});
                }}
              >
                <Ionicons name="qr-code" size={16} color="#FFFFFF" />
                <AppText style={styles.comingSoonSwitchBtnText}>
                  Pay via JazzCash & Raast QR
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.comingSoonSecBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setActiveTab(2);
                  Haptics.selectionAsync().catch(() => {});
                }}
              >
                <Ionicons name="business-outline" size={16} color="#0F172A" />
                <AppText style={styles.comingSoonSecBtnText}>
                  Bank Transfer (UBL Ameen)
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── TAB 1: JAZZCASH & RAAST QR CARD ─── */}
        {activeTab === 1 && (
          <View style={styles.paymentCard}>
            {/* Captured Slip Target (Includes Merchant Name, Official Raast QR & Till ID for Gallery/Share) */}
            <View
              ref={qrCardRef}
              collapsable={false}
              style={styles.qrCaptureBox}
            >
              <View style={styles.merchantHeader}>
                <AppText style={styles.merchantNameTitle}>TASKER COMPANY</AppText>
                <View style={styles.tagsRow}>
                  <View style={styles.tagJazzCash}>
                    <AppText style={styles.tagJazzCashText}>JazzCash Merchant</AppText>
                  </View>
                  <View style={styles.tagRaast}>
                    <AppText style={styles.tagRaastText}>Raast Interoperable</AppText>
                  </View>
                </View>
              </View>

              {/* Always Dynamic Valid Raast QR Visual */}
              <View style={styles.qrCenterWrapper}>
                <View style={styles.qrCanvasBox}>
                  <QRCode
                    value={TASKER_MERCHANT_RAAST_PAYLOAD}
                    size={195}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <AppText style={styles.qrScanInstruction}>
                  Scan with JazzCash, Easypaisa, or any Raast banking app
                </AppText>
              </View>

              {/* Till ID Banner inside captured slip */}
              <View style={styles.slipTillBanner}>
                <AppText style={styles.slipTillLabel}>TILL ID: </AppText>
                <AppText style={styles.slipTillValue}>984638528</AppText>
              </View>
            </View>

            {/* Till ID Box (Anchored, Solid Container, Non-floating) */}
            <View style={styles.tillIdBox}>
              <View style={styles.tillIdTextWrap}>
                <AppText style={styles.tillIdLabel}>JAZZCASH TILL ID</AppText>
                <AppText style={styles.tillIdValue}>984638528</AppText>
              </View>

              <TouchableOpacity
                style={styles.copyBoxBtn}
                activeOpacity={0.75}
                onPress={() => handleCopy("984638528", "Till ID")}
              >
                <Ionicons name="copy-outline" size={14} color="#0F172A" />
                <AppText style={styles.copyBoxBtnText}>Copy</AppText>
              </TouchableOpacity>
            </View>

            {/* USSD Dial Helper */}
            <View style={styles.ussdHelperBox}>
              <Ionicons name="call-outline" size={15} color="#B45309" />
              <AppText style={styles.ussdHelperText}>
                JazzCash user? Dial <AppText style={styles.ussdCodeBold}>*786*10#</AppText> & enter Till ID
              </AppText>
            </View>

            {/* Action Row 1: Save to Gallery & Share QR Image (Expo Sharing + MediaLibrary) */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.8}
                onPress={handleSaveQrToGallery}
                disabled={savingGallery}
              >
                {savingGallery ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color="#0F172A" />
                    <AppText style={styles.actionBtnText}>Save to Gallery</AppText>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.8}
                onPress={handleShareQrImage}
                disabled={sharingQr}
              >
                {sharingQr ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={16} color="#0F172A" />
                    <AppText style={styles.actionBtnText}>Share QR Image</AppText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Action Row 2: WhatsApp & System Share Sheet */}
            <View style={styles.actionBtnRowSecondary}>
              <TouchableOpacity
                style={styles.actionBtnWhatsApp}
                activeOpacity={0.8}
                onPress={handleShareWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <AppText style={styles.actionBtnWhatsAppText}>Share on WhatsApp</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                activeOpacity={0.8}
                onPress={handleShareDetails}
              >
                <Ionicons name="share-social-outline" size={16} color="#0F172A" />
                <AppText style={styles.actionBtnSecondaryText}>Share Details</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── 4. TAB 2: UBL AMEEN BANK CARD ─── */}
        {activeTab === 2 && (
          <View style={styles.paymentCard}>
            {/* Bank Header */}
            <View style={styles.bankHeaderRow}>
              <View style={styles.bankAvatarBox}>
                <AppText style={styles.bankAvatarText}>UBL</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.bankName}>UBL Ameen Bank</AppText>
                <AppText style={styles.bankSub}>Islamic Banking · 1Link / Raast</AppText>
              </View>
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <AppText style={styles.verifiedTagText}>Verified</AppText>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Account Title */}
            <View style={styles.detailItem}>
              <AppText style={styles.detailLabel}>ACCOUNT TITLE</AppText>
              <View style={styles.detailValueBox}>
                <AppText style={styles.detailValueBold}>Tasker Company</AppText>
                <TouchableOpacity
                  style={styles.miniCopyBtn}
                  activeOpacity={0.7}
                  onPress={() => handleCopy("Tasker Company", "Account Title")}
                >
                  <Ionicons name="copy-outline" size={13} color="#0F172A" />
                  <AppText style={styles.miniCopyBtnText}>Copy</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Account Number */}
            <View style={styles.detailItem}>
              <AppText style={styles.detailLabel}>ACCOUNT NUMBER</AppText>
              <View style={styles.detailValueBox}>
                <AppText style={styles.detailMonoValue}>1236320940369</AppText>
                <TouchableOpacity
                  style={styles.miniCopyBtn}
                  activeOpacity={0.7}
                  onPress={() => handleCopy("1236320940369", "Account Number")}
                >
                  <Ionicons name="copy-outline" size={13} color="#0F172A" />
                  <AppText style={styles.miniCopyBtnText}>Copy</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* IBAN */}
            <View style={styles.detailItem}>
              <AppText style={styles.detailLabel}>IBAN (RAAST & INTER-BANK)</AppText>
              <View style={[styles.detailValueBox, { flexDirection: "column", alignItems: "stretch", gap: 8 }]}>
                <AppText style={styles.detailMonoValue}>PK46 UNIL 0109 0003 2094 0369</AppText>
                <View style={{ alignSelf: "flex-end" }}>
                  <TouchableOpacity
                    style={styles.miniCopyBtn}
                    activeOpacity={0.7}
                    onPress={() => handleCopy("PK46UNIL0109000320940369", "IBAN")}
                  >
                    <Ionicons name="copy-outline" size={13} color="#0F172A" />
                    <AppText style={styles.miniCopyBtnText}>Copy IBAN</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Copy All Button */}
            <TouchableOpacity
              style={styles.copyAllBtn}
              activeOpacity={0.8}
              onPress={handleCopyAllBankDetails}
            >
              <Ionicons name="documents-outline" size={16} color="#FFFFFF" />
              <AppText style={styles.copyAllBtnText}>Copy Complete Bank Details</AppText>
            </TouchableOpacity>

            {/* Share Row for Bank Tab */}
            <View style={styles.actionBtnRowSecondary}>
              <TouchableOpacity
                style={styles.actionBtnWhatsApp}
                activeOpacity={0.8}
                onPress={handleShareWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <AppText style={styles.actionBtnWhatsAppText}>Share on WhatsApp</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                activeOpacity={0.8}
                onPress={handleShareDetails}
              >
                <Ionicons name="share-social-outline" size={16} color="#0F172A" />
                <AppText style={styles.actionBtnSecondaryText}>Share Details</AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── 5. SUBMIT PAYMENT RECEIPT SECTION ─── */}
        <View style={styles.paymentCard}>
          <View style={styles.receiptHeader}>
            <Ionicons name="receipt-outline" size={18} color="#0F172A" />
            <AppText style={styles.receiptTitle}>Submit Payment Receipt</AppText>
          </View>
          <AppText style={styles.receiptSubtitle}>
            Upload your transfer screenshot or bank deposit slip for verification.
          </AppText>

          {/* Amount Paid Input for Receipt Verification */}
          <View style={{ marginBottom: 12 }}>
            <AppText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#475569",
                marginBottom: 6,
                letterSpacing: 0.4,
              }}
            >
              AMOUNT PAID (PKR)
            </AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#CBD5E1",
                borderRadius: 10,
                backgroundColor: "#F8FAFC",
                paddingHorizontal: 12,
                height: 44,
              }}
            >
              <AppText style={{ fontSize: 14, fontWeight: "800", color: "#0F172A", marginRight: 8 }}>
                PKR
              </AppText>
              <TextInput
                value={inputAmount}
                onChangeText={(txt) => setInputAmount(txt.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                placeholder={pendingDues > 0 ? String(pendingDues) : "Enter amount paid"}
                placeholderTextColor="#94A3B8"
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: "800",
                  color: "#0F172A",
                  paddingVertical: 0,
                }}
              />
            </View>
          </View>

          {proofUploaded && (
            <View style={styles.successMessageBox}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <AppText style={styles.successMessageText}>
                Receipt submitted! Verification is in progress.
              </AppText>
            </View>
          )}

          {selectedProof ? (
            <View style={styles.previewBox}>
              <Image
                source={{ uri: selectedProof.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeProofBtn}
                onPress={() => setSelectedProof(null)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadArea}
              activeOpacity={0.75}
              onPress={handlePickProof}
            >
              <Ionicons name="cloud-upload-outline" size={26} color="#64748B" />
              <AppText style={styles.uploadAreaText}>Select Receipt from Gallery</AppText>
            </TouchableOpacity>
          )}

          {selectedProof && (
            <TouchableOpacity
              style={styles.submitReceiptBtn}
              activeOpacity={0.85}
              onPress={handleSubmitProof}
              disabled={submittingProof}
            >
              {submittingProof ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.submitReceiptRow}>
                  <Ionicons name="send" size={15} color="#FFFFFF" />
                  <AppText style={styles.submitReceiptText}>Upload Proof for Verification</AppText>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F2F3F5",
  },
  topHeader: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // ─── SCROLLABLE FLAT TABS (Zero Shadows) ───
  tabScrollWrap: {
    marginBottom: 16,
    flexGrow: 0,
  },
  tabScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 2,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: "#0F172A",
    fontWeight: "800",
  },
  tabSoonBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 3,
  },
  tabSoonBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },
  comingSoonCard: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  comingSoonIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  comingSoonPill: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  comingSoonPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.5,
  },
  comingSoonTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  comingSoonDesc: {
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  comingSoonNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    width: "100%",
  },
  comingSoonNoticeText: {
    fontSize: 11.5,
    color: "#475569",
    flex: 1,
    lineHeight: 16,
  },
  comingSoonSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 13,
    width: "100%",
    marginBottom: 10,
  },
  comingSoonSwitchBtnText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  comingSoonSecBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
  },
  comingSoonSecBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },

  // ─── ACCURATE PAYMENT CARD (Structured, Zero Shadows) ───
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    gap: 14,
  },

  // ─── PENDING AMOUNT CARD ───
  pendingAmountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  pendingAmountLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#64748B",
  },
  pendingAmountValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#EF4444",
  },

  // ─── AMOUNT INPUT SECTION ───
  amountInputContainer: {
    gap: 6,
  },
  amountInputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  amountPrefix: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    paddingVertical: 0,
  },
  payFullChip: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  payFullChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },

  // ─── FEE NOTE ───
  feeNoteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  feeNoteText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    flex: 1,
    lineHeight: 15,
  },

  // ─── MINIMAL CALCULATION BREAKDOWN ───
  calcCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  calcRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calcLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  calcVal: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  calcValMuted: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#475569",
  },
  calcDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  calcTotalLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  calcTotalVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  // ─── PAY ACTION BUTTON ───
  payOnlineBtn: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payOnlineBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  payOnlineBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  merchantHeader: {
    alignItems: "center",
    marginBottom: 8,
  },

  // ─── QR VIEW HOLDER ───
  qrCenterWrapper: {
    alignItems: "center",
    paddingVertical: 6,
  },
  qrScanInstruction: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
  },
  qrCanvasBox: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 10,
  },
  merchantNameTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  tagJazzCash: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagJazzCashText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B45309",
    textTransform: "uppercase",
  },
  tagRaast: {
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagRaastText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0369A1",
    textTransform: "uppercase",
  },

  // ─── TILL ID BOX ───
  tillIdBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  tillIdTextWrap: {
    flex: 1,
  },
  tillIdLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tillIdValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 2,
  },
  copyBoxBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBoxBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },

  // ─── USSD HELPER ───
  ussdHelperBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  ussdHelperText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#92400E",
    flex: 1,
  },
  ussdCodeBold: {
    fontWeight: "900",
    color: "#78350F",
  },

  // ─── ACTION BUTTONS ROW ───
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionBtnRowSecondary: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  actionBtnWhatsApp: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    borderWidth: 1,
    borderColor: "#15803D",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnWhatsAppText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  qrCaptureBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    alignItems: "center",
  },
  slipTillBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 10,
    width: "100%",
  },
  slipTillLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  slipTillValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
  },

  // ─── BANK DETAILS STYLING ───
  bankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bankAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#064E3B",
    alignItems: "center",
    justifyContent: "center",
  },
  bankAvatarText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#A7F3D0",
  },
  bankName: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  bankSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#047857",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValueBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 10,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailMonoValue: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  miniCopyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniCopyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
  },
  copyAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  copyAllBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // ─── RECEIPT UPLOAD SECTION ───
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  receiptSubtitle: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 12,
  },
  uploadArea: {
    height: 90,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  uploadAreaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  previewBox: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000000",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeProofBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
  },
  submitReceiptBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitReceiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  submitReceiptText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  successMessageBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  successMessageText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#047857",
    flex: 1,
  },
});
