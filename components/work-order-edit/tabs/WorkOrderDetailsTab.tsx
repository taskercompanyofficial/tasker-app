import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import * as Haptics from "expo-haptics";
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { WorkOrder } from "@/types/work-order";
import SheetSelect, { SheetSelectOption } from "@/components/SheetSelect";
import axios from "@/lib/axios.config";
import { VENDOR_WARRANTY_TYPES_URL, VENDOR_VOICE_TO_TEXT_URL } from "@/lib/api-endpoints";

interface WorkOrderDetailsTabProps {
  workOrder: WorkOrder;
  formData: {
    indoor_serial_number: string;
    outdoor_serial_number: string;
    warranty_serial_number?: string;
    purchase_date: string;
    technician_remarks: string;
    warranty_type_id: number | null;
  };
  setFormData: (key: string, value: any) => void;
  onScanIndoor: () => void;
  onScanOutdoor: () => void;
  onScanWarranty: () => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
  autoSaveStatus?: "idle" | "unsaved" | "saving" | "saved";
}

const DEFAULT_WARRANTY_TYPES: SheetSelectOption[] = [
  { value: 1, label: "Brand Warranty", description: "Official manufacturer warranty" },
  { value: 2, label: "Out of Warranty", description: "Standard paid customer repair" },
  { value: 3, label: "Dealer Warranty", description: "Covered by authorized selling dealer" },
  { value: 4, label: "Extended Warranty", description: "Extended protection coverage" },
];

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
  onScanWarranty,
  onSave,
  saving = false,
  autoSaveStatus = "idle",
}: WorkOrderDetailsTabProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Sheet picker for Warranty Type
  const [showWarrantyTypePicker, setShowWarrantyTypePicker] = useState(false);
  const [warrantyTypes, setWarrantyTypes] = useState<SheetSelectOption[]>(DEFAULT_WARRANTY_TYPES);
  const [loadingWarrantyTypes, setLoadingWarrantyTypes] = useState(false);

  // Voice Typing state using expo-audio & Gemini transcription
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startVoiceRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Microphone permission is required for voice typing."
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      setRecordingSeconds(0);
      setIsRecordingVoice(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const anyRecorder = recorder as any;
      if (typeof anyRecorder.prepareToRecordAsync === "function") {
        await anyRecorder.prepareToRecordAsync();
      }
      if (typeof anyRecorder.recordAsync === "function") {
        await anyRecorder.recordAsync();
      } else if (typeof anyRecorder.record === "function") {
        await anyRecorder.record();
      }

      voiceTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start voice recording:", err);
      setIsRecordingVoice(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setIsRecordingVoice(false);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_) {}

      const anyRecorder = recorder as any;
      if (typeof anyRecorder.stopAsync === "function") {
        await anyRecorder.stopAsync();
      } else if (typeof anyRecorder.stop === "function") {
        await anyRecorder.stop();
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => {});

      const uri = recorder.uri;
      if (!uri) return;

      setIsTranscribing(true);

      // Convert recorded audio file to base64 directly on client (No backend server required)
      const audioResponse = await fetch(uri);
      const audioBlob = await audioResponse.blob();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const cleanBase64 = res.includes(",") ? res.split(",")[1] : res;
          resolve(cleanBase64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("Voice typing key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in .env");
      }

      const modelsToTry = [
        process.env.EXPO_PUBLIC_GEMINI_MODEL || "gemini-3.8-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
      ];

      let transcribedText = "";
      let lastErrorMessage = "";

      for (const model of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

          const speechResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: "You are an audio transcriber for appliance repair and technical service orders. Listen to this spoken technician voice note and transcribe it accurately into text. Accurately capture technical appliance terms (gas, capacitor, compressor, leak, pipe, wiring, PCB, error code, outdoor unit, indoor unit) in English or Urdu/Roman Urdu. Return ONLY the transcribed text verbatim, without any preamble, explanation, or quotes.",
                    },
                    {
                      inlineData: {
                        mimeType: "audio/m4a",
                        data: base64Audio,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
              },
            }),
          });

          const json = await speechResponse.json();
          if (json?.error) {
            lastErrorMessage = json.error.message;
            continue;
          }

          const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidateText) {
            transcribedText = candidateText;
            break;
          }
        } catch (mErr: any) {
          lastErrorMessage = mErr?.message || "Model request error";
        }
      }

      if (transcribedText) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        const existing = formData.technician_remarks || "";
        const updated = existing.trim()
          ? `${existing.trim()}\n${transcribedText.trim()}`
          : transcribedText.trim();
        setFormData("technician_remarks", updated);
      } else {
        throw new Error(lastErrorMessage || "Could not transcribe spoken voice");
      }
    } catch (err: any) {
      console.warn("Client voice transcription failed:", err);
      Alert.alert(
        "Voice Note",
        err?.message || "Could not transcribe audio. You can also type directly in the box."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const cancelVoiceRecording = async () => {
    try {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setIsRecordingVoice(false);
      const anyRecorder = recorder as any;
      if (typeof anyRecorder.stopAsync === "function") {
        await anyRecorder.stopAsync();
      } else if (typeof anyRecorder.stop === "function") {
        await anyRecorder.stop();
      }
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => {});
    } catch (e) {
      console.warn("Cancel recording error:", e);
    }
  };

  // Fetch active warranty types from backend with safe fallback
  React.useEffect(() => {
    let mounted = true;

    const loadWarrantyTypes = async () => {
      try {
        setLoadingWarrantyTypes(true);
        const res = await axios.get(VENDOR_WARRANTY_TYPES_URL);
        if (mounted && res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setWarrantyTypes(
            res.data.data.map((w: any) => ({
              value: w.id,
              label: w.name,
              description: w.description || null,
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to fetch warranty types from server, using defaults:", err);
      } finally {
        if (mounted) setLoadingWarrantyTypes(false);
      }
    };

    loadWarrantyTypes();

    return () => {
      mounted = false;
    };
  }, []);

  // Determine if service has outdoor unit (e.g. Split ACs)
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

  // Brand & Equipment Details
  const brandName = workOrder.brand?.name || (workOrder as any).brand_name || null;
  const productName =
    workOrder.product?.name ||
    (workOrder as any).product_name ||
    workOrder.parent_service?.name ||
    workOrder.service?.name ||
    null;
  const indoorModel =
    workOrder.product_indoor_model ||
    (workOrder as any).indoor_model ||
    workOrder.product_model ||
    null;
  const outdoorModel =
    workOrder.product_outdoor_model ||
    (workOrder as any).outdoor_model ||
    null;
  const brandComplaintNo =
    workOrder.brand_complaint_no ||
    (workOrder as any).brand_complaint_number ||
    workOrder.reference ||
    null;

  // Customer Service Charges to Claim
  const customerClaim = useMemo(() => {
    if (isWarrantyCase) {
      return {
        amount: 0,
        formattedText: "₨ 0 (Free Warranty)",
        isWarranty: true,
        label: "Under Warranty",
        note: "Warranty coverage applies • Do NOT collect payment from customer.",
        items: [] as Array<{ name?: string; description?: string; amount?: number }>,
      };
    }

    let parsedAmount = 0;
    let items: Array<{ name?: string; description?: string; amount?: number }> = [];

    const rawCharges = workOrder.charges;
    if (rawCharges && typeof rawCharges === "object") {
      const rawItems = (rawCharges as any).items;
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        items = rawItems;
        parsedAmount = rawItems.reduce(
          (sum: number, it: any) => sum + (Number(it?.amount) || 0),
          0
        );
      }
    }

    if (parsedAmount <= 0) {
      const rawVal =
        (workOrder as any).claim_amount ??
        workOrder.charges ??
        workOrder.service_charges ??
        workOrder.final_amount ??
        workOrder.total_amount ??
        workOrder.estimated_charges ??
        workOrder.grand_total;

      const num = Number(rawVal);
      parsedAmount = Number.isFinite(num) && num > 0 ? num : 0;
    }

    return {
      amount: parsedAmount,
      formattedText: parsedAmount > 0 ? `₨ ${parsedAmount.toLocaleString()}` : "₨ 0",
      isWarranty: false,
      label: parsedAmount > 0 ? "Collect on Site" : "Standard Visit",
      note:
        parsedAmount > 0
          ? "Collect this exact service amount in cash or online transfer from customer upon completion."
          : "Standard service order • Any parts or additional charges to be finalized upon inspection.",
      items,
    };
  }, [workOrder, isWarrantyCase]);

  // Rejection / Rework Info if rejected after completion
  const rejectionInfo = useMemo(() => {
    const isRejectedStatus =
      workOrder.sub_status?.slug?.includes("reject") ||
      workOrder.sub_status?.slug?.includes("rework") ||
      workOrder.status?.slug?.includes("reject");

    if (workOrder.reject_reason) {
      return {
        isRejected: true,
        reason: workOrder.reject_reason,
        rejectedAt: workOrder.rejected_at,
      };
    }

    if (workOrder.technician_remarks?.includes("[Rework Required")) {
      const match = workOrder.technician_remarks.match(/\[Rework Required[^\]]*\]:\s*([^\n\r]*)/);
      return {
        isRejected: true,
        reason: match ? match[1] : "Work order was rejected and returned for rework.",
        rejectedAt: workOrder.rejected_at,
      };
    }

    if (Array.isArray(workOrder.histories)) {
      const reworkHist = workOrder.histories.find(
        (h) =>
          h.action_type === "rework_required" ||
          h.action_type === "technician_rejected" ||
          h.description?.toLowerCase().includes("rejected")
      );
      if (reworkHist) {
        return {
          isRejected: true,
          reason:
            reworkHist.metadata?.rejection_reason ||
            reworkHist.description ||
            "Job sent back for rework.",
          rejectedAt: reworkHist.created_at,
        };
      }
    }

    if (isRejectedStatus) {
      return {
        isRejected: true,
        reason: "This work order has been rejected by QA/Admin and requires your correction.",
        rejectedAt: workOrder.rejected_at,
      };
    }

    return null;
  }, [workOrder]);

  return (
    <View style={styles.container}>
      {/* ─── 0. REJECTION / REWORK ALERT CARD ─── */}
      {rejectionInfo?.isRejected && (
        <View style={styles.rejectionCard}>
          <View style={styles.rejectionHeader}>
            <View style={styles.rejectionHeaderLeft}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.rejectionTitle}>Job Rejected / Correction Required</Text>
            </View>
            <View style={styles.rejectionBadge}>
              <Text style={styles.rejectionBadgeText}>Action Needed</Text>
            </View>
          </View>
          <Text style={styles.rejectionReasonLabel}>Rejection Remarks:</Text>
          <View style={styles.rejectionReasonBox}>
            <Text style={styles.rejectionReasonText}>{rejectionInfo.reason}</Text>
          </View>
          <Text style={styles.rejectionHelper}>
            Please review the rejected remarks, correct any invalid serials or re-upload rejected photos, and resubmit.
          </Text>
        </View>
      )}

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

        {/* Call & WhatsApp Quick Buttons (2 Equal Columns in Row) */}
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
        </View>

        {Boolean(extraPhone) && (
          <TouchableOpacity
            style={styles.actionBtnAltCallFull}
            onPress={() => handlePhoneCall(extraPhone)}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={13} color="#475569" />
            <Text style={styles.actionBtnAltCallText}>Alt Call: {extraPhone}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── 2. BRAND & EQUIPMENT DETAILS CARD (MINIMAL, ZERO SHADOW) ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="hardware-chip-outline" size={15} color="#0F172A" />
            <Text style={styles.cardTitle}>Brand & Equipment Details</Text>
          </View>
          {Boolean(brandName) && (
            <View style={styles.brandPill}>
              <Ionicons name="pricetag-outline" size={11} color="#1D4ED8" />
              <Text style={styles.brandPillText}>{brandName}</Text>
            </View>
          )}
        </View>

        <View style={styles.equipmentGrid}>
          {/* Brand Name */}
          <View style={styles.equipmentItem}>
            <Text style={styles.equipmentLabel}>Brand</Text>
            <Text style={styles.equipmentValue}>
              {brandName || "Standard / General"}
            </Text>
          </View>

          {/* Product / Model */}
          <View style={styles.equipmentItem}>
            <Text style={styles.equipmentLabel}>Appliance / Model</Text>
            <Text style={styles.equipmentValue} numberOfLines={1}>
              {productName || "Standard Unit"}
            </Text>
          </View>

          {/* Brand Complaint / Reference # */}
          {Boolean(brandComplaintNo) && (
            <View style={styles.equipmentItem}>
              <Text style={styles.equipmentLabel}>Complaint Ref #</Text>
              <Text style={styles.equipmentValue} numberOfLines={1}>
                {brandComplaintNo}
              </Text>
            </View>
          )}

          {/* Indoor Model (if available) */}
          {Boolean(indoorModel) && (
            <View style={styles.equipmentItem}>
              <Text style={styles.equipmentLabel}>Indoor Model</Text>
              <Text style={styles.equipmentValue} numberOfLines={1}>
                {indoorModel}
              </Text>
            </View>
          )}

          {/* Outdoor Model (if available) */}
          {Boolean(outdoorModel) && (
            <View style={styles.equipmentItem}>
              <Text style={styles.equipmentLabel}>Outdoor Model</Text>
              <Text style={styles.equipmentValue} numberOfLines={1}>
                {outdoorModel}
              </Text>
            </View>
          )}

          {/* Warranty Type */}
          <View style={styles.equipmentItem}>
            <Text style={styles.equipmentLabel}>Warranty Class</Text>
            <Text
              style={[
                styles.equipmentValue,
                isWarrantyCase && { color: "#15803D" },
              ]}
              numberOfLines={1}
            >
              {selectedWarrantyLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── 3. JOB SCOPE CARD (AFTER BRAND & EQUIPMENT) ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="construct-outline" size={15} color="#0F172A" />
            <Text style={styles.cardTitle}>Job Scope</Text>
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

        {/* Customer Reported Problem */}
        {Boolean(workOrder.customer_description) && (
          <View style={styles.complaintBox}>
            <View style={styles.complaintHeader}>
              <Ionicons name="alert-circle-outline" size={13} color="#D97706" />
              <Text style={styles.complaintTitle}>Customer Problem Report</Text>
            </View>
            <Text style={styles.complaintText}>
              {workOrder.customer_description}
            </Text>
          </View>
        )}

        {/* ─── Service Charges to Claim from Customer ─── */}
        <View
          style={[
            styles.claimBox,
            customerClaim.isWarranty ? styles.claimBoxWarranty : styles.claimBoxPaid,
          ]}
        >
          <View style={styles.claimHeader}>
            <View style={styles.claimLabelRow}>
              <Ionicons
                name={customerClaim.isWarranty ? "shield-checkmark" : "cash-outline"}
                size={13}
                color={customerClaim.isWarranty ? "#15803D" : "#0F172A"}
              />
              <Text
                style={[
                  styles.claimLabel,
                  customerClaim.isWarranty && styles.claimLabelWarranty,
                ]}
              >
                Service Charges to Claim
              </Text>
            </View>
            <View
              style={[
                styles.claimBadge,
                customerClaim.isWarranty && styles.claimBadgeWarranty,
              ]}
            >
              <Text
                style={[
                  styles.claimBadgeText,
                  customerClaim.isWarranty && styles.claimBadgeTextWarranty,
                ]}
              >
                {customerClaim.label}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.claimAmount,
              customerClaim.isWarranty && styles.claimAmountWarranty,
            ]}
          >
            {customerClaim.formattedText}
          </Text>

          <Text style={styles.claimNote}>{customerClaim.note}</Text>

          {customerClaim.items.length > 0 && (
            <View style={styles.claimBreakdown}>
              {customerClaim.items.map((it, idx) => (
                <View key={idx} style={styles.claimBreakdownRow}>
                  <Text style={styles.claimBreakdownTitle}>
                    {it.name || it.description || `Charge Item #${idx + 1}`}
                  </Text>
                  <Text style={styles.claimBreakdownPrice}>
                    ₨ {Number(it.amount || 0).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* ─── 4. SERIAL NUMBERS & BARCODE SCAN (3 SCAN FIELDS) ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="barcode-outline" size={15} color="#0F172A" />
            <Text style={styles.cardTitle}>Serial Verification & Scan</Text>
          </View>
          {isWarrantyCase && (
            <View style={styles.warrantyCaseBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.warrantyCaseBadgeText}>Warranty Case</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardSubtitle}>
          Scanning automatically captures barcode digits and attaches the photo to attachments.
        </Text>

        {/* Warranty Status Selector */}
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
            <Ionicons name="chevron-down" size={15} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* 1. Indoor Serial Number Field */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>
              1. Indoor Serial Number {isWarrantyCase && <Text style={styles.requiredStar}>*</Text>}
            </Text>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={onScanIndoor}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={12} color="#0F172A" />
              <Text style={styles.scanBtnText}>Scan & Attach Photo</Text>
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

        {/* 2. Outdoor Serial Number Field (Shown for Split ACs / applicable) */}
        {hasOutdoorUnit && (
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                2. Outdoor Serial Number {isWarrantyCase && <Text style={styles.requiredStar}>*</Text>}
              </Text>
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={onScanOutdoor}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={12} color="#0F172A" />
                <Text style={styles.scanBtnText}>Scan & Attach Photo</Text>
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

        {/* 3. Warranty Card / MO Serial Number Field */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>
              3. Warranty Card / Serial {isWarrantyCase && <Text style={styles.requiredStar}>*</Text>}
            </Text>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={onScanWarranty}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={12} color="#0F172A" />
              <Text style={styles.scanBtnText}>Scan & Attach Photo</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            value={formData.warranty_serial_number || (formData as any).warranty_card_serial || ""}
            onChangeText={(text) => {
              const val = text.toUpperCase();
              setFormData("warranty_serial_number", val);
              setFormData("warranty_card_serial", val);
            }}
            placeholder="e.g. WC-9921448 or MO Number"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />
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
            <Ionicons name="calendar-outline" size={15} color="#64748B" />
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

      {/* ─── 5. TECHNICIAN NOTES & REMARKS CARD (WITH VOICE TYPING & AUTO-SAVE STATUS) ─── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="clipboard-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Technician Remarks & Notes</Text>
          </View>

          {/* Voice Typing Action */}
          {isTranscribing ? (
            <View style={styles.transcribingBadge}>
              <ActivityIndicator size="small" color="#0284C7" />
              <Text style={styles.transcribingText}>Transcribing...</Text>
            </View>
          ) : !isRecordingVoice ? (
            <TouchableOpacity
              style={styles.voiceTypeBtn}
              onPress={startVoiceRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={14} color="#0284C7" />
              <Text style={styles.voiceTypeBtnText}>Voice Type</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Live Audio Recording Bar */}
        {isRecordingVoice && (
          <View style={styles.recordingBar}>
            <View style={styles.recordingLeft}>
              <View style={styles.recordingRedDot} />
              <Text style={styles.recordingTime}>
                Listening ({recordingSeconds}s)...
              </Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity
                style={styles.cancelRecBtn}
                onPress={cancelVoiceRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={styles.cancelRecText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneRecBtn}
                onPress={stopVoiceRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                <Text style={styles.doneRecText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TextInput
          style={[
            styles.textAreaInput,
            (formData.technician_remarks || "").trim().length > 0 &&
              (formData.technician_remarks || "").trim().length < 20 &&
              styles.textAreaInputWarning,
          ]}
          value={formData.technician_remarks}
          onChangeText={(text) => setFormData("technician_remarks", text)}
          placeholder="Enter on-site diagnostic remarks, work performed, or recommendations (or tap Voice Type above)..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Minimum 20 Characters Requirement Indicator */}
        <View style={styles.remarksValidationRow}>
          <View style={styles.remarksValidationLeft}>
            <Ionicons
              name={
                (formData.technician_remarks || "").trim().length >= 20
                  ? "checkmark-circle"
                  : "alert-circle-outline"
              }
              size={13}
              color={
                (formData.technician_remarks || "").trim().length >= 20
                  ? "#059669"
                  : "#DC2626"
              }
            />
            <Text
              style={[
                styles.remarksValidationMsg,
                {
                  color:
                    (formData.technician_remarks || "").trim().length >= 20
                      ? "#059669"
                      : "#DC2626",
                },
              ]}
            >
              {(formData.technician_remarks || "").trim().length >= 20
                ? "Remarks requirement met"
                : "Minimum 20 characters required to complete job"}
            </Text>
          </View>
          <Text
            style={[
              styles.remarksCharCountBadge,
              {
                color:
                  (formData.technician_remarks || "").trim().length >= 20
                    ? "#059669"
                    : "#DC2626",
              },
            ]}
          >
            {(formData.technician_remarks || "").trim().length}/20 chars
          </Text>
        </View>

        {/* Footer: Smooth Auto-save Status + Manual Save Action */}
        <View style={styles.cardFooter}>
          <View style={styles.autoSaveStatusBox}>
            {autoSaveStatus === "saving" && (
              <View style={styles.autoSaveStatusRow}>
                <ActivityIndicator size="small" color="#64748B" />
                <Text style={styles.autoSaveStatusText}>Saving...</Text>
              </View>
            )}
            {autoSaveStatus === "saved" && (
              <View style={styles.autoSaveStatusRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.autoSavedText}>All changes saved</Text>
              </View>
            )}
            {autoSaveStatus === "unsaved" && (
              <Text style={styles.autoSaveUnsavedText}>Unsaved edits</Text>
            )}
          </View>

          {onSave && (
            <TouchableOpacity
              style={[
                styles.saveBtn,
                autoSaveStatus === "saved" && styles.saveBtnSaved,
              ]}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={autoSaveStatus === "saved" ? "checkmark" : "save-outline"}
                    size={15}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveBtnText}>
                    {autoSaveStatus === "saved" ? "Saved" : "Save Details"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── MODAL SHEET FOR WARRANTY TYPE ─── */}
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
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    elevation: 0,
    shadowColor: "transparent",
  },
  rejectionCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    padding: 11,
    elevation: 0,
    shadowColor: "transparent",
    marginBottom: 2,
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rejectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  rejectionTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#DC2626",
    textTransform: "uppercase",
  },
  rejectionBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  rejectionBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#B91C1C",
  },
  rejectionReasonLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 3,
  },
  rejectionReasonBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 8,
    marginBottom: 6,
  },
  rejectionReasonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7F1D1D",
    lineHeight: 16,
  },
  rejectionHelper: {
    fontSize: 10,
    color: "#B91C1C",
    lineHeight: 14,
  },
  cardSubtitle: {
    fontSize: 10.5,
    color: "#64748B",
    marginBottom: 6,
    lineHeight: 14,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  customerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  customerPhone: {
    fontSize: 12,
    color: "#475569",
    marginTop: 1,
  },
  customerExtraPhone: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  areaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  areaPillText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#0284C7",
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  addressText: {
    fontSize: 11.5,
    color: "#475569",
    flex: 1,
    lineHeight: 15,
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginTop: 8,
  },
  actionBtnCall: {
    flex: 1,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 7,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  actionBtnCallText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionBtnWhatsApp: {
    flex: 1,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 7,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  actionBtnWhatsAppText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  actionBtnAltCallFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 6,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionBtnAltCallText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  complaintBox: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 7,
    padding: 8,
    marginBottom: 4,
  },
  complaintHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  complaintTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
    textTransform: "uppercase",
  },
  complaintText: {
    fontSize: 11.5,
    color: "#92400E",
    lineHeight: 16,
  },
  inputGroup: {
    marginTop: 7,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 3,
  },
  requiredStar: {
    color: "#DC2626",
    fontWeight: "700",
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#F1F5F9",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  scanBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0F172A",
  },
  textInput: {
    height: 38,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    paddingHorizontal: 10,
    fontSize: 12.5,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  selector: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },
  selectorText: {
    fontSize: 12.5,
    color: "#0F172A",
  },
  selectorPlaceholder: {
    color: "#94A3B8",
  },
  warrantyCaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  warrantyCaseBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#059669",
  },
  textAreaInput: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  textAreaInputWarning: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FFFBFB",
  },
  remarksValidationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  remarksValidationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  remarksValidationMsg: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  remarksCharCountBadge: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  saveBtnRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0F172A",
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 7,
  },
  saveBtnSaved: {
    backgroundColor: "#059669",
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  voiceTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  voiceTypeBtnText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#0284C7",
  },
  transcribingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  transcribingText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#0284C7",
  },
  recordingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    marginBottom: 8,
  },
  recordingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  recordingRedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#DC2626",
  },
  recordingTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DC2626",
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cancelRecBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  cancelRecText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#EF4444",
  },
  doneRecBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#0F172A",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },
  doneRecText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  autoSaveStatusBox: {
    flex: 1,
    justifyContent: "center",
  },
  autoSaveStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  autoSaveStatusText: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: "500",
  },
  autoSavedText: {
    fontSize: 10.5,
    color: "#10B981",
    fontWeight: "600",
  },
  autoSaveUnsavedText: {
    fontSize: 10.5,
    color: "#94A3B8",
    fontStyle: "italic",
  },

  // ─── Service Charges to Claim Box (Strictly Zero Shadow) ───
  claimBox: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    elevation: 0,
    shadowColor: "transparent",
  },
  claimBoxPaid: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  claimBoxWarranty: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  claimHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  claimLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  claimLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#334155",
  },
  claimLabelWarranty: {
    color: "#15803D",
  },
  claimBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
  },
  claimBadgeWarranty: {
    backgroundColor: "#DCFCE7",
  },
  claimBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#334155",
  },
  claimBadgeTextWarranty: {
    color: "#15803D",
  },
  claimAmount: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  claimAmountWarranty: {
    color: "#15803D",
  },
  claimNote: {
    fontSize: 10.5,
    color: "#64748B",
    lineHeight: 14,
  },
  claimBreakdown: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 3,
  },
  claimBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  claimBreakdownTitle: {
    fontSize: 10.5,
    color: "#475569",
  },
  claimBreakdownPrice: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#0F172A",
  },

  // ─── Brand & Equipment Details (Strictly Zero Shadow) ───
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  brandPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  equipmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  equipmentItem: {
    flexGrow: 1,
    flexBasis: "47%",
    backgroundColor: "#F8FAFC",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  equipmentLabel: {
    fontSize: 9.5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: "#64748B",
    marginBottom: 2,
  },
  equipmentValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
});
