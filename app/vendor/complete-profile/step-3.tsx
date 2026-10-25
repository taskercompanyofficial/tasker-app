import AppText from "@/components/common/AppText";
import AppTextInput from "@/components/common/AppTextInput";
import Colors from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useLanguage } from "@/context/language-context";
import {
  GET_CATEGORIES_URL,
  VENDOR_UPDATE_PROFILE_URL,
  WEBSITE_BRANCHES_URL,
} from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { localizedToast } from "@/lib/i18n/localized-toast";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Active Branch Cities Fallback (Tasker operational cities with physical branches)
const DEFAULT_BRANCH_CITIES = ["Lahore", "Islamabad", "Rawalpindi"];

// Default Main Work Skills Categories
const DEFAULT_MAIN_CATEGORIES = [
  { id: "hvac", name: "HVAC & Air Conditioning", icon: "snow-outline" },
  { id: "electrical", name: "Electrician & Wiring", icon: "flash-outline" },
  { id: "plumbing", name: "Plumbing & Sanitary", icon: "water-outline" },
  { id: "appliances", name: "Home Appliances Repair", icon: "hardware-chip-outline" },
  { id: "solar", name: "Solar & Inverter Systems", icon: "sunny-outline" },
  { id: "carpentry", name: "Carpentry & Furniture", icon: "hammer-outline" },
  { id: "painting", name: "Painting & Renovation", icon: "color-palette-outline" },
  { id: "security", name: "CCTV & Security Tech", icon: "videocam-outline" },
];

