import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import type { Address } from "@/components/AddressSelector";

interface AddressDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  address: Address | null;
}

export default function AddressDetailsModal({ visible, onClose, address }: AddressDetailsModalProps) {
  if (!address) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={
                  address.address_type === "home"
                    ? "home"
                    : address.address_type === "office"
                    ? "briefcase"
                    : "location"
                }
                size={20}
                color={Colors.themes.customer.primary}
              />
              <Text style={styles.title}>
                {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)} Address
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={18} color={Colors.text.tertiary} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Street Address</Text>
                <Text style={styles.detailValue}>{address.address_line_1}</Text>
              </View>
            </View>

            {address.address_line_2 && (
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={18} color={Colors.text.tertiary} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Apartment / Suite</Text>
                  <Text style={styles.detailValue}>{address.address_line_2}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={Colors.text.tertiary} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>City & State</Text>
                <Text style={styles.detailValue}>
                  {address.city}, {address.state} {address.zip_code || ""}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="flag-outline" size={18} color={Colors.text.tertiary} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Area Type</Text>
                <Text style={styles.detailValue}>
                  {address.area_type.charAt(0).toUpperCase() + address.area_type.slice(1)}
                </Text>
              </View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: Spacing.lg,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  content: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
