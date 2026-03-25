import AlertModal from "@/components/common/AlertModal";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { APP_URL } from "@/lib/api-endpoints";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { compressAndSquare } from "@/lib/image";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProfileForm {
  name: string;
  email: string;
  avatar?: File | null;
}

export default function EditProfilePage() {
  const { session, refetchUser } = useSession();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  const { data, setData, errors, processing, post } = useForm<ProfileForm>({
    name: session.user?.name || "",
    email: session.user?.email || "",
    avatar: null,
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      setAlertModal({
        visible: true,
        type: "error",
        title: "Permission Denied",
        message:
          "Sorry, we need camera roll permissions to change your profile picture.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let uri = asset.uri;

      // Professional Compression & Squaring for Profile
      uri = await compressAndSquare(uri, 800, 0.85);

      setSelectedImageUri(uri);

      const filename = uri.split("/").pop() || "avatar.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      const file = {
        uri,
        name: filename,
        type,
      } as any;

      setData("avatar", file);
    }
  };

  const handleSubmit = () => {
    post(`${APP_URL}/auth/update`, {
      onSuccess: async (response) => {
        await refetchUser();

        setAlertModal({
          visible: true,
          type: "success",
          title: "Success",
          message: response.message || "Profile updated successfully!",
        });
        setSelectedImageUri(null);
      },
      onError: (error) => {
        setAlertModal({
          visible: true,
          type: "error",
          title: "Error",
          message: error.message,
        });
      },
    });
  };

  const displayImage = selectedImageUri || session.user?.avatar_url;
  const userInitials =
    data.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  return (
    <View style={styles.container}>
      {/* Blue Header Section with Avatar */}
      <View style={styles.headerSection}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Top Row */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={Colors.neutral.white}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Centered Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Ionicons
                  name="camera"
                  size={14}
                  color={Colors.neutral.white}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{data.name || "User"}</Text>
            <Text style={styles.profileEmail}>
              {session.user?.email || session.user?.phone}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* White Content Area */}
      <View style={styles.contentSection}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={data.name}
              onChangeText={(text) => setData("name", text)}
              error={errors.name}
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.text.tertiary}
                />
              }
            />

            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={data.email}
              onChangeText={(text) => setData("email", text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={Colors.text.tertiary}
                />
              }
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, processing && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={processing}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {processing ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => {
          setAlertModal({ ...alertModal, visible: false });
          if (alertModal.type === "success") {
            router.back();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
  },
  headerSection: {
    backgroundColor: Colors.themes.customer.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: Spacing.lg,
  },
  safeArea: {
    paddingHorizontal: Spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  placeholder: {
    width: 36,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.themes.customer.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral.white,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  contentSection: {
    flex: 1,
    marginTop: -10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  formCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  saveButton: {
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.neutral.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
