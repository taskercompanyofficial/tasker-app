import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Colors from "@/constants/Colors";
import { WorkOrder } from "@/types/work-order";
import SheetSelect, { SheetSelectOption } from "@/components/SheetSelect";
import axios from "@/lib/axios.config";
import {
  VENDOR_SERVICE_CONCERNS_URL,
  VENDOR_SERVICE_SUB_CONCERNS_URL,
  VENDOR_WARRANTY_TYPES_URL,
} from "@/lib/api-endpoints";

interface WorkOrderDetailsTabProps {
  workOrder: WorkOrder;
  formData: {
    indoor_serial_number: string;
    outdoor_serial_number: string;
    product_indoor_model: string;
    product_outdoor_model: string;
    purchase_date: string;
    technician_remarks: string;
    service_concern_id: number | null;
    service_sub_concern_id: number | null;
    warranty_type_id: number | null;
  };
  setFormData: (key: string, value: any) => void;
  onScanIndoor: () => void;
  onScanOutdoor: () => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
}

const SINGLE_UNIT_SERVICES = new Set([
  "washing-machine",
  "led-tv",
  "refrigerator",
  "microwave-oven",
  "geyser",
  "water-dispenser",
  "dishwasher",
]);

export default function WorkOrderDetailsTab({
  workOrder,
  formData,
  setFormData,
  onScanIndoor,
  onScanOutdoor,
  onSave,
  saving = false,
}: WorkOrderDetailsTabProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Sheet pickers
  const [showConcernPicker, setShowConcernPicker] = useState(false);
  const [showSubConcernPicker, setShowSubConcernPicker] = useState(false);
  const [showWarrantyTypePicker, setShowWarrantyTypePicker] = useState(false);

  // Lookups data
  const [concerns, setConcerns] = useState<SheetSelectOption[]>([]);
  const [subConcerns, setSubConcerns] = useState<SheetSelectOption[]>([]);
  const [warrantyTypes, setWarrantyTypes] = useState<SheetSelectOption[]>([]);
  const [loadingConcerns, setLoadingConcerns] = useState(false);
  const [loadingSubConcerns, setLoadingSubConcerns] = useState(false);
  const [loadingWarrantyTypes, setLoadingWarrantyTypes] = useState(false);

  // Fetch concerns and warranty types
  React.useEffect(() => {
    let mounted = true;

    const loadConcerns = async () => {
      try {
        setLoadingConcerns(true);
        const res = await axios.get(VENDOR_SERVICE_CONCERNS_URL);
        if (mounted && res.data?.data) {
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setConcerns(
            list.map((c: any) => ({
              value: c.id,
              label: c.name,
              description: c.description || null,
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to fetch service concerns:", err);
      } finally {
        if (mounted) setLoadingConcerns(false);
      }
    };

    const loadWarrantyTypes = async () => {
      try {
        setLoadingWarrantyTypes(true);
        const res = await axios.get(VENDOR_WARRANTY_TYPES_URL);
        if (mounted && res.data?.data) {
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setWarrantyTypes(
            list.map((w: any) => ({
              value: w.id,
              label: w.name,
              description: w.description || null,
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to fetch warranty types:", err);
      } finally {
        if (mounted) setLoadingWarrantyTypes(false);
      }
    };

    loadConcerns();
    loadWarrantyTypes();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch sub-concerns when selected concern changes
  React.useEffect(() => {
    let mounted = true;
    if (!formData.service_concern_id) {
      setSubConcerns([]);
      return;
    }

    const loadSubConcerns = async () => {
      try {
        setLoadingSubConcerns(true);
        const res = await axios.get(
          VENDOR_SERVICE_SUB_CONCERNS_URL(formData.service_concern_id!)
        );
        if (mounted && res.data?.data) {
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setSubConcerns(
            list.map((sc: any) => ({
              value: sc.id,
              label: sc.name,
              description: sc.description || null,
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to fetch service sub concerns:", err);
      } finally {
        if (mounted) setLoadingSubConcerns(false);
      }
    };

    loadSubConcerns();

    return () => {
      mounted = false;
    };
  }, [formData.service_concern_id]);

  // Determine if service has outdoor unit
  const hasOutdoorUnit = useMemo(() => {
    const parentSlug = (workOrder.parent_service?.name || "").toLowerCase();
    const serviceName = (workOrder.service?.name || "").toLowerCase();
    const categoryName = (workOrder.category?.name || "").toLowerCase();

    for (const singleSlug of SINGLE_UNIT_SERVICES) {
      if (
        parentSlug.includes(singleSlug) ||
        serviceName.includes(singleSlug) ||
        categoryName.includes(singleSlug)
      ) {
        return false;
      }
    }
    // Default to true for AC services
    return (
      parentSlug.includes("ac") ||
      serviceName.includes("ac") ||
      categoryName.includes("ac") ||
      parentSlug.includes("air")
    );
  }, [workOrder]);

  // Phone Call & WhatsApp handlers
  const customerName = workOrder.customer?.name || "Customer";
  const customerPhone = workOrder.customer?.phone || "";
  const extraPhone = workOrder.extra_number || "";

  const handlePhoneCall = (phoneToCall: string) => {
    if (!phoneToCall) return;
    const clean = phoneToCall.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${clean}`).catch((err) =>
      console.warn("Cannot dial phone:", err)
    );
  };

  const handleWhatsApp = (phoneToMessage: string) => {
    if (!phoneToMessage) return;
    const digits = phoneToMessage.replace(/[^0-9]/g, "");
    const waPhone = digits.startsWith("0") ? `92${digits.slice(1)}` : digits;
    const prefill = encodeURIComponent(
      `Hello ${customerName}, I am your technician for Tasker Order #${
        workOrder.work_order_number || workOrder.id
      }.`
    );
    Linking.openURL(`https://wa.me/${waPhone}?text=${prefill}`).catch((err) =>
      console.warn("Cannot open WhatsApp:", err)
    );
  };

  // Full address
  const fullAddress = useMemo(() => {
    const parts = [
      workOrder.address?.address_line_1,
      workOrder.address?.address_line_2,
      workOrder.address?.area,
      workOrder.address?.city,
    ].filter(Boolean);
    return parts.join(", ");
  }, [workOrder.address]);

  // Selected labels
  const selectedConcernLabel = useMemo(() => {
    const found = concerns.find((c) => c.value === formData.service_concern_id);
    return found?.label || workOrder.service_concern?.name || "Select Concern";
  }, [concerns, formData.service_concern_id, workOrder.service_concern]);

  const selectedSubConcernLabel = useMemo(() => {
    const found = subConcerns.find(
      (sc) => sc.value === formData.service_sub_concern_id
    );
    return (
      found?.label ||
      workOrder.service_sub_concern?.name ||
      "Select Sub-Concern"
    );
  }, [subConcerns, formData.service_sub_concern_id, workOrder.service_sub_concern]);

  const selectedWarrantyLabel = useMemo(() => {
    const found = warrantyTypes.find(
      (w) => w.value === formData.warranty_type_id
    );
    return found?.label || workOrder.warranty_type?.name || "Select Warranty Type";
  }, [warrantyTypes, formData.warranty_type_id, workOrder.warranty_type]);

  const isWarrantyCase = useMemo(() => {
    const label = selectedWarrantyLabel.toLowerCase();
    return (
      label.includes("brand") ||
      label.includes("warranty") ||
      formData.warranty_type_id === 1 ||
      formData.warranty_type_id === 3
    );
  }, [selectedWarrantyLabel, formData.warranty_type_id]);

  return (
    <View style={styles.container}>
      {/* ─── 1. CUSTOMER & SITE CARD (MINIMAL, ZERO SHADOW) ─── */}
      <View style={styles.card}>
        <View style={styles.customerHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customerName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "CU"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.customerTitleRow}>
              <Text style={styles.customerName}>{customerName}</Text>
              {workOrder.address?.main_service_area?.name && (
                <View style={styles.areaPill}>
                  <Ionicons name="location-sharp" size={10} color="#0284C7" />
                  <Text style={styles.areaPillText}>
                    {workOrder.address.main_service_area.name}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.customerPhone}>
              {customerPhone || "No primary phone provided"}
            </Text>
            {Boolean(extraPhone) && (
              <Text style={styles.customerExtraPhone}>
                Alt: {extraPhone}
              </Text>
            )}
          </View>
        </View>

        {/* Full Street Address */}
        <View style={styles.addressBox}>
          <Ionicons name="navigate-outline" size={14} color="#64748B" />
          <Text style={styles.addressText} numberOfLines={2}>
            {fullAddress || "Address details on file"}
          </Text>
        </View>

        {/* Call & WhatsApp Quick Buttons */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.actionBtnCall}
            onPress={() => handlePhoneCall(customerPhone)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={14} color="#0F172A" />
            <Text style={styles.actionBtnCallText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnWhatsApp}
            onPress={() => handleWhatsApp(customerPhone)}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={15} color="#059669" />
            <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
          </TouchableOpacity>

          {Boolean(extraPhone) && (
            <TouchableOpacity
              style={styles.actionBtnAltCall}
              onPress={() => handlePhoneCall(extraPhone)}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={13} color="#475569" />
              <Text style={styles.actionBtnAltCallText}>Alt Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── 2. JOB SCOPE & DIAGNOSTIC CONCERN CARD ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="construct-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Job Scope & Concern</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {workOrder.category?.name || "Service"}
            </Text>
          </View>
        </View>

        {/* Booked Service Name */}
        <Text style={styles.serviceName}>
          {workOrder.parent_service?.name ||
            workOrder.service?.name ||
            "Booked Service Order"}
        </Text>

        {/* Customer Reported Complaint */}
        {Boolean(workOrder.customer_description) && (
          <View style={styles.complaintBox}>
            <View style={styles.complaintHeader}>
              <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
              <Text style={styles.complaintTitle}>Customer Problem Report</Text>
            </View>
            <Text style={styles.complaintText}>
              {workOrder.customer_description}
            </Text>
          </View>
        )}

        {/* Concern Dropdown Pickers */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Service Concern (Primary Fault)</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowConcernPicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.selectorText,
                !formData.service_concern_id && styles.selectorPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedConcernLabel}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {Boolean(formData.service_concern_id) && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Sub-Concern (Specific Fault)</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowSubConcernPicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.selectorText,
                  !formData.service_sub_concern_id && styles.selectorPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedSubConcernLabel}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── 3. APPLIANCE & SERIAL NUMBERS CARD (WITH CRM WARRANTY RULES) ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="barcode-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Appliance & Serial Numbers</Text>
          </View>
          {isWarrantyCase && (
            <View style={styles.warrantyCaseBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.warrantyCaseBadgeText}>Warranty Case</Text>
            </View>
          )}
        </View>

        {/* Warranty Type Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Warranty Status</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowWarrantyTypePicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.selectorText,
                !formData.warranty_type_id && styles.selectorPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedWarrantyLabel}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Indoor Serial Number */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>
              Indoor Serial Number {isWarrantyCase && <Text style={styles.requiredStar}>*</Text>}
            </Text>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={onScanIndoor}
              activeOpacity={0.8}
            >
              <Ionicons name="scan-outline" size={13} color="#0F172A" />
              <Text style={styles.scanBtnText}>Scan Barcode</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            value={formData.indoor_serial_number}
            onChangeText={(text) =>
              setFormData("indoor_serial_number", text.toUpperCase())
            }
            placeholder="e.g. HIN123456789"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />
        </View>

        {/* Outdoor Serial Number (Conditional for Split ACs) */}
        {hasOutdoorUnit && (
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                Outdoor Serial Number {isWarrantyCase && <Text style={styles.requiredStar}>*</Text>}
              </Text>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={onScanOutdoor}
                activeOpacity={0.8}
              >
                <Ionicons name="scan-outline" size={13} color="#0F172A" />
                <Text style={styles.scanBtnText}>Scan Barcode</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              value={formData.outdoor_serial_number}
              onChangeText={(text) =>
                setFormData("outdoor_serial_number", text.toUpperCase())
              }
              placeholder="e.g. HOUT987654321"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
          </View>
        )}

        {/* Models: Indoor & Outdoor */}
        <View style={styles.twoColumnRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Indoor Model</Text>
            <TextInput
              style={styles.textInput}
              value={formData.product_indoor_model}
              onChangeText={(text) =>
                setFormData("product_indoor_model", text.toUpperCase())
              }
              placeholder="e.g. HSU-18HNS"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
          </View>
          {hasOutdoorUnit && (
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Outdoor Model</Text>
              <TextInput
                style={styles.textInput}
                value={formData.product_outdoor_model}
                onChangeText={(text) =>
                  setFormData("product_outdoor_model", text.toUpperCase())
                }
                placeholder="e.g. HSU-18HNS-O"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />
            </View>
          )}
        </View>

        {/* Purchase Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Purchase Date</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.selectorText,
                !formData.purchase_date && styles.selectorPlaceholder,
              ]}
            >
              {formData.purchase_date || "YYYY-MM-DD"}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={
              formData.purchase_date
                ? new Date(formData.purchase_date)
                : selectedDate
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                const formatted = date.toISOString().split("T")[0];
                setFormData("purchase_date", formatted);
                setSelectedDate(date);
              }
            }}
          />
        )}
      </View>

      {/* ─── 4. TECHNICIAN NOTES & REMARKS CARD ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="clipboard-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Technician Remarks & Actions</Text>
          </View>
        </View>

        <TextInput
          style={styles.textAreaInput}
          value={formData.technician_remarks}
          onChangeText={(text) => setFormData("technician_remarks", text)}
          placeholder="Enter diagnostic observations, work performed, or recommendations..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {onSave && (
          <View style={styles.saveBtnRow}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Details</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── MODAL SHEETS FOR SELECTION ─── */}
      <SheetSelect
        visible={showConcernPicker}
        title="Select Service Concern"
        options={concerns}
        selectedValue={formData.service_concern_id}
        onSelect={(val) => {
          setFormData("service_concern_id", val);
          setFormData("service_sub_concern_id", null);
          setShowConcernPicker(false);
        }}
        onClose={() => setShowConcernPicker(false)}
        loading={loadingConcerns}
      />

      <SheetSelect
        visible={showSubConcernPicker}
        title="Select Service Sub-Concern"
        options={subConcerns}
        selectedValue={formData.service_sub_concern_id}
        onSelect={(val) => {
          setFormData("service_sub_concern_id", val);
          setShowSubConcernPicker(false);
        }}
        onClose={() => setShowSubConcernPicker(false)}
        loading={loadingSubConcerns}
      />

      <SheetSelect
        visible={showWarrantyTypePicker}
        title="Select Warranty Type"
        options={warrantyTypes}
        selectedValue={formData.warranty_type_id}
        onSelect={(val) => {
          setFormData("warranty_type_id", val);
          setShowWarrantyTypePicker(false);
        }}
        onClose={() => setShowWarrantyTypePicker(false)}
        loading={loadingWarrantyTypes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    // ZERO SHADOWS AS REQUIRED
    elevation: 0,
    shadowColor: "transparent",
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  customerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  customerPhone: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  customerExtraPhone: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  areaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  areaPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0284C7",
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  addressText: {
    fontSize: 12,
    color: "#475569",
    flex: 1,
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  actionBtnCall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  actionBtnCallText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  actionBtnWhatsApp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  actionBtnWhatsAppText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
  },
  actionBtnAltCall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionBtnAltCallText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  complaintBox: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  complaintHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  complaintTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    textTransform: "uppercase",
  },
  complaintText: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 17,
  },
  inputGroup: {
    marginTop: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 5,
  },
  requiredStar: {
    color: "#DC2626",
    fontWeight: "700",
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  selector: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  selectorText: {
    fontSize: 13,
    color: "#0F172A",
  },
  selectorPlaceholder: {
    color: "#94A3B8",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 10,
  },
  warrantyCaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  warrantyCaseBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  textAreaInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  saveBtnRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
