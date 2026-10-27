import { localizedToast } from "@/lib/i18n/localized-toast";
import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import LanguageSwitcherModal from "@/components/common/LanguageSwitcherModal";
import React, { useMemo, useState, useCallback } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import myAxios from "@/lib/axios.config";
import {
  VENDOR_SIGN_OUT_URL,
  VENDOR_STAFF_SIGN_OUT_URL,
  VENDOR_WORK_ORDER_SUMMARY_URL,
  VENDOR_STAFF_WORK_ORDER_SUMMARY_URL,
  VENDOR_ME_URL,
  VENDOR_STAFF_ME_URL,
} from "@/lib/api-endpoints";
import { router, useFocusEffect } from "expo-router";
import AlertModal from "@/components/common/AlertModal";
import * as SystemUI from "expo-system-ui";
import { getAppVersionDisplay } from "@/lib/appVersion";
import { Image } from "expo-image";
import getImageUrl from "@/lib/utils";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import * as Clipboard from "expo-clipboard";

export default function VendorSettings() {
  const { session, setAppMode, signOutMode } = useSession();
  const { language } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const isVendor = useMemo(
    () => session.appMode === "vendor" || session.appMode === "vendor_staff",
    [session.appMode],
  );
  const isStaff = useMemo(
    () => session.appMode === "vendor_staff" || session.user?.user_type === "vendor_staff",
    [session.appMode, session.user],
  );

  // Dynamic Vendor/Staff ID Code
  const dynamicVendorCode = useMemo(() => {
    const rawCode =
      (session.user as any)?.vendor_code ||
      (session.user as any)?.code ||
      (session.vendorUser as any)?.vendor_code;
    if (rawCode) return String(rawCode).toUpperCase();
    const id = session.user?.id || (session.vendorUser as any)?.id || 1;
    const padded = String(id).padStart(4, "0");
    return isStaff ? `TC-STF-${padded}` : `TC-VND-${padded}`;
  }, [session.user, session.vendorUser, isStaff]);

  // Live Backend Stats State
  const [liveStats, setLiveStats] = useState<{
    completed: number;
    rating: number;
    reviewsCount: number;
    joinedDate: string;
    categoryName: string;
  }>({
    completed: 0,
    rating: 5.0,
    reviewsCount: 0,
    joinedDate: "Partner",
    categoryName: isStaff ? "Technical Staff" : "Official Service Partner",
  });

  const fetchLiveStats = useCallback(async () => {
    try {
      const summaryUrl = isStaff ? VENDOR_STAFF_WORK_ORDER_SUMMARY_URL : VENDOR_WORK_ORDER_SUMMARY_URL;
      const meUrl = isStaff ? VENDOR_STAFF_ME_URL : VENDOR_ME_URL;

      const [summaryRes, meRes] = await Promise.all([
        myAxios.get(summaryUrl).catch(() => null),
        myAxios.get(meUrl).catch(() => null),
      ]);

      const summaryData = summaryRes?.data?.data || summaryRes?.data;
      const userData = meRes?.data?.user || meRes?.data?.data || session.user;

      const completed = Number(summaryData?.completed ?? 0);
      const rating = Number(
        userData?.rating ||
        (userData as any)?.ratings_avg ||
        (completed > 0 ? 4.9 : 5.0),
      );
      const reviews = Number((userData as any)?.reviews_count ?? completed);

      let joinedDate = "Partner";
      if (userData?.created_at) {
        try {
          const d = new Date(userData.created_at);
          joinedDate = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } catch {}
      }

      const categoryName =
        userData?.category?.name ||
        (userData as any)?.category_name ||
        (isStaff ? "Technical Staff" : "Official Service Partner");

      setLiveStats({
        completed,
        rating: Number(rating.toFixed(1)),
        reviewsCount: reviews,
        joinedDate,
        categoryName,
      });
    } catch {
      // Graceful fallback
    }
  }, [isStaff, session.user]);

  useFocusEffect(
    useCallback(() => {
      fetchLiveStats();
      SystemUI.setBackgroundColorAsync("#F4F5F7");
      return () => {
        SystemUI.setBackgroundColorAsync("#FFFFFF");
      };
    }, [fetchLiveStats]),
  );

  const vendorName = session.user?.name || (isStaff ? "Staff Member" : "Muhammad Hanzla");
  const vendorEmail =
    session.user?.email ||
    (session.user?.phone ? `${session.user.phone}@tasker` : "provider@tasker.com");
  const vendorPhone = session.user?.phone || "+92 300 1234567";
  const referralCode =
    (session.user as any)?.referral_code ||
    `TC${session.user?.id || "4921"}`;

  const rawVendorAvatar =
    session.user?.active_avatar_url ||
    session.user?.profile_image ||
    session.user?.avatar_url ||
    (session.user as any)?.image ||
    null;
  const vendorAvatarUri = rawVendorAvatar ? getImageUrl(rawVendorAvatar) : "";

  const onSignOut = async () => {
    try {
      if (isStaff) {
        await myAxios.post(VENDOR_STAFF_SIGN_OUT_URL);
      } else {
        await myAxios.post(VENDOR_SIGN_OUT_URL);
      }
    } catch {}
    await signOutMode(isStaff ? "vendor_staff" : "vendor");
    localizedToast({ type: "success", text1: "Successfully signed out" });

    await setAppMode("customer");
    if (session.customerToken) {
      router.replace("/customer/(tabs)");
    } else {
      router.replace("/auth/customer/sign-in");
    }
  };

  const handleShareReferral = async () => {
    try {
      await Share.share({
        title: "Join Tasker Company as Partner",
        message: `Join Tasker Company as a service partner! Register using my invite code ${referralCode} and get authorized to earn: https://taskercompany.com/partner/join?ref=${referralCode}`,
      });
    } catch {}
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      localizedToast({ type: "success", text1: "Invite code copied to clipboard" });
    } catch {}
  };

  const handleOpenBadge = () => {
    setShowBadgeModal(true);
  };

  const handleOpenDisputes = () => {
    localizedToast({
      type: "info",
      text1: "Dispute & Claims Desk",
      text2: "Connecting with Support Agent...",
    });
    router.push("/vendor/support-chat" as any);
  };

  const handleCallHelpline = () => {
    Linking.openURL("tel:03041112717").catch(() => {
      localizedToast({ type: "info", text1: "Helpline: 0304-111-2717" });
    });
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="#F4F5F7"
        translucent
      />

      {/* Top Navigation Bar: Back & Employee ID Badge Button */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navIconBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.idCardPillBtn}
          activeOpacity={0.8}
          onPress={handleOpenBadge}
          accessibilityLabel="View Employee Card"
        >
          <Ionicons name="id-card-outline" size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header (Centered Avatar & Name) */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.85}
            onPress={handleOpenBadge}
          >
            {vendorAvatarUri && !avatarError ? (
              <Image
                source={{ uri: vendorAvatarUri }}
                style={styles.avatarImg}
                contentFit="cover"
                transition={200}
                cachePolicy="disk"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <AppText style={styles.avatarFallbackText}>
                  {vendorName.charAt(0).toUpperCase()}
                </AppText>
              </View>
            )}
            <View style={styles.verifiedShieldBadge}>
              <Ionicons name="checkmark-sharp" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <AppText style={styles.profileName}>{vendorName}</AppText>
          <View style={styles.profileMetaRow}>
            <AppText style={styles.profileHandle}>{vendorPhone}</AppText>
            <View style={styles.profileDotDivider} />
            <View style={styles.profileRatingChip}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <AppText style={styles.profileRatingText}>
                {liveStats.rating.toFixed(1)}
              </AppText>
            </View>
          </View>
        </View>

        {/* 1. FROSTED MINIMAL SEGMENTED SWITCHER (Option 3 - At First!) */}
        <View style={styles.frostedSegmentContainer}>
          {/* Customer Segment Button */}
          <TouchableOpacity
            style={styles.segmentItemInactive}
            activeOpacity={0.75}
            onPress={() => setShowSwitchConfirm(true)}
          >
            <Ionicons name="person-outline" size={15} color="#64748B" />
            <AppText style={styles.segmentTextInactive}>Customer</AppText>
          </TouchableOpacity>

          {/* Active Vendor Partner Segment Button (Emerald Green Theme) */}
          <View style={styles.segmentItemActive}>
            <Ionicons name="briefcase" size={15} color="#059669" />
            <AppText style={styles.segmentTextActive}>Vendor Partner</AppText>
            <View style={styles.activeBeaconDot} />
          </View>
        </View>

        {/* 2. INVITE FRIENDS CARD (Tasker Emerald Theme) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowReferralModal(true)}
        >
          <LinearGradient
            colors={["#059669", "#047857", "#064E3B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.referralCard}
          >
            <View style={styles.referralTextBox}>
              <AppText style={styles.referralTitle}>Invite Friends & Earn PKR 500</AppText>
              <AppText style={styles.referralSubtitle}>
                Bonus credited to your monthly payout once your invited friend gets authorized.
              </AppText>
            </View>

            <View style={styles.referralGraphicBox} pointerEvents="none">
              <Svg width={60} height={60} viewBox="0 0 100 100">
                <Defs>
                  <SvgLinearGradient id="refGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
                    <Stop offset="60%" stopColor="#A7F3D0" stopOpacity={0.8} />
                    <Stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
                  </SvgLinearGradient>
                </Defs>
                <Path d="M16 88 C 16 66, 30 56, 50 56 C 70 56, 84 66, 84 88 Z" fill="url(#refGlow)" />
                <Circle cx={50} cy={36} r={17} fill="url(#refGlow)" />
                <Circle cx={72} cy={54} r={13} fill="#FDE68A" stroke="#FFFFFF" strokeWidth={2} />
                <Path d="M72 47 V 61 M 65 54 H 79" stroke="#78350F" strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 3. Group 1: Business & Identity */}
        <View style={styles.cardGroup}>
          {/* Employee ID & Profile */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.65}
            onPress={handleOpenBadge}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="person" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>Employee ID & Profile</AppText>
            <View style={styles.dynamicCodeChip}>
              <AppText style={styles.dynamicCodeChipText}>{dynamicVendorCode}</AppText>
            </View>
          </TouchableOpacity>

          {/* Service Rate Ledger */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.65}
            onPress={() => router.push("/vendor/ledger" as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="receipt" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>Service Rate Ledger</AppText>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Staff Management (Vendor Only) */}
          {!isStaff && (
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.65}
              onPress={() => router.push("/vendor/staff" as any)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="people" size={20} color="#1F2937" />
              </View>
              <AppText style={styles.menuLabel}>Staff Management</AppText>
            </TouchableOpacity>
          )}

          {/* Notifications Center */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.65}
            onPress={() => router.push("/vendor/notifications" as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="notifications" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>Notifications</AppText>
          </TouchableOpacity>

          {/* App Permissions (Replaces redundant 'Settings' link!) */}
          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowLast]}
            activeOpacity={0.65}
            onPress={() => router.push("/vendor/permissions" as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>App Permissions</AppText>
          </TouchableOpacity>
        </View>

        {/* 4. Group 2: Help & Support */}
        <View style={styles.cardGroup}>
          {/* Manage Disputes */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.65}
            onPress={handleOpenDisputes}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="alert-circle" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>Manage Disputes</AppText>
          </TouchableOpacity>

          {/* Chat with Support */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.65}
            onPress={() => router.push("/vendor/support-chat" as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>Chat with Support</AppText>
          </TouchableOpacity>

          {/* Call Helpline */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.65}
            onPress={handleCallHelpline}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="phone-portrait" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>Call Helpline</AppText>
          </TouchableOpacity>

          {/* Language Switcher */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.65}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="globe" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>
              {language === "ur" ? "زبان (Language)" : "Language"}
            </AppText>
          </TouchableOpacity>

          {/* Give Feedback */}
          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowLast]}
            activeOpacity={0.65}
            onPress={() => {
              localizedToast({
                type: "success",
                text1: "Thank you for your feedback!",
                text2: "We're constantly improving the partner experience.",
              });
            }}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="happy" size={20} color="#1F2937" />
            </View>
            <AppText style={styles.menuLabel}>Give Feedback</AppText>
          </TouchableOpacity>
        </View>

        {/* 5. Group 3: Sign Out */}
        <View style={styles.cardGroup}>
          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowLast]}
            activeOpacity={0.65}
            onPress={onSignOut}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="log-out" size={20} color="#DC2626" />
            </View>
            <AppText style={[styles.menuLabel, styles.signoutLabel]}>Sign Out</AppText>
          </TouchableOpacity>
        </View>

        <AppText style={styles.versionText}>{getAppVersionDisplay("Tasker Company")}</AppText>
      </ScrollView>

      {/* DEDICATED TASKER COMPANY EMPLOYEE ID BADGE MODAL */}
      <Modal
        visible={showBadgeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBadgeModal(false)}
      >
        <View style={styles.badgeModalBackdrop}>
          {/* Physical Lanyard Ribbon & Metallic Silver Clip on Top */}
          <View style={styles.lanyardTopContainer}>
            <View style={styles.lanyardStrap} />
            <LinearGradient
              colors={["#FFFFFF", "#E2E8F0", "#94A3B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.lanyardClip}
            />
          </View>

          <View style={styles.employeeBadgeCard}>
            {/* Lanyard Punch-Hole Slot */}
            <View style={styles.lanyardPunchHole} />

            {/* Badge Top Header (Emerald Green) */}
            <LinearGradient
              colors={["#064E3B", "#059669", "#10B981"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeHeaderLinear}
            >
              <View style={styles.badgeCompanyRow}>
                <Ionicons name="star" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
                <AppText style={styles.badgeCompanyText}>TASKER COMPANY</AppText>
              </View>
              <AppText style={styles.badgeSubText}>OFFICIAL SERVICE PARTNER CARD</AppText>
            </LinearGradient>

            {/* Worker Identity Section */}
            <View style={styles.badgeBodySection}>
              {/* Photo Box */}
              <View style={styles.badgePhotoContainer}>
                {vendorAvatarUri && !avatarError ? (
                  <Image
                    source={{ uri: vendorAvatarUri }}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <AppText style={styles.avatarFallbackText}>
                      {vendorName.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
              </View>

              <AppText style={styles.badgeWorkerName}>{vendorName}</AppText>
              <AppText style={styles.badgeWorkerTrade}>{liveStats.categoryName}</AppText>

              {/* Dynamic Employee Code */}
              <View style={styles.badgeCodeTag}>
                <AppText style={styles.badgeCodeLabel}>ID CODE:</AppText>
                <AppText style={styles.badgeCodeValue}>{dynamicVendorCode}</AppText>
              </View>

              {/* Metrics Grid */}
              <View style={styles.badgeMetricsRow}>
                <View style={styles.badgeMetricCol}>
                  <View style={styles.metricValRow}>
                    <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 2 }} />
                    <AppText style={styles.badgeMetricNum}>{liveStats.rating}</AppText>
                  </View>
                  <AppText style={styles.badgeMetricSub}>{liveStats.reviewsCount} Reviews</AppText>
                </View>

                <View style={styles.badgeMetricCol}>
                  <AppText style={styles.badgeMetricNum}>{liveStats.completed}</AppText>
                  <AppText style={styles.badgeMetricSub}>Jobs Done</AppText>
                </View>

                <View style={[styles.badgeMetricCol, { borderRightWidth: 0 }]}>
                  <AppText style={[styles.badgeMetricNum, { color: "#059669" }]}>98%</AppText>
                  <AppText style={styles.badgeMetricSub}>On-Time</AppText>
                </View>
              </View>

              {/* Scannable Verification QR Code (Crisp Black on White) */}
              <View style={styles.badgeQrContainer}>
                <QRCode
                  value={`TASKER-VERIFIED-PARTNER:${dynamicVendorCode}:${vendorName}`}
                  size={120}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
                <AppText style={styles.badgeQrNote}>SCAN FOR ON-SPOT VERIFICATION</AppText>
              </View>
            </View>

            {/* Badge Footer Band */}
            <View style={styles.badgeFooterRow}>
              <AppText style={styles.badgeFooterText}>
                Status: <AppText style={styles.badgeFooterBold}>AUTHORIZED</AppText>
              </AppText>
              <AppText style={styles.badgeFooterText}>
                Since: <AppText style={styles.badgeFooterBold}>{liveStats.joinedDate.toUpperCase()}</AppText>
              </AppText>
            </View>

            {/* Actions */}
            <View style={styles.badgeActionRow}>
              <TouchableOpacity
                style={styles.badgeCloseBtn}
                activeOpacity={0.7}
                onPress={() => setShowBadgeModal(false)}
              >
                <AppText style={styles.badgeCloseBtnText}>Close</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.badgeShareBtn}
                activeOpacity={0.8}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `Tasker Official Partner ID: ${dynamicVendorCode}\nName: ${vendorName}\nCategory: ${liveStats.categoryName}\nRating: ⭐ ${liveStats.rating} (${liveStats.completed} Completed Jobs)`,
                    });
                  } catch {}
                }}
              >
                <Ionicons name="share-social-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <AppText style={styles.badgeShareBtnText}>Share Card</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Referral & Invite Modal */}
      <Modal
        visible={showReferralModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.badgeModalBackdrop}>
          <View style={styles.refModalCard}>
            <View style={styles.refGiftBadge}>
              <Ionicons name="gift" size={28} color="#F59E0B" />
            </View>

            <AppText style={styles.refModalTitle}>Invite Partner & Earn PKR 500</AppText>
            <AppText style={styles.refModalDesc}>
              Invite technicians or service providers to join Tasker Company.
            </AppText>

            <View style={styles.refRuleBox}>
              <View style={styles.refRuleItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <AppText style={styles.refRuleText}>
                  Bonus of <AppText style={styles.boldText}>PKR 500</AppText> credited to your <AppText style={styles.boldText}>monthly payout</AppText>.
                </AppText>
              </View>
              <View style={styles.refRuleItem}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <AppText style={styles.refRuleText}>
                  Friend must register and get <AppText style={styles.boldText}>authorized</AppText> by admin.
                </AppText>
              </View>
            </View>

            <View style={styles.refCodeBox}>
              <View>
                <AppText style={styles.refCodeLabel}>YOUR INVITE CODE</AppText>
                <AppText style={styles.refCodeValue}>{referralCode}</AppText>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                activeOpacity={0.7}
                onPress={handleCopyCode}
              >
                <AppText style={styles.copyBtnText}>Copy</AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.badgeCloseBtn}
                activeOpacity={0.7}
                onPress={() => setShowReferralModal(false)}
              >
                <AppText style={styles.badgeCloseBtnText}>Close</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.badgeShareBtn}
                activeOpacity={0.8}
                onPress={handleShareReferral}
              >
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <AppText style={styles.badgeShareBtnText}>Share Link</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Switch Confirmation Alert Modal */}
      <AlertModal
        visible={showSwitchConfirm}
        type="success"
        title="Switch to Customer"
        message="Are you sure you want to switch to Customer mode?"
        onClose={() => setShowSwitchConfirm(false)}
        primaryButton={{
          text: "Continue",
          onPress: async () => {
            setShowSwitchConfirm(false);
            await setAppMode("customer");
            if (session.customerToken) {
              router.replace("/customer/(tabs)");
            } else {
              router.replace("/auth/customer/sign-in");
            }
          },
        }}
        secondaryButton={{
          text: "Cancel",
          onPress: () => setShowSwitchConfirm(false),
        }}
      />

      <LanguageSwitcherModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  navBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  idCardPillBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 40,
    gap: 14,
  },

  /* Centered Profile Section */
  profileSection: {
    alignItems: "center",
    paddingTop: 2,
    paddingBottom: 2,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
    position: "relative",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  verifiedShieldBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: -0.3,
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  profileHandle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  profileDotDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  profileRatingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  profileRatingText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
  },

  /* Option 3: Frosted Minimal Segmented Switcher */
  frostedSegmentContainer: {
    flexDirection: "row",
    backgroundColor: "#EDF2F7",
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  segmentItemInactive: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  segmentTextInactive: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#64748B",
  },
  segmentItemActive: {
    flex: 1.15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentTextActive: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#059669", // Emerald Green
  },
  activeBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },

  /* Referral Banner (Emerald Theme) */
  referralCard: {
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  referralTextBox: {
    flex: 1,
    paddingRight: 8,
  },
  referralTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  referralSubtitle: {
    fontSize: 10.5,
    color: "#D1FAE5",
    lineHeight: 14.5,
  },
  referralGraphicBox: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Grouped Options */
  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: -0.2,
    flex: 1,
  },
  dynamicCodeChip: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  dynamicCodeChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.3,
  },
  signoutLabel: {
    color: "#DC2626",
    fontWeight: "700",
  },

  versionText: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 6,
  },

  /* Employee Card Badge Modal */
  badgeModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  lanyardTopContainer: {
    alignItems: "center",
    marginBottom: -6,
    zIndex: 15,
  },
  lanyardStrap: {
    width: 28,
    height: 38,
    backgroundColor: "#059669",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: "#047857",
  },
  lanyardClip: {
    width: 44,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  employeeBadgeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 326,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    position: "relative",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  lanyardPunchHole: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    width: 46,
    height: 10,
    backgroundColor: "#06100E",
    borderRadius: 5,
    zIndex: 10,
  },
  badgeHeaderLinear: {
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
  },
  badgeCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeCompanyText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  badgeSubText: {
    fontSize: 9.5,
    color: "#D1FAE5",
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  badgeBodySection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    marginTop: -14,
  },
  badgePhotoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 6,
    backgroundColor: "#E2E8F0",
  },
  badgeWorkerName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  badgeWorkerTrade: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#059669",
    marginTop: 2,
  },
  badgeCodeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    marginTop: 8,
    marginBottom: 12,
  },
  badgeCodeLabel: {
    fontSize: 9,
    color: "#64748B",
    fontWeight: "700",
  },
  badgeCodeValue: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  badgeMetricsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 8,
    width: "100%",
    marginBottom: 12,
  },
  badgeMetricCol: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },
  metricValRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeMetricNum: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  badgeMetricSub: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    marginTop: 1,
  },
  badgeQrContainer: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    alignItems: "center",
    marginBottom: 10,
  },
  badgeQrNote: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#475569",
    marginTop: 5,
    letterSpacing: 0.5,
  },
  badgeFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    width: "100%",
  },
  badgeFooterText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  badgeFooterBold: {
    color: "#059669",
    fontWeight: "800",
  },
  badgeActionRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
    width: "100%",
  },
  badgeCloseBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCloseBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  badgeShareBtn: {
    flex: 1.4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeShareBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Referral Modal */
  refModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 326,
    alignItems: "center",
  },
  refGiftBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  refModalTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 3,
  },
  refModalDesc: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 12,
  },
  refRuleBox: {
    width: "100%",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  refRuleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  refRuleText: {
    flex: 1,
    fontSize: 11,
    color: "#065F46",
    lineHeight: 15,
  },
  boldText: {
    fontWeight: "700",
    color: "#065F46",
  },
  refCodeBox: {
    width: "100%",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  refCodeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  refCodeValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  copyBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
});
