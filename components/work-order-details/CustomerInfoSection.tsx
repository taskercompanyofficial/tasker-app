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
  };
  extraNumber?: string;
}

export default function CustomerInfoSection({
  customer,
  address,
  extraNumber,
}: CustomerInfoSectionProps) {
  const [expanded, setExpanded] = useState(true);

  const handleCallCustomer = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleNavigateToAddress = () => {
    const fullAddress = `${address.address_line_1}, ${address.city}, ${address.state}`;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullAddress,
      )}`,
    );
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
            <Text style={fieldStyles.fieldLabel}>Address</Text>
            <TouchableOpacity
              onPress={handleNavigateToAddress}
              style={styles.actionRow}
            >
              <Text style={[fieldStyles.fieldValue, { flex: 1 }]}>
                {address.address_line_1}, {address.city}, {address.state}
              </Text>
              <Ionicons
                name="location"
                size={14}
                color={Colors.themes.provider.primary}
              />
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
