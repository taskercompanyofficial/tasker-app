import AppText from "@/components/common/AppText";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { fieldStyles, sectionStyles } from "./styles";

interface ProductInfoSectionProps {
  brand?: { name: string };
  product?: { name: string };
  productIndoorModel?: string;
  indoorSerialNumber?: string;
  productOutdoorModel?: string;
  outdoorSerialNumber?: string;
  purchaseDate?: string;
  isWarrantyCase: boolean;
  technicianRemarks?: string;
  reference?: string;
  extraNumber?: string;
}

export default function ProductInfoSection({
  brand,
  product,
  productIndoorModel,
  indoorSerialNumber,
  productOutdoorModel,
  outdoorSerialNumber,
  purchaseDate,
  isWarrantyCase,
  technicianRemarks,
  reference,
  extraNumber,
}: ProductInfoSectionProps) {
  const [expanded, setExpanded] = useState(false);

  // Don't render if no product info
  if (!brand && !product) return null;

  return (
    <View style={sectionStyles.section}>
      <TouchableOpacity
        style={sectionStyles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <AppText style={sectionStyles.sectionTitle}>Product Info</AppText>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={sectionStyles.sectionContent}>
          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Brand:</AppText>
              <AppText style={fieldStyles.fieldValue}>{brand?.name || "N/A"}</AppText>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Product:</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {product?.name || "N/A"}
              </AppText>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Indoor Model:</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {productIndoorModel || "N/A"}
              </AppText>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Indoor Serial:</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {indoorSerialNumber || "N/A"}
              </AppText>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Outdoor Model:</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {productOutdoorModel || "N/A"}
              </AppText>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Outdoor Serial:</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {outdoorSerialNumber || "N/A"}
              </AppText>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Purchase Date:</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {purchaseDate || "N/A"}
              </AppText>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Warranty Case:</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {isWarrantyCase ? "Yes" : "No"}
              </AppText>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            {reference && (
              <View style={fieldStyles.fieldHalf}>
                <AppText style={fieldStyles.fieldLabel}>Reference:</AppText>
                <AppText style={fieldStyles.fieldValue}>{reference}</AppText>
              </View>
            )}
            {extraNumber && (
              <View style={fieldStyles.fieldHalf}>
                <AppText style={fieldStyles.fieldLabel}>Extra Number:</AppText>
                <AppText style={fieldStyles.fieldValue}>{extraNumber}</AppText>
              </View>
            )}
          </View>

          {technicianRemarks && (
            <View style={fieldStyles.fieldGroup}>
              <AppText style={fieldStyles.fieldLabel}>Technician Remarks:</AppText>
              <AppText style={fieldStyles.fieldValue}>{technicianRemarks}</AppText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
