import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useForm from "@/hooks/use-form";
import { VENDOR_STAFF_URL } from "@/lib/api-endpoints";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";

export default function AddStaffScreen() {
  const form = useForm<Record<string, any>>({
    name: "",
    phone: "",
    cnic: "",
    experience: "",
    image: null,
    cnic_front: null,
    cnic_back: null,
  });

  const pickImage = async (key: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: key === "image" ? [1, 1] : [16, 10],
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      form.setData(key as any, {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `${key}_${Date.now()}.jpg`,
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.data.name.trim()) {
      Toast.show({ type: "error", text1: "Name is required" });
      return;
    }
    if (
      !form.data.phone.trim() ||
      form.data.phone.replace(/\D/g, "").length < 10
    ) {
      Toast.show({ type: "error", text1: "Enter a valid phone number" });
      return;
    }

    await form.post(VENDOR_STAFF_URL, {
      onSuccess: (res: any) => {
        const defaultPwd = res?.default_password || "";
        Toast.show({
          type: "success",
          text1: "Staff Added Successfully!",
          text2: defaultPwd
            ? `Default password: ${defaultPwd}`
            : "Staff member is ready to login.",
          visibilityTime: 6000,
        });
        router.back();
      },
      onError: (err) => {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: err.message || "Failed to add staff member",
        });
      },
    });
  };

  const defaultPassword = form.data.phone
    ? form.data.phone.replace(/\D/g, "").slice(-6)
    : "------";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Staff</Text>
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
          {/* Profile Image */}
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={() => pickImage("image")}
            activeOpacity={0.7}
          >
            {form.data.image ? (
              <Image
                source={{ uri: form.data.image.uri }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons
                  name="camera"
                  size={28}
                  color={Colors.themes.provider.primary}
                />
              </View>
            )}
            <View style={styles.profileImageBadge}>
              <Ionicons name="add" size={14} color={Colors.neutral.white} />
            </View>
            <Text style={styles.profileImageLabel}>Profile Photo</Text>
          </TouchableOpacity>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputBox, form.errors.name && styles.inputError]}>
                <Ionicons name="person-outline" size={18} color={Colors.text.tertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor={Colors.text.tertiary}
                  value={form.data.name}
                  onChangeText={(text) => form.setData("name", text)}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputBox, form.errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={18} color={Colors.text.tertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="03xx xxxxxxx"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="phone-pad"
                  value={form.data.phone}
                  onChangeText={(text) => form.setData("phone", text)}
                />
              </View>
            </View>

            {/* CNIC */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>CNIC Number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="card-outline" size={18} color={Colors.text.tertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="xxxxx-xxxxxxx-x"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="number-pad"
                  value={form.data.cnic}
                  onChangeText={(text) => form.setData("cnic", text)}
                />
              </View>
            </View>

            {/* Experience */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Experience</Text>
              <View style={styles.inputBox}>
                <Ionicons name="briefcase-outline" size={18} color={Colors.text.tertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3 years AC repair"
                  placeholderTextColor={Colors.text.tertiary}
                  value={form.data.experience}
                  onChangeText={(text) => form.setData("experience", text)}
                />
              </View>
            </View>
          </View>

          {/* CNIC Images */}
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>CNIC Images</Text>
            <View style={styles.cnicRow}>
              {/* Front */}
              <TouchableOpacity
                style={styles.cnicPicker}
                onPress={() => pickImage("cnic_front")}
                activeOpacity={0.7}
              >
                {form.data.cnic_front ? (
                  <Image
                    source={{ uri: form.data.cnic_front.uri }}
                    style={styles.cnicImage}
                  />
                ) : (
                  <View style={styles.cnicPlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={Colors.text.tertiary}
                    />
                    <Text style={styles.cnicPickerText}>Front</Text>
                  </View>
                )}
                {form.data.cnic_front && (
                  <View style={styles.cnicCheckmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.success}
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* Back */}
              <TouchableOpacity
                style={styles.cnicPicker}
                onPress={() => pickImage("cnic_back")}
                activeOpacity={0.7}
              >
                {form.data.cnic_back ? (
                  <Image
                    source={{ uri: form.data.cnic_back.uri }}
                    style={styles.cnicImage}
                  />
                ) : (
                  <View style={styles.cnicPlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={Colors.text.tertiary}
                    />
                    <Text style={styles.cnicPickerText}>Back</Text>
                  </View>
                )}
                {form.data.cnic_back && (
                  <View style={styles.cnicCheckmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={Colors.success}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto credential info */}
          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <Ionicons name="key" size={18} color={Colors.themes.provider.primary} />
              <Text style={styles.credentialTitle}>Login Credentials</Text>
            </View>
            <View style={styles.credentialRow}>
              <Text style={styles.credentialLabel}>Username:</Text>
              <Text style={styles.credentialValue}>
                {form.data.phone || "Phone number"}
              </Text>
            </View>
            <View style={styles.credentialRow}>
              <Text style={styles.credentialLabel}>Password:</Text>
              <Text style={styles.credentialValueBold}>{defaultPassword}</Text>
            </View>
            <Text style={styles.credentialNote}>
              Staff will use these credentials to login from the app.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, form.processing && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={form.processing}
            activeOpacity={0.8}
          >
            {form.processing ? (
              <ActivityIndicator color={Colors.neutral.white} />
            ) : (
              <View style={styles.submitRow}>
                <Ionicons name="person-add" size={20} color={Colors.neutral.white} />
                <Text style={styles.submitBtnText}>Add Staff Member</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },

  // Profile photo
  profileImageContainer: { alignItems: "center", marginBottom: Spacing.lg },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.neutral.gray[100],
  },
  profileImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.themes.provider.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.themes.provider.primary + "30",
    borderStyle: "dashed",
  },
  profileImageBadge: {
    position: "absolute",
    bottom: 22,
    right: "35%",
    backgroundColor: Colors.themes.provider.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  profileImageLabel: {
    marginTop: 8,
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },

  // Form
  formCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  formGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  required: { color: Colors.error },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    gap: 8,
    height: 48,
  },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    height: "100%",
  },

  // CNIC images
  cnicRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cnicPicker: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: "dashed",
    backgroundColor: Colors.neutral.gray[50],
  },
  cnicPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cnicPickerText: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontWeight: Typography.weights.medium,
  },
  cnicImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cnicCheckmark: {
    position: "absolute",
    top: 4,
    right: 4,
  },

  // Credentials
  credentialCard: {
    backgroundColor: Colors.themes.provider.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.themes.provider.accent + "30",
  },
  credentialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  credentialTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.themes.provider.primary,
  },
  credentialRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  credentialLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    width: 80,
  },
  credentialValue: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
    fontWeight: Typography.weights.medium,
  },
  credentialValueBold: {
    fontSize: Typography.sizes.sm,
    color: Colors.themes.provider.primary,
    fontWeight: Typography.weights.bold,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 2,
  },
  credentialNote: {
    fontSize: 10,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
    lineHeight: 16,
  },

  // Submit
  submitBtn: {
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitBtnText: {
    color: Colors.neutral.white,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
  },
});