export default function Step3DetailsReview() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<any>();
  const { session, refetchUser, signOutMode } = useSession();
  const { t, isRTL } = useLanguage();
  const user = session.vendorUser;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOutMode("vendor");
          } catch (_) {}
          router.replace("/vendor/login" as any);
        },
      },
    ]);
  };

  // Prioritize OCR extracted values from params if available, else database user record
  const initialName = searchParams.extractedName || user?.name || user?.first_name || "";
  const initialFatherName = searchParams.extractedFatherName || (user as any)?.father_name || "";
  const initialCnic = searchParams.extractedCnic || user?.cnic || "";
  const initialDob = searchParams.extractedDob || (user?.dob ? String(user.dob).split("T")[0] : "");
  const initialGender = searchParams.extractedGender || (user as any)?.gender || "Male";
  const initialAddress =
    searchParams.extractedAddress ||
    (user as any)?.current_address ||
    (user as any)?.address ||
    "";
  const initialCity = (user as any)?.city || "";
  const initialCategories: string[] = Array.isArray(user?.handled_categories)
    ? user.handled_categories
    : [];

  const [name, setName] = useState(initialName);
  const [fatherName, setFatherName] = useState(initialFatherName);
  const [cnic, setCnic] = useState(initialCnic);
  const [dob, setDob] = useState(initialDob);
  const [gender, setGender] = useState(initialGender);
  const [currentAddress, setCurrentAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [experience, setExperience] = useState((user as any)?.experience || "3 Years");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  // Categories list
  const [categoriesList, setCategoriesList] = useState(DEFAULT_MAIN_CATEGORIES);

  // Active cities with branches list
  const [activeCities, setActiveCities] = useState<string[]>(DEFAULT_BRANCH_CITIES);

  // City Picker Modal State
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  // Services / Specialization Picker Modal State
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [servicesSearchQuery, setServicesSearchQuery] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dynamic categories and active branch cities from backend
  useEffect(() => {
    async function loadData() {
      // 1. Fetch categories
      try {
        const res = await myAxios.get(GET_CATEGORIES_URL);
        const data = res.data?.data?.data || res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((c: any) => ({
            id: String(c.id || c.slug),
            name: c.name,
            icon: "build-outline" as any,
          }));
          setCategoriesList(mapped);
        }
      } catch (_) {}

      // 2. Fetch active branch cities
      try {
        const branchRes = await myAxios.get(WEBSITE_BRANCHES_URL);
        const branches = branchRes.data?.data;
        if (Array.isArray(branches) && branches.length > 0) {
          const citiesSet = new Set<string>();
          branches.forEach((b: any) => {
            if (b.status === "active") {
              if (Array.isArray(b.cities)) {
                b.cities.forEach((c: string) => {
                  if (c && c.trim()) citiesSet.add(c.trim());
                });
              } else if (b.city && typeof b.city === "string") {
                b.city.split(",").forEach((c: string) => {
                  if (c && c.trim()) citiesSet.add(c.trim());
                });
              }
            }
          });
          const fetchedCities = Array.from(citiesSet);
          if (fetchedCities.length > 0) {
            setActiveCities(fetchedCities);
          }
        }
      } catch (_) {}
    }
    loadData();
  }, []);

  // Format CNIC with standard dashes XXXXX-XXXXXXX-X
  const handleCnicChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 13);
    let formatted = cleaned;
    if (cleaned.length > 5 && cleaned.length <= 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length > 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
    setCnic(formatted);
  };

  // Toggle category selection
  const toggleCategory = (catName: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  // Submit and save profile
  const handleSubmit = async () => {
    if (!name || name.trim().length === 0) {
      localizedToast({ type: "error", text1: t.vendorOnboarding.nameRequired });
      return;
    }
    if (!cnic || cnic.length < 15) {
      localizedToast({ type: "error", text1: t.vendorOnboarding.cnicRequired });
      return;
    }
    if (!city) {
      localizedToast({ type: "error", text1: t.vendorOnboarding.cityRequired });
      return;
    }
    if (selectedCategories.length === 0) {
      localizedToast({ type: "error", text1: t.vendorOnboarding.categoriesRequired });
      return;
    }
    if (!currentAddress || currentAddress.trim().length === 0) {
      localizedToast({ type: "error", text1: t.vendorOnboarding.addressRequired });
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const payload = {
        name: name.trim(),
        father_name: fatherName.trim(),
        cnic: cnic.trim(),
        dob: dob || "1995-01-01",
        gender: gender || "Male",
        address: currentAddress.trim(),
        current_address: currentAddress.trim(),
        city: city.trim(),
        handled_categories: selectedCategories,
        experience: experience.trim(),
      };

      const res = await myAxios.post(VENDOR_UPDATE_PROFILE_URL, payload);

      if (res.data?.status === "success") {
        try {
          await refetchUser("vendor");
        } catch (_) {}

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        localizedToast({
          type: "success",
          text1: "Profile Details Saved",
          text2: "Proceeding to selfie verification.",
        });

        router.push("/vendor/complete-profile/step-4" as any);
      } else {
        router.push("/vendor/complete-profile/step-4" as any);
      }
    } catch (err: any) {
      console.warn("[Step3DetailsReview] Update error:", err?.response?.data || err?.message);
      localizedToast({
        type: "error",
        text1: "Submission Failed",
        text2: err?.response?.data?.message || "Please check your inputs and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCities = activeCities.filter((c) =>
    c.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  const filteredCategories = categoriesList.filter((cat) =>
    cat.name.toLowerCase().includes(servicesSearchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Compact Top Navigation Bar */}
      <View style={[styles.header, isRTL && styles.rtlRow]}>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, isRTL && styles.rtlRow]}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={16} color="#DC2626" />
          <AppText style={styles.logoutBtnText}>Logout</AppText>
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>{t.vendorOnboarding.verifyDetailsTitle}</AppText>
        <View style={styles.stepBadge}>
          <AppText style={styles.stepBadgeText}>Step 2 of 5</AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Compact Intro Title */}
          <View style={styles.introBox}>
            <AppText style={styles.heading}>{t.vendorOnboarding.verifyDetailsTitle}</AppText>
            <AppText style={styles.subtitle}>
              Verify your CNIC information and work categories to continue.
            </AppText>
          </View>

          {/* Card 1: Personal & CNIC Identity Details */}
          <View style={styles.card}>
            <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
              <Ionicons name="card-outline" size={16} color="#1E3A8A" />
              <AppText style={styles.cardTitle}>CNIC & Personal Details</AppText>
            </View>

            {/* CNIC Number (Prominent first field) */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>{t.vendorOnboarding.cnicNumber} *</AppText>
              <AppTextInput
                style={[styles.input, isRTL && { textAlign: "right" }]}
                value={cnic}
                onChangeText={handleCnicChange}
                placeholder="35201-1234567-1"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={15}
              />
            </View>

            {/* Full Name & Father Name in compact rows */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>{t.vendorOnboarding.fullName} *</AppText>
              <AppTextInput
                style={[styles.input, isRTL && { textAlign: "right" }]}
                value={name}
                onChangeText={setName}
                placeholder="Full name as on CNIC"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.label}>{t.vendorOnboarding.fatherName}</AppText>
              <AppTextInput
                style={[styles.input, isRTL && { textAlign: "right" }]}
                value={fatherName}
                onChangeText={setFatherName}
                placeholder="Father or husband name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* DOB & Gender (Side-by-side) */}
            <View style={[styles.row, isRTL && styles.rtlRow]}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <AppText style={styles.label}>{t.vendorOnboarding.dob}</AppText>
                <AppTextInput
                  style={[styles.input, isRTL && { textAlign: "right" }]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <AppText style={styles.label}>{t.vendorOnboarding.gender}</AppText>
                <View style={[styles.genderRow, isRTL && styles.rtlRow]}>
                  <TouchableOpacity
                    style={[styles.genderBtn, gender === "Male" && styles.genderBtnActive]}
                    onPress={() => setGender("Male")}
                    activeOpacity={0.8}
                  >
                    <AppText
                      style={[
                        styles.genderBtnText,
                        gender === "Male" && styles.genderBtnTextActive,
                      ]}
                    >
                      {t.vendorOnboarding.male}
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderBtn, gender === "Female" && styles.genderBtnActive]}
                    onPress={() => setGender("Female")}
                    activeOpacity={0.8}
                  >
                    <AppText
                      style={[
                        styles.genderBtnText,
                        gender === "Female" && styles.genderBtnTextActive,
                      ]}
                    >
                      {t.vendorOnboarding.female}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Operational City Selector */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>{t.vendorOnboarding.selectCity} *</AppText>
              <TouchableOpacity
                style={[styles.citySelectorBtn, isRTL && styles.rtlRow]}
                onPress={() => setCityModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={styles.citySelectorLeft}>
                  <Ionicons name="location-outline" size={15} color="#64748B" />
                  <AppText style={[styles.citySelectorText, !city && { color: "#94A3B8" }]}>
                    {city || "Select operational city"}
                  </AppText>
                </View>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Current Address */}
            <View style={[styles.inputGroup, { marginBottom: 2 }]}>
              <AppText style={styles.label}>{t.vendorOnboarding.currentAddress} *</AppText>
              <AppTextInput
                style={[styles.input, styles.textArea, isRTL && { textAlign: "right" }]}
                value={currentAddress}
                onChangeText={setCurrentAddress}
                placeholder="House, street, and area address"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Card 2: Work Categories & Specialist Services */}
          <View style={styles.card}>
            <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
              <Ionicons name="construct-outline" size={16} color="#1E3A8A" />
              <AppText style={styles.cardTitle}>Specialist Services *</AppText>
            </View>

            {/* Specialization Selector */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>What services are you a specialist in? *</AppText>
              <TouchableOpacity
                style={[styles.citySelectorBtn, isRTL && styles.rtlRow]}
                onPress={() => setServicesModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={styles.citySelectorLeft}>
                  <Ionicons name="briefcase-outline" size={15} color="#64748B" />
                  <AppText
                    style={[
                      styles.citySelectorText,
                      selectedCategories.length === 0 && { color: "#94A3B8" },
                    ]}
                  >
                    {selectedCategories.length === 0
                      ? "Select services you specialize in..."
                      : `${selectedCategories.length} ${
                          selectedCategories.length === 1 ? "Service" : "Services"
                        } Selected`}
                  </AppText>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {selectedCategories.length > 0 && (
                    <View style={styles.selectedCountBadge}>
                      <AppText style={styles.selectedCountText}>
                        {selectedCategories.length}
                      </AppText>
                    </View>
                  )}
                  <Ionicons name="chevron-down" size={16} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Selected Specialist Services Display */}
            {selectedCategories.length > 0 && (
              <View style={[styles.selectedServicesContainer, isRTL && styles.rtlRow]}>
                {selectedCategories.map((catName) => (
                  <View key={catName} style={[styles.selectedServiceItem, isRTL && styles.rtlRow]}>
                    <View style={styles.selectedServiceItemLeft}>
                      <Ionicons name="checkmark-circle" size={14} color="#1E3A8A" />
                      <AppText style={styles.selectedServiceItemText}>{catName}</AppText>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleCategory(catName)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={styles.removeServiceIcon}
                    >
                      <Ionicons name="close" size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Experience Field */}
            <View style={[styles.inputGroup, { marginTop: selectedCategories.length > 0 ? 8 : 4, marginBottom: 2 }]}>
              <AppText style={styles.label}>{t.vendorOnboarding.experience}</AppText>
              <AppTextInput
                style={[styles.input, isRTL && { textAlign: "right" }]}
                value={experience}
                onChangeText={setExperience}
                placeholder={t.vendorOnboarding.experiencePlaceholder}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[styles.submitActionBtn, isSubmitting && styles.disabledBtn]}
            disabled={isSubmitting}
            activeOpacity={0.88}
            onPress={handleSubmit}
          >
            <LinearGradient
              colors={["#1E3A8A", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitGradient, isRTL && styles.rtlRow]}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <AppText style={styles.submitBtnText}>Saving Details...</AppText>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
                  <AppText style={styles.submitBtnText}>
                    {t.vendorOnboarding.saveAndContinue}
                  </AppText>
                  <Ionicons
                    name={isRTL ? "arrow-back" : "arrow-forward"}
                    size={16}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Compact City Picker Modal (Active Branch Cities) */}
      <Modal
        visible={cityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, isRTL && styles.rtlRow]}>
              <View>
                <AppText style={styles.modalTitle}>{t.vendorOnboarding.selectCity}</AppText>
                <AppText style={styles.modalSubtitle}>Tasker active branch locations</AppText>
              </View>
              <TouchableOpacity
                onPress={() => setCityModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchBar, isRTL && styles.rtlRow]}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <AppTextInput
                style={[styles.searchInput, isRTL && { textAlign: "right" }]}
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                placeholder={t.vendorOnboarding.citySearchPlaceholder}
                placeholderTextColor="#94A3B8"
              />
              {citySearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCitySearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Cities List */}
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = city === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.cityItem,
                      isSelected && styles.cityItemSelected,
                      isRTL && styles.rtlRow,
                    ]}
                    onPress={() => {
                      setCity(item);
                      setCityModalVisible(false);
                      setCitySearchQuery("");
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch (_) {}
                    }}
                  >
                    <View style={styles.cityItemLeft}>
                      <Ionicons
                        name="location-sharp"
                        size={16}
                        color={isSelected ? "#2563EB" : "#1E3A8A"}
                      />
                      <AppText
                        style={[
                          styles.cityItemText,
                          isSelected && styles.cityItemTextSelected,
                        ]}
                      >
                        {item}
                      </AppText>
                    </View>
                    <View style={styles.branchActiveBadge}>
                      <Ionicons name="business-outline" size={11} color="#059669" />
                      <AppText style={styles.branchActiveBadgeText}>Active Branch</AppText>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#2563EB" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Specialist Services Selection Modal */}
      <Modal
        visible={servicesModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setServicesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, isRTL && styles.rtlRow]}>
              <View>
                <AppText style={styles.modalTitle}>Specialist Services</AppText>
                <AppText style={styles.modalSubtitle}>
                  Choose the services you are trained to deliver
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setServicesModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, isRTL && styles.rtlRow]}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <AppTextInput
                style={[styles.searchInput, isRTL && { textAlign: "right" }]}
                value={servicesSearchQuery}
                onChangeText={setServicesSearchQuery}
                placeholder="Search services..."
                placeholderTextColor="#94A3B8"
              />
              {servicesSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setServicesSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Services List with Checkboxes */}
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id || item.name}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const isSelected = selectedCategories.includes(item.name);
                return (
                  <TouchableOpacity
                    style={[
                      styles.serviceItemRow,
                      isSelected && styles.serviceItemRowSelected,
                      isRTL && styles.rtlRow,
                    ]}
                    onPress={() => toggleCategory(item.name)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceItemRowLeft}>
                      <View
                        style={[
                          styles.checkboxSquare,
                          isSelected && styles.checkboxSquareSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                      <AppText
                        style={[
                          styles.serviceRowName,
                          isSelected && styles.serviceRowNameSelected,
                        ]}
                      >
                        {item.name}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Modal Done Button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setServicesModalVisible(false)}
              activeOpacity={0.85}
            >
              <AppText style={styles.modalDoneBtnText}>
                {selectedCategories.length > 0
                  ? `Done (${selectedCategories.length} Selected)`
                  : "Done"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  header: {
    paddingHorizontal: Spacing.md,
    height: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  stepBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  introBox: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 0,
    shadowOpacity: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  inputGroup: {
    marginBottom: 9,
  },
  label: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 39,
    fontSize: 13,
    color: Colors.text.primary,
  },
  textArea: {
    height: 52,
    paddingTop: 8,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  genderRow: {
    flexDirection: "row",
    gap: 6,
    height: 39,
  },
  genderBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
  },
  genderBtnActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  genderBtnTextActive: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  citySelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 39,
  },
  citySelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  citySelectorText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.text.primary,
  },
  selectedCountBadge: {
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  selectedCountText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  selectedServicesContainer: {
    gap: 6,
    marginTop: 8,
  },
  selectedServiceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedServiceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  selectedServiceItemText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#1E293B",
  },
  removeServiceIcon: {
    padding: 2,
  },
  submitActionBtn: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 4,
    elevation: 1,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.primary,
  },
  cityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
    gap: 8,
  },
  cityItemSelected: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
  },
  cityItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  cityItemText: {
    fontSize: 13.5,
    fontWeight: "400",
    color: Colors.text.primary,
  },
  cityItemTextSelected: {
    fontWeight: "600",
    color: "#2563EB",
  },
  branchActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  branchActiveBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
  },
  serviceItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
    borderRadius: 8,
  },
  serviceItemRowSelected: {
    backgroundColor: "#EFF6FF",
  },
  serviceItemRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSquareSelected: {
    backgroundColor: "#1E3A8A",
    borderColor: "#1E3A8A",
  },
  serviceRowName: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.text.primary,
    flex: 1,
  },
  serviceRowNameSelected: {
    fontWeight: "600",
    color: "#1E3A8A",
  },
  modalDoneBtn: {
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  modalDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "600",
  },
});
