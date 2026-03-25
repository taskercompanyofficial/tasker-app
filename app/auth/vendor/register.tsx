import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import { VENDOR_OTP_URL, VENDOR_OTP_VERIFY_URL, GET_CATEGORIES_URL } from "@/lib/api-endpoints";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from "react";
import { compressImage } from "@/lib/image";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import axios from "axios";

type Step = "basic" | "profile" | "otp" | "success";
export default function VendorRegister() {
  const router = useRouter();
  const { signIn, setAppMode } = useSession();
  const { data, setData, processing, errors, post } = useForm({
    name: "",
    phone: "",
    password: "",
    password_confirmation: "",
    cnic: "",
    dob: new Date().toISOString().split('T')[0],
    experience: "",
    handled_categories: [] as string[],
    profile_image_file: null as any,
    cnic_front_file: null as any,
    cnic_back_file: null as any,
    source: "vendor-app",
    otp: "",
    intent: "register",
  });
  const [step, setStep] = React.useState<Step>("basic");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    void setAppMode("vendor");
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await axios.get(GET_CATEGORIES_URL);
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoadingCats(false);
    }
  };

  const pickImage = async (field: 'profile_image_file' | 'cnic_front_file' | 'cnic_back_file') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission to access gallery is required' });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: field === 'profile_image_file' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      let uri = asset.uri;

      // Professional Compression (WhatsApp Style)
      uri = await compressImage(uri, 1600, 0.8);

      setData(field, {
        uri: uri,
        name: uri.split('/').pop() || 'upload.jpg',
        type: 'image/jpeg',
      } as any);
    }
  };

  const handleGoToProfile = () => {
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
    setStep("profile");
  };

  const handleSendOtp = () => {
    // Validate Profile Step
    if (!data.cnic || data.cnic.length < 5) {
      Toast.show({ type: "error", text1: "Enter a valid CNIC" });
      return;
    }
    if (!data.experience) {
      Toast.show({ type: "error", text1: "Please mention your experience" });
      return;
    }
    if (data.handled_categories.length === 0) {
      Toast.show({ type: "error", text1: "Select at least one product category" });
      return;
    }
    if (!data.cnic_front_file || !data.cnic_back_file) {
      Toast.show({ type: "error", text1: "CNIC images are required" });
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
          text1: response?.message || "Registration successful",
        });
        signIn(response.token, "vendor");
        void setAppMode("vendor");
        router.replace("/vendor/(tabs)/dashboard");
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error?.message || "Verification failed",
        });
      },
    });
  };

  const toggleCategory = (catName: string) => {
    const current = [...data.handled_categories];
    const index = current.indexOf(catName);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(catName);
    }
    setData("handled_categories", current);
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
              <Text style={styles.title}>
                {step === "basic" && "Create Account"}
                {step === "profile" && "Professional Details"}
                {step === "otp" && "Verify Phone"}
              </Text>
              <Text style={styles.subtitle}>
                {step === "basic" && "Join our platform today and start growing your business with us"}
                {step === "profile" && "Please provide your professional documents for verification"}
                {step === "otp" && `We've sent a 6-digit code to ${data.phone}`}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {step === "basic" && (
                <>
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={data.name}
                    onChangeText={(text) => setData({ ...data, name: text })}
                    error={errors.name}
                    theme="vendor"
                    leftIcon={<Ionicons name="person-outline" size={18} color={Colors.themes.provider.primary} />}
                  />

                  <Input
                    label="Phone Number"
                    placeholder="03XXXXXXXXX"
                    value={data.phone}
                    onChangeText={(text) => setData({ ...data, phone: text })}
                    keyboardType="phone-pad"
                    error={errors.phone}
                    theme="vendor"
                    leftIcon={<Ionicons name="call-outline" size={18} color={Colors.themes.provider.primary} />}
                  />

                  <Input
                    label="Password"
                    placeholder="Create a password"
                    value={data.password}
                    onChangeText={(text) => setData({ ...data, password: text })}
                    secureTextEntry
                    error={errors.password}
                    theme="vendor"
                    leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.themes.provider.primary} />}
                  />

                  <Input
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={data.password_confirmation}
                    onChangeText={(text) => setData({ ...data, password_confirmation: text })}
                    secureTextEntry
                    error={errors.password_confirmation}
                    theme="vendor"
                    leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.themes.provider.primary} />}
                  />

                  <Button
                    title="Continue"
                    onPress={handleGoToProfile}
                    fullWidth
                    theme="vendor"
                  />
                </>
              )}

              {step === "profile" && (
                <>
                  <View style={styles.profileImageContainer}>
                    <TouchableOpacity onPress={() => pickImage('profile_image_file')} style={styles.imagePickerCircle}>
                      {data.profile_image_file ? (
                        <Image source={{ uri: data.profile_image_file.uri }} style={styles.pickedProfileImage} />
                      ) : (
                        <View style={styles.profilePlaceholder}>
                          <Ionicons name="camera" size={30} color={Colors.neutral.gray[400]} />
                          <Text style={styles.profilePlaceholderText}>Profile Photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Input
                    label="CNIC Number"
                    placeholder="XXXXX-XXXXXXX-X"
                    value={data.cnic}
                    onChangeText={(text) => setData({ ...data, cnic: text })}
                    error={errors.cnic}
                    theme="vendor"
                    leftIcon={<Ionicons name="card-outline" size={18} color={Colors.themes.provider.primary} />}
                  />

                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <Input
                      label="Date of Birth"
                      value={data.dob}
                      editable={false}
                      theme="vendor"
                      leftIcon={<Ionicons name="calendar-outline" size={18} color={Colors.themes.provider.primary} />}
                    />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(data.dob)}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setData("dob", selectedDate.toISOString().split('T')[0]);
                        }
                      }}
                    />
                  )}

                  <Input
                    label="Years of Experience"
                    placeholder="e.g. 5 years in AC Repair"
                    value={data.experience}
                    onChangeText={(text) => setData({ ...data, experience: text })}
                    error={errors.experience}
                    theme="vendor"
                    leftIcon={<Ionicons name="briefcase-outline" size={18} color={Colors.themes.provider.primary} />}
                  />

                  <Text style={styles.sectionLabel}>Products You Handle</Text>
                  {loadingCats ? (
                    <ActivityIndicator color={Colors.themes.provider.primary} />
                  ) : (
                    <View style={styles.categoriesList}>
                      {categories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryChip,
                            data.handled_categories.includes(cat.name) && styles.categoryChipSelected
                          ]}
                          onPress={() => toggleCategory(cat.name)}
                        >
                          <Text style={[
                            styles.categoryChipText,
                            data.handled_categories.includes(cat.name) && styles.categoryChipTextSelected
                          ]}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.documentRow}>
                    <TouchableOpacity onPress={() => pickImage('cnic_front_file')} style={styles.docPicker}>
                      {data.cnic_front_file ? (
                        <Image source={{ uri: data.cnic_front_file.uri }} style={styles.pickedDoc} />
                      ) : (
                        <View style={styles.docPlaceholder}>
                          <Ionicons name="image-outline" size={24} color={Colors.neutral.gray[400]} />
                          <Text style={styles.docPlaceholderText}>CNIC Front</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => pickImage('cnic_back_file')} style={styles.docPicker}>
                      {data.cnic_back_file ? (
                        <Image source={{ uri: data.cnic_back_file.uri }} style={styles.pickedDoc} />
                      ) : (
                        <View style={styles.docPlaceholder}>
                          <Ionicons name="image-outline" size={24} color={Colors.neutral.gray[400]} />
                          <Text style={styles.docPlaceholderText}>CNIC Back</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Button
                    title={processing ? "Sending OTP..." : "Continue to Verification"}
                    onPress={handleSendOtp}
                    fullWidth
                    loading={processing}
                    theme="vendor"
                  />
                </>
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
                    style={{ alignSelf: "center" }}
                  >
                    <Text
                      style={{
                        color: Colors.themes.provider.primary,
                        fontSize: 12,
                        fontWeight: "500",
                      }}
                    >
                      Resend OTP
                    </Text>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
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
    gap: Spacing.sm,
    width: "100%",
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  imagePickerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral.gray[100],
    borderWidth: 1,
    borderColor: Colors.neutral.gray[200],
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickedProfileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 10,
    color: Colors.neutral.gray[500],
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.gray[300],
    backgroundColor: Colors.neutral.white,
  },
  categoryChipSelected: {
    borderColor: Colors.themes.provider.primary,
    backgroundColor: Colors.themes.provider.primary + '10',
  },
  categoryChipText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: Colors.themes.provider.primary,
    fontWeight: '600',
  },
  documentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  docPicker: {
    flex: 1,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.neutral.gray[300],
    backgroundColor: Colors.neutral.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pickedDoc: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  docPlaceholder: {
    alignItems: 'center',
  },
  docPlaceholderText: {
    fontSize: 11,
    color: Colors.neutral.gray[500],
    marginTop: 4,
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
