import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AddressNavigationModal from "./AddressNavigationModal";
import { fieldStyles, sectionStyles } from "./styles";

interface CustomerInfoSectionProps {
  customer: {
    name: string;
    whatsapp?: string;
    phone: string;
    email?: string;
    is_care_of_customer?: number;
    status?: string;
  };
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
  extraNumber?: string;
}

export default function CustomerInfoSection({
  customer,
  address,
  extraNumber,
}: CustomerInfoSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [showNavModal, setShowNavModal] = useState(false);

  const rawLat = address?.latitude ?? address?.lat;
  const rawLng = address?.longitude ?? address?.lng;
  const hasGps = rawLat !== undefined && rawLng !== undefined && rawLat !== null && rawLng !== null;

  const handleCallCustomer = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleWhatsAppClick = () => {
    if (customer.whatsapp) {
      const cleanNumber = customer.whatsapp.replace(/\D/g, "");
      Linking.openURL(`https://wa.me/${cleanNumber}`);
    }
  };

  return (
    <View style={sectionStyles.section}>
      <TouchableOpacity
        style={sectionStyles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={sectionStyles.sectionTitle}>Customer Info</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={sectionStyles.sectionContent}>
          {/* Name with badges */}
          <View style={fieldStyles.fieldGroup}>
            <Text style={fieldStyles.fieldLabel}>Name</Text>
            <View style={styles.nameContainer}>
              <Text style={fieldStyles.fieldValue}>{customer.name}</Text>
              {customer.is_care_of_customer === 1 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Care Of</Text>
                </View>
              )}
              {customer.status && (
                <View
                  style={[
                    styles.badge,
                    customer.status === "active"
                      ? styles.badgeActive
                      : styles.badgeInactive,
                  ]}
                >
                  <Text style={styles.badgeText}>{customer.status}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Phone & WhatsApp */}
          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Mobile</Text>
              <TouchableOpacity
                onPress={handleCallCustomer}
                style={styles.actionRow}
              >
                <Text style={fieldStyles.fieldValue}>{customer.phone}</Text>
                <Ionicons
                  name="call"
                  size={14}
                  color={Colors.themes.provider.primary}
                />
              </TouchableOpacity>
            </View>
            {customer.whatsapp && (
              <View style={fieldStyles.fieldHalf}>
                <Text style={fieldStyles.fieldLabel}>WhatsApp</Text>
                <TouchableOpacity
                  onPress={handleWhatsAppClick}
                  style={styles.actionRow}
                >
                  <Text style={fieldStyles.fieldValue}>
                    {customer.whatsapp}
                  </Text>
                  <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Address */}
          <View style={fieldStyles.fieldGroup}>
            <View style={styles.addressHeaderRow}>
              <Text style={fieldStyles.fieldLabel}>Address</Text>
              {hasGps && (
                <View style={styles.gpsBadge}>
                  <Ionicons name="navigate-circle" size={12} color="#10B981" />
                  <Text style={styles.gpsBadgeText}>GPS Available</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowNavModal(true)}
              style={styles.addressActionRow}
              activeOpacity={0.7}
            >
              <Text style={[fieldStyles.fieldValue, { flex: 1 }]}>
                {address.address_line_1}, {address.city}, {address.state}
              </Text>
              
              <View style={styles.mapIconButton}>
                <Ionicons
                  name="navigate"
                  size={12}
                  color={Colors.neutral.white}
                />
                <Text style={styles.mapIconButtonText}>Map & Nav</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Extra Number */}
          {extraNumber && (
            <View style={fieldStyles.fieldGroup}>
              <Text style={fieldStyles.fieldLabel}>Extra Number</Text>
              <Text style={fieldStyles.fieldValue}>{extraNumber}</Text>
            </View>
          )}
        </View>
      )}

      {/* Map Navigation Modal */}
      <AddressNavigationModal
        visible={showNavModal}
        onClose={() => setShowNavModal(false)}
        customerName={customer.name}
        customerPhone={customer.phone}
        address={address}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.background.secondary,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginTop: 2,
  },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#10B98115",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gpsBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10B981",
  },
  mapIconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.themes.provider.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  mapIconButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  badge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: "#D1FAE5",
  },
  badgeInactive: {
    backgroundColor: "#FEE2E2",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#92400E",
    textTransform: "capitalize",
  },
});
