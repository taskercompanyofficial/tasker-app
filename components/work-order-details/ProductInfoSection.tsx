import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
        <Text style={sectionStyles.sectionTitle}>Product Info</Text>
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
              <Text style={fieldStyles.fieldLabel}>Brand:</Text>
              <Text style={fieldStyles.fieldValue}>{brand?.name || "N/A"}</Text>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Product:</Text>
              <Text style={fieldStyles.fieldValue}>
                {product?.name || "N/A"}
              </Text>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Indoor Model:</Text>
              <Text style={fieldStyles.fieldValue}>
                {productIndoorModel || "N/A"}
              </Text>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Indoor Serial:</Text>
              <Text style={fieldStyles.fieldValue}>
                {indoorSerialNumber || "N/A"}
              </Text>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Outdoor Model:</Text>
              <Text style={fieldStyles.fieldValue}>
                {productOutdoorModel || "N/A"}
              </Text>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Outdoor Serial:</Text>
              <Text style={fieldStyles.fieldValue}>
                {outdoorSerialNumber || "N/A"}
              </Text>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Purchase Date:</Text>
              <Text style={fieldStyles.fieldValue}>
                {purchaseDate || "N/A"}
              </Text>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <Text style={fieldStyles.fieldLabel}>Warranty Case:</Text>
              <Text style={fieldStyles.fieldValue}>
                {isWarrantyCase ? "Yes" : "No"}
              </Text>
            </View>
          </View>

          <View style={fieldStyles.fieldRow}>
            {reference && (
              <View style={fieldStyles.fieldHalf}>
                <Text style={fieldStyles.fieldLabel}>Reference:</Text>
                <Text style={fieldStyles.fieldValue}>{reference}</Text>
              </View>
            )}
            {extraNumber && (
              <View style={fieldStyles.fieldHalf}>
                <Text style={fieldStyles.fieldLabel}>Extra Number:</Text>
                <Text style={fieldStyles.fieldValue}>{extraNumber}</Text>
              </View>
            )}
          </View>

          {technicianRemarks && (
            <View style={fieldStyles.fieldGroup}>
              <Text style={fieldStyles.fieldLabel}>Technician Remarks:</Text>
              <Text style={fieldStyles.fieldValue}>{technicianRemarks}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
