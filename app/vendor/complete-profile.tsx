import Button from "@/components/Button";
import Input from "@/components/Input";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import { Ionicons } from "@expo/vector-icons";
import { GET_CATEGORIES_URL, VENDOR_UPDATE_PROFILE_URL } from "@/lib/api-endpoints";
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

export default function CompleteProfile() {
  const router = useRouter();
  const { session, refetchUser } = useSession();
  const user = session.vendorUser;

  const { data, setData, processing, errors, post } = useForm({
    cnic: user?.cnic || "",
    dob: user?.dob || new Date().toISOString().split('T')[0],
    experience: user?.experience || "",
    handled_categories: (user?.handled_categories as string[]) || [],
    profile_image_file: null as any,
    cnic_front_file: null as any,
    cnic_back_file: null as any,
    _method: 'POST', // Use multipart/form-data with method spoofing if needed, but here we'll just POST to a dedicated endpoint
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
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

  const handleSubmit = () => {
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

    post(VENDOR_UPDATE_PROFILE_URL, {
      onSuccess: async (response) => {
        Toast.show({
          type: "success",
          text1: "Profile submitted for review",
        });
        await refetchUser("vendor");
        router.replace("/vendor/(tabs)/dashboard");
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: error.message || "Failed to update profile",
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

      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
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
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Vendor Profile Details</Text>
              <Text style={styles.subtitle}>
                Provide your professional details and verification documents to start accepting service orders.
              </Text>
            </View>

            {/* Registered Phone Badge Card */}
            {user?.phone ? (
              <View style={styles.phoneBadgeCard}>
                <View style={styles.phoneBadgeLeft}>
                  <View style={styles.phoneIconCircle}>
                    <Ionicons name="call" size={16} color={Colors.themes.provider.primary} />
                  </View>
                  <View>
                    <Text style={styles.phoneBadgeLabel}>Registered Phone</Text>
                    <Text style={styles.phoneBadgeValue}>{user.phone}</Text>
                  </View>
                </View>
                <View style={styles.verifiedChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.verifiedChipText}>Verified</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.formContainer}>
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

              <Text style={styles.sectionLabel}>Products & Services You Handle</Text>
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

              <Text style={styles.sectionLabel}>Verification Documents (CNIC)</Text>
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
                title={processing ? "Submitting..." : "Submit Profile for Review"}
                onPress={handleSubmit}
                fullWidth
                loading={processing}
                theme="vendor"
              />
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
    paddingHorizontal: Spacing.md,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
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
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
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
  phoneBadgeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.themes.provider.primary + "0A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.themes.provider.primary + "25",
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  phoneBadgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  phoneIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.themes.provider.primary + "18",
    justifyContent: "center",
    alignItems: "center",
  },
  phoneBadgeLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  phoneBadgeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: 1,
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B98115",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
});
