import Colors from "@/constants/Colors";
import { BorderRadius, Shadows, Spacing, Typography } from "@/constants/Styles";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React from "react";
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// Conditionally import react-native-maps on native platforms
let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (err) {
    console.warn("[AddressModal] react-native-maps not available:", err);
  }
}

interface AddressNavigationModalProps {
  visible: boolean;
  onClose: () => void;
  customerName?: string;
  customerPhone?: string;
  address: {
    address_line_1: string;
    city: string;
    state: string;
    zip_code?: string;
    latitude?: number | string;
    longitude?: number | string;
    lat?: number | string;
    lng?: number | string;
  };
}

export default function AddressNavigationModal({
  visible,
  onClose,
  customerName,
  customerPhone,
  address,
}: AddressNavigationModalProps) {
  const rawLat = address?.latitude ?? address?.lat;
  const rawLng = address?.longitude ?? address?.lng;

  const lat = typeof rawLat === "number" ? rawLat : parseFloat(String(rawLat || ""));
  const lng = typeof rawLng === "number" ? rawLng : parseFloat(String(rawLng || ""));

  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const fullAddress = `${address?.address_line_1 || ""}, ${address?.city || ""}, ${
    address?.state || ""
  }`.replace(/^,\s*/, "");

  const handleOpenGoogleMaps = () => {
    let url = "";
    if (hasValidCoords) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullAddress,
      )}`;
    }
    Linking.openURL(url).catch(() => {
      Toast.show({ type: "error", text1: "Could not open Google Maps" });
    });
  };

  const handleOpenNativeMaps = () => {
    let url = "";
    if (hasValidCoords) {
      if (Platform.OS === "ios") {
        url = `maps://?daddr=${lat},${lng}`;
      } else {
        url = `geo:${lat},${lng}?q=${lat},${lng}`;
      }
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullAddress,
      )}`;
    }

    Linking.openURL(url).catch(() => {
      handleOpenGoogleMaps();
    });
  };

  const handleCopyCoords = async () => {
    if (hasValidCoords) {
      await Clipboard.setStringAsync(`${lat}, ${lng}`);
      Toast.show({
        type: "success",
        text1: "Coordinates Copied",
        text2: `${lat.toFixed(5)}, ${lng.toFixed(5)} copied to clipboard`,
      });
    } else {
      await Clipboard.setStringAsync(fullAddress);
      Toast.show({
        type: "success",
        text1: "Address Copied",
        text2: "Address text copied to clipboard",
      });
    }
  };

  const handleCallCustomer = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <Ionicons
                  name="navigate"
                  size={20}
                  color={Colors.themes.provider.primary}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Navigation & Location</Text>
                {customerName ? (
                  <Text style={styles.headerSubtitle}>
                    Job Location • {customerName}
                  </Text>
                ) : (
                  <Text style={styles.headerSubtitle}>Destination Details</Text>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Map Preview Section */}
          <View style={styles.mapContainer}>
            {hasValidCoords && MapView ? (
              <MapView
                style={styles.mapView}
                initialRegion={{
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {Marker ? (
                  <Marker
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={customerName || "Customer Destination"}
                    description={fullAddress}
                  />
                ) : null}
              </MapView>
            ) : (
              <View style={styles.mapFallbackContainer}>
                <Ionicons
                  name="location"
                  size={48}
                  color={Colors.themes.provider.primary}
                />
                <Text style={styles.mapFallbackTitle}>Address Location</Text>
                <Text style={styles.mapFallbackSubtitle}>{fullAddress}</Text>
              </View>
            )}

            {hasValidCoords && (
              <View style={styles.coordBadge}>
                <Ionicons name="pin-outline" size={12} color="#10B981" />
                <Text style={styles.coordBadgeText}>
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </Text>
              </View>
            )}
          </View>

          {/* Address Information Card */}
          <View style={styles.addressInfoCard}>
            <View style={styles.addressRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.themes.provider.primary}
                style={{ marginTop: 2 }}
              />
              <Text style={styles.addressText}>{fullAddress}</Text>
            </View>

            {hasValidCoords && (
              <TouchableOpacity
                style={styles.copyCoordsRow}
                onPress={handleCopyCoords}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="copy-outline"
                  size={14}
                  color={Colors.themes.provider.primary}
                />
                <Text style={styles.copyCoordsText}>Copy Coordinates</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Navigation Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Google Maps Navigation */}
            <TouchableOpacity
              style={styles.primaryNavBtn}
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.85}
            >
              <Ionicons name="map" size={18} color={Colors.neutral.white} />
              <Text style={styles.primaryNavBtnText}>
                Navigate in Google Maps
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={Colors.neutral.white}
              />
            </TouchableOpacity>

            <View style={styles.secondaryActionsRow}>
              {/* Native Maps / Waze Button */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleOpenNativeMaps}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="compass-outline"
                  size={18}
                  color={Colors.text.primary}
                />
                <Text style={styles.secondaryBtnText}>
                  {Platform.OS === "ios" ? "Apple Maps" : "Native Maps"}
                </Text>
              </TouchableOpacity>

              {/* Call Customer Button */}
              {customerPhone ? (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleCallCustomer}
                  activeOpacity={0.75}
                >
                  <Ionicons name="call-outline" size={18} color="#10B981" />
                  <Text style={[styles.secondaryBtnText, { color: "#10B981" }]}>
                    Call Customer
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  backdropTouch: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.themes.provider.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    height: 180,
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.neutral.gray[100],
    borderWidth: 1,
    borderColor: Colors.border.light,
    position: "relative",
  },
  mapView: {
    width: "100%",
    height: "100%",
  },
  mapFallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.themes.provider.primary + "0A",
  },
  mapFallbackTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  mapFallbackSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 2,
  },
  coordBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    ...Shadows.sm,
  },
  coordBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  addressInfoCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    gap: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
  },
  addressText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: "600",
    lineHeight: 20,
    flex: 1,
  },
  copyCoordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  copyCoordsText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.themes.provider.primary,
  },
  actionsContainer: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  primaryNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.themes.provider.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.sm,
  },
  primaryNavBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.neutral.white,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral.gray[100],
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
    color: Colors.text.primary,
  },
});
