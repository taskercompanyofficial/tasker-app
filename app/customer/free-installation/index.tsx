import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import AlertModal from "@/components/common/AlertModal";
import AddressSelector from "@/components/AddressSelector";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import useForm from "@/hooks/use-form";
import {
  FREE_INSTALLATION_URL,
  GET_AUTHORIZED_BRANDS_URL,
} from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const CAROUSEL_IMAGES = [
  {
    uri: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
  }, // Factory
  {
    uri: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  }, // Office
  {
    uri: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
  }, // Warehouse
];

const PRODUCT_TYPES = [
  { value: "washing_machine", label: "Washing Machine", icon: "water" },
  { value: "air_conditioner", label: "Air Conditioner", icon: "snow" },
];

interface FreeInstallationForm {
  contact_person: string;
  phone: string;
  product_type: string;
  brand_id: string;
  product_model: string;
  purchase_date: string;
  invoice_image: File | null;
  warranty_image: File | null;
  is_delivered: number;
  is_wiring_done: number;
  outdoor_bracket_needed: number;
  extra_pipes: number;
  extra_holes: number;
  city: string;
  address_id: string;
}

interface Brand {
  id: number;
  name: string;
  has_free_installation_service: boolean;
}

export default function FreeInstallationPage() {
  const { session } = useSession();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [invoiceUri, setInvoiceUri] = useState<string | null>(null);
  const [warrantyUri, setWarrantyUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<"invoice" | "warranty">(
    "invoice",
  );
  const [permission, requestPermission] = useCameraPermissions();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const cameraRef = useRef<any>(null);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  const { data, setData, errors, processing, post } =
    useForm<FreeInstallationForm>({
      contact_person: session.user?.name || "",
      phone: session.user?.phone || "",
      product_type: "",
      brand_id: "",
      product_model: "",
      purchase_date: "",
      invoice_image: null,
      warranty_image: null,
      is_delivered: 0,
      is_wiring_done: 0,
      outdoor_bracket_needed: 0,
      extra_pipes: 0,
      extra_holes: 0,
      city: "",
      address_id: "",
    });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await myAxios.get(GET_AUTHORIZED_BRANDS_URL);
      const allBrands = response.data.data || [];
      const freeBrands = allBrands.filter(
        (brand: Brand) => brand.has_free_installation_service,
      );
      setBrands(freeBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const pickImage = async (type: "invoice" | "warranty") => {
    if (Platform.OS !== "android") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setAlertModal({
          visible: true,
          type: "error",
          title: "Permission Denied",
          message: "Camera roll permissions are required.",
        });
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const filename = uri.split("/").pop() || `${type}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : "image/jpeg";

      const file = {
        uri,
        name: filename,
        type: fileType,
      } as any;

      if (type === "invoice") {
        setInvoiceUri(uri);
        setData("invoice_image", file);
      } else {
        setWarrantyUri(uri);
        setData("warranty_image", file);
      }
    }
  };

  const openCamera = async (type: "invoice" | "warranty") => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setAlertModal({
          visible: true,
          type: "error",
          title: "Permission Denied",
          message: "Camera permissions are required.",
        });
        return;
      }
    }
    setCameraType(type);
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      const uri = photo.uri;
      const filename = `${cameraType}_${Date.now()}.jpg`;

      const file = {
        uri,
        name: filename,
        type: "image/jpeg",
      } as any;

      if (cameraType === "invoice") {
        setInvoiceUri(uri);
        setData("invoice_image", file);
      } else {
        setWarrantyUri(uri);
        setData("warranty_image", file);
      }
      setShowCamera(false);
    }
  };

  const handleCarouselScroll = (event: any) => {
    const slideSize = width - Spacing.md * 2;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentImageIndex(index);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setPurchaseDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setData("purchase_date", formattedDate);
    }
  };

  const handleSubmit = () => {
    post(FREE_INSTALLATION_URL, {
      onSuccess: (response) => {
        setAlertModal({
          visible: true,
          type: "success",
          title: "Success",
          message: response.message || "Application submitted successfully!",
        });
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <DirectionalIcon name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Free Installation</AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={processing}
            onRefresh={() => {
              fetchBrands();
            }}
          />
        }
      >
        {/* Hero Carousel */}
        <View style={styles.heroSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
            style={styles.carousel}
          >
            {CAROUSEL_IMAGES.map((image, index) => (
              <View
                key={index}
                style={[
                  styles.carouselSlide,
                  { width: width - Spacing.md * 2 },
                ]}
              >
                <Image
                  source={image}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.carouselGradient}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.paginationDots}>
            {CAROUSEL_IMAGES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentImageIndex === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color="#10B981" />
          <AppText style={styles.infoBannerText}>
            First installation only • Available in 4 major cities
          </AppText>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <AppText style={styles.sectionTitle}>Contact Information</AppText>

          <Input
            label="Contact Person"
            placeholder="Enter your name"
            value={data.contact_person}
            onChangeText={(text) => setData("contact_person", text)}
            error={errors.contact_person}
            leftIcon={
              <Ionicons
                name="person-outline"
                size={18}
                color={Colors.text.tertiary}
              />
            }
          />

          <Input
            label="Phone Number"
            placeholder="Enter phone number"
            value={data.phone}
            onChangeText={(text) => setData("phone", text)}
            error={errors.phone}
            keyboardType="phone-pad"
            leftIcon={
              <Ionicons
                name="call-outline"
                size={18}
                color={Colors.text.tertiary}
              />
            }
          />
        </View>

        {/* Address Selection */}
        <View style={styles.formSection}>
          <AppText style={styles.sectionTitle}>Installation Address</AppText>
          <AddressSelector
            selectedAddressId={selectedAddress}
            onSelectAddress={(addressId, address) => {
              setSelectedAddress(addressId);
              setData("address_id", addressId.toString());
              setData("city", address.city);
            }}
            error={errors.address_id}
          />
        </View>

        {/* Product Information */}
        <View style={styles.formSection}>
          <AppText style={styles.sectionTitle}>Product Information</AppText>

          {/* Product Type */}
          <View style={styles.inputGroup}>
            <View style={styles.productTypeGrid}>
              {PRODUCT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.productTypeCard,
                    data.product_type === type.value &&
                    styles.productTypeCardActive,
                  ]}
                  onPress={() => setData("product_type", type.value)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={28}
                    color={
                      data.product_type === type.value
                        ? Colors.themes.customer.primary
                        : Colors.text.tertiary
                    }
                  />
                  <AppText
                    style={[
                      styles.productTypeText,
                      data.product_type === type.value &&
                      styles.productTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
            {errors.product_type && (
              <AppText style={styles.error}>{errors.product_type}</AppText>
            )}
          </View>

          {/* Brand Selection */}
          <Select
            label="Brand"
            placeholder="Select brand"
            value={data.brand_id}
            options={brands.map((brand) => ({
              label: brand.name,
              value: brand.id.toString(),
            }))}
            onSelect={(value) => setData("brand_id", value)}
            error={errors.brand_id}
            leftIcon={
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={Colors.text.tertiary}
              />
            }
          />

          <Input
            label="Product Model"
            placeholder="e.g., ABC-123"
            value={data.product_model}
            onChangeText={(text) => setData("product_model", text)}
            error={errors.product_model}
            leftIcon={
              <Ionicons
                name="cube-outline"
                size={18}
                color={Colors.text.tertiary}
              />
            }
          />

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Date of Purchase</AppText>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.text.tertiary}
              />
              <AppText style={styles.dateText}>
                {data.purchase_date || "Select purchase date"}
              </AppText>
            </TouchableOpacity>
            {errors.purchase_date && (
              <AppText style={styles.error}>{errors.purchase_date}</AppText>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={purchaseDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Document Uploads */}
        <View style={styles.formSection}>
          <AppText style={styles.sectionTitle}>Documents</AppText>

          {/* Invoice Upload */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Invoice Image</AppText>
            {invoiceUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: invoiceUri }}
                  style={styles.uploadedImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setInvoiceUri(null);
                    setData("invoice_image", null);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={styles.uploadOptionButton}
                  onPress={() => openCamera("invoice")}
                >
                  <Ionicons
                    name="camera"
                    size={22}
                    color={Colors.themes.customer.primary}
                  />
                  <AppText style={styles.uploadOptionText}>Camera</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadOptionButton}
                  onPress={() => pickImage("invoice")}
                >
                  <Ionicons
                    name="images"
                    size={22}
                    color={Colors.themes.customer.primary}
                  />
                  <AppText style={styles.uploadOptionText}>Gallery</AppText>
                </TouchableOpacity>
              </View>
            )}
            {errors.invoice_image && (
              <AppText style={styles.error}>{errors.invoice_image}</AppText>
            )}
          </View>

          {/* Warranty Upload */}
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Warranty Card Image</AppText>
            {warrantyUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: warrantyUri }}
                  style={styles.uploadedImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setWarrantyUri(null);
                    setData("warranty_image", null);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  style={styles.uploadOptionButton}
                  onPress={() => openCamera("warranty")}
                >
                  <Ionicons
                    name="camera"
                    size={22}
                    color={Colors.themes.customer.primary}
                  />
                  <AppText style={styles.uploadOptionText}>Camera</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadOptionButton}
                  onPress={() => pickImage("warranty")}
                >
                  <Ionicons
                    name="images"
                    size={22}
                    color={Colors.themes.customer.primary}
                  />
                  <AppText style={styles.uploadOptionText}>Gallery</AppText>
                </TouchableOpacity>
              </View>
            )}
            {errors.warranty_image && (
              <AppText style={styles.error}>{errors.warranty_image}</AppText>
            )}
          </View>
        </View>

        {/* Installation Status */}
        <View style={styles.formSection}>
          <AppText style={styles.sectionTitle}>Installation Status</AppText>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setData("is_delivered", data.is_delivered ? 0 : 1)}
          >
            <View
              style={[
                styles.checkbox,
                data.is_delivered === 1 && styles.checkboxActive,
              ]}
            >
              {data.is_delivered === 1 && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={Colors.neutral.white}
                />
              )}
            </View>
            <AppText style={styles.checkboxLabel}>Product is delivered</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              setData("is_wiring_done", data.is_wiring_done ? 0 : 1)
            }
          >
            <View
              style={[
                styles.checkbox,
                data.is_wiring_done === 1 && styles.checkboxActive,
              ]}
            >
              {data.is_wiring_done === 1 && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={Colors.neutral.white}
                />
              )}
            </View>
            <AppText style={styles.checkboxLabel}>Wiring is done</AppText>
          </TouchableOpacity>
        </View>

        {/* Additional Requirements */}
        <View style={styles.formSection}>
          <AppText style={styles.sectionTitle}>Additional Requirements</AppText>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              setData(
                "outdoor_bracket_needed",
                data.outdoor_bracket_needed ? 0 : 1,
              )
            }
          >
            <View
              style={[
                styles.checkbox,
                data.outdoor_bracket_needed === 1 && styles.checkboxActive,
              ]}
            >
              {data.outdoor_bracket_needed === 1 && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={Colors.neutral.white}
                />
              )}
            </View>
            <AppText style={styles.checkboxLabel}>Outdoor bracket needed</AppText>
          </TouchableOpacity>

          <Input
            label="Extra Pipes Needed"
            placeholder="0"
            value={data.extra_pipes.toString()}
            onChangeText={(text) => setData("extra_pipes", parseInt(text) || 0)}
            keyboardType="number-pad"
            leftIcon={
              <Ionicons
                name="git-branch-outline"
                size={20}
                color={Colors.text.tertiary}
              />
            }
          />

          <Input
            label="Extra Wall Holes Needed"
            placeholder="0"
            value={data.extra_holes.toString()}
            onChangeText={(text) => setData("extra_holes", parseInt(text) || 0)}
            keyboardType="number-pad"
            leftIcon={
              <Ionicons
                name="ellipse-outline"
                size={20}
                color={Colors.text.tertiary}
              />
            }
          />
        </View>

        {/* What's Included */}
        <View style={styles.inclusionsSection}>
          <AppText style={styles.sectionTitle}>What&apos;s Included (Free)</AppText>
          <View style={styles.inclusionsList}>
            <View style={styles.inclusionItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <AppText style={styles.inclusionText}>One wall hole</AppText>
            </View>
            <View style={styles.inclusionItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <AppText style={styles.inclusionText}>10 feet pipe</AppText>
            </View>
            <View style={styles.inclusionItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <AppText style={styles.inclusionText}>Indoor installation</AppText>
            </View>
            <View style={styles.inclusionItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <AppText style={styles.inclusionText}>Outdoor installation</AppText>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              processing && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={processing}
          >
            <AppText style={styles.submitButtonText}>
              {processing ? "Submitting..." : "Submit Application"}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} ref={cameraRef} facing="back">
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={28} color={Colors.neutral.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              <View style={styles.cameraButton} />
            </View>
          </CameraView>
        </View>
      </Modal>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: Colors.neutral.white,
    marginBottom: Spacing.sm,
  },
  carousel: {
    height: 140,
  },
  carouselSlide: {
    height: 140,
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral.gray[300],
  },
  activeDot: {
    width: 16,
    backgroundColor: Colors.themes.customer.primary,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "#ECFDF5",
    padding: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  formSection: {
    backgroundColor: Colors.neutral.white,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.white,
    gap: Spacing.xs,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  productTypeGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  productTypeCard: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border.light,
    alignItems: "center",
    gap: Spacing.xs,
  },
  productTypeCardActive: {
    borderColor: Colors.themes.customer.primary,
  },
  productTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.secondary,
    textAlign: "center",
  },
  productTypeTextActive: {
    color: Colors.themes.customer.primary,
  },
  uploadOptions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  uploadOptionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderStyle: "dashed",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.neutral.gray[50],
  },
  uploadOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  imagePreviewContainer: {
    position: "relative",
    height: 160,
    borderRadius: 6,
    overflow: "hidden",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.neutral.white,
    borderRadius: 6,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.themes.customer.primary,
    borderColor: Colors.themes.customer.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.primary,
  },
  inclusionsSection: {
    backgroundColor: "#ECFDF5",
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  inclusionsList: {
    gap: Spacing.xs,
  },
  inclusionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  inclusionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#047857",
  },
  buttonSection: {
    padding: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  submitButton: {
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    shadowColor: "transparent",
    elevation: 0,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.themes.customer.primary,
  },
});
