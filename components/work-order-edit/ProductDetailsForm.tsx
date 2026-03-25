import Colors from "@/constants/Colors";
import {
  SERVICE_CONCERNS_URL,
  SERVICE_SUB_CONCERNS_URL,
  VENDOR_SERVICE_CONCERNS_URL,
  VENDOR_SERVICE_SUB_CONCERNS_URL,
  VENDOR_WARRANTY_TYPES_URL,
  WARRANTY_TYPES_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { WorkOrder } from "@/types/work-order";
import SheetSelect, { SheetSelectOption } from "@/components/SheetSelect";

interface ProductDetailsFormProps {
  workOrder: WorkOrder;
  // Form values (controlled inputs)
  indoorSerial: string;
  outdoorSerial: string;
  indoorModel: string;
  outdoorModel: string;
  purchaseDate: string;
  selectedConcernId?: number | null;
  selectedSubConcernId?: number | null;
  selectedWarrantyTypeId?: number | null;
  // Change handlers
  onIndoorSerialChange: (value: string) => void;
  onOutdoorSerialChange: (value: string) => void;
  onIndoorModelChange: (value: string) => void;
  onOutdoorModelChange: (value: string) => void;
  onPurchaseDateChange: (value: string) => void;
  onServiceConcernChange?: (id: number | null) => void;
  onServiceSubConcernChange?: (id: number | null) => void;
  onWarrantyTypeChange?: (id: number | null) => void;
  onScanIndoor: () => void;
  onScanOutdoor: () => void;
}

export default function ProductDetailsForm({
  workOrder,
  indoorSerial,
  outdoorSerial,
  indoorModel,
  outdoorModel,
  purchaseDate,
  selectedConcernId,
  selectedSubConcernId,
  selectedWarrantyTypeId,
  onIndoorSerialChange,
  onOutdoorSerialChange,
  onIndoorModelChange,
  onOutdoorModelChange,
  onPurchaseDateChange,
  onServiceConcernChange,
  onServiceSubConcernChange,
  onWarrantyTypeChange,
  onScanIndoor,
  onScanOutdoor,
}: ProductDetailsFormProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showConcernPicker, setShowConcernPicker] = useState(false);
  const [showSubConcernPicker, setShowSubConcernPicker] = useState(false);
  const [showWarrantyTypePicker, setShowWarrantyTypePicker] = useState(false);

  // Concerns data
  const [concerns, setConcerns] = useState<SheetSelectOption[]>([]);
  const [subConcerns, setSubConcerns] = useState<SheetSelectOption[]>([]);
  const [warrantyTypes, setWarrantyTypes] = useState<SheetSelectOption[]>([]);
  const [loadingConcerns, setLoadingConcerns] = useState(false);
  const [loadingSubConcerns, setLoadingSubConcerns] = useState(false);
  const [loadingWarrantyTypes, setLoadingWarrantyTypes] = useState(false);

  useEffect(() => {
    fetchConcerns();
    fetchWarrantyTypes();
  }, [workOrder.parent_service?.id]);

  useEffect(() => {
    if (selectedConcernId) {
      fetchSubConcerns(selectedConcernId);
    } else {
      setSubConcerns([]);
    }
  }, [selectedConcernId]);

  const fetchConcerns = async () => {
    if (!workOrder.parent_service?.id) {
      console.log("No parent_service id, skipping fetch");
      return;
    }
    try {
      setLoadingConcerns(true);
      const url = VENDOR_SERVICE_CONCERNS_URL;
      const response = await axios.get(url);
      console.log("Concerns response:", response.data);
      setConcerns(response.data.data || []);
    } catch (error) {
      console.error("Error fetching concerns:", error);
    } finally {
      setLoadingConcerns(false);
    }
  };

  const fetchSubConcerns = async (concernId: number) => {
    try {
      setLoadingSubConcerns(true);
      const response = await axios.get(
        VENDOR_SERVICE_SUB_CONCERNS_URL(concernId),
      );
      setSubConcerns(response.data.data || []);
    } catch (error) {
      console.error("Error fetching sub-concerns:", error);
    } finally {
      setLoadingSubConcerns(false);
    }
  };

  const fetchWarrantyTypes = async () => {
    try {
      setLoadingWarrantyTypes(true);
      const response = await axios.get(VENDOR_WARRANTY_TYPES_URL);
      setWarrantyTypes(response.data.data || []);
    } catch (error) {
      console.error("Error fetching warranty types:", error);
    } finally {
      setLoadingWarrantyTypes(false);
    }
  };

  const handleOpenDatePicker = () => {
    if (workOrder.purchase_date) {
      const date = new Date(workOrder.purchase_date);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split("T")[0];
      onPurchaseDateChange(formattedDate);

      if (Platform.OS === "ios") {
        setTimeout(() => setShowDatePicker(false), 100);
      }
    }
  };

  const getSelectedConcernLabel = () => {
    const concern = concerns.find((c) => c.value === selectedConcernId);
    return concern?.label || "Select concern";
  };

  const getSelectedSubConcernLabel = () => {
    const subConcern = subConcerns.find(
      (c) => c.value === selectedSubConcernId,
    );
    return subConcern?.label || "Select sub-concern";
  };

  const getSelectedWarrantyTypeLabel = () => {
    const warrantyType = warrantyTypes.find(
      (w) => w.value === selectedWarrantyTypeId,
    );
    return warrantyType?.label || "Select warranty type";
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Product Details</Text>

      {/* Service Concern & Sub Concern */}
      {onServiceConcernChange && (
        <>
          <Text style={styles.label}>Service Concern</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowConcernPicker(true)}
          >
            <Text
              style={[
                styles.selectText,
                !selectedConcernId && styles.placeholder,
              ]}
            >
              {getSelectedConcernLabel()}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.label}>Sub Concern</Text>
          <TouchableOpacity
            style={[styles.selectButton, !selectedConcernId && styles.disabled]}
            onPress={() => selectedConcernId && setShowSubConcernPicker(true)}
            disabled={!selectedConcernId}
          >
            <Text
              style={[
                styles.selectText,
                !selectedSubConcernId && styles.placeholder,
              ]}
            >
              {getSelectedSubConcernLabel()}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </TouchableOpacity>
        </>
      )}

      {/* Warranty Type */}
      {onWarrantyTypeChange && (
        <>
          <Text style={styles.label}>Warranty Type</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowWarrantyTypePicker(true)}
          >
            <Text
              style={[
                styles.selectText,
                !selectedWarrantyTypeId && styles.placeholder,
              ]}
            >
              {getSelectedWarrantyTypeLabel()}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.label}>Indoor Serial Number</Text>
      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Enter or scan serial"
          placeholderTextColor="#9CA3AF"
          value={indoorSerial}
          onChangeText={onIndoorSerialChange}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.scanButton} onPress={onScanIndoor}>
          <Ionicons
            name="barcode-outline"
            size={16}
            color={Colors.themes.provider.primary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Outdoor Serial Number</Text>
      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Enter or scan serial"
          placeholderTextColor="#9CA3AF"
          value={outdoorSerial}
          onChangeText={onOutdoorSerialChange}
        />
        <TouchableOpacity style={styles.scanButton} onPress={onScanOutdoor}>
          <Ionicons
            name="barcode-outline"
            size={16}
            color={Colors.themes.provider.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>Indoor Model</Text>
          <TextInput
            style={styles.input}
            placeholder="Indoor model"
            placeholderTextColor="#9CA3AF"
            value={indoorModel}
            onChangeText={onIndoorModelChange}
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>Outdoor Model</Text>
          <TextInput
            style={styles.input}
            placeholder="Outdoor model"
            placeholderTextColor="#9CA3AF"
            value={outdoorModel}
            onChangeText={onOutdoorModelChange}
          />
        </View>
      </View>

      <Text style={styles.label}>Purchase Date</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleOpenDatePicker}
      >
        <Text style={[styles.selectText, !purchaseDate && styles.placeholder]}>
          {purchaseDate || "Select date"}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={Colors.themes.provider.primary}
        />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Concern Sheet Select */}
      <SheetSelect
        visible={showConcernPicker}
        onClose={() => setShowConcernPicker(false)}
        title="Select Service Concern"
        options={concerns}
        selectedValue={selectedConcernId}
        loading={loadingConcerns}
        emptyText="No concerns available"
        onSelect={(value: number) => {
          onServiceConcernChange?.(value);
          onServiceSubConcernChange?.(null);
        }}
      />

      {/* Sub Concern Sheet Select */}
      <SheetSelect
        visible={showSubConcernPicker}
        onClose={() => setShowSubConcernPicker(false)}
        title="Select Sub Concern"
        options={subConcerns}
        selectedValue={selectedSubConcernId}
        loading={loadingSubConcerns}
        emptyText="No sub-concerns available"
        onSelect={(value: number) => onServiceSubConcernChange?.(value)}
      />

      {/* Warranty Type Sheet Select */}
      <SheetSelect
        visible={showWarrantyTypePicker}
        onClose={() => setShowWarrantyTypePicker(false)}
        title="Select Warranty Type"
        options={warrantyTypes}
        selectedValue={selectedWarrantyTypeId}
        loading={loadingWarrantyTypes}
        emptyText="No warranty types available"
        onSelect={(value: number) => onWarrantyTypeChange?.(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 3,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  halfField: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 8,
    fontSize: 10,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  inputWithButton: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  inputFlex: {
    flex: 1,
  },
  scanButton: {
    width: 34,
    height: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.themes.provider.primary,
    backgroundColor: "rgba(30, 64, 175, 0.08)", // vendor primary light opacity
    alignItems: "center",
    justifyContent: "center",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#FAFAFA",
  },
  selectText: {
    fontSize: 10,
    color: "#111827",
  },
  placeholder: {
    color: "#9CA3AF",
  },
  disabled: {
    opacity: 0.5,
  },
});
