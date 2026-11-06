import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkOrder } from "@/types/work-order";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface SettlementData {
  customer_charged: boolean;
  customer_charged_amount: number;
  customer_charge_remarks: string;
  parts_used: boolean;
  parts_cost: number;
  parts_remarks: string;
  labor_amount: number;
  is_amount_received: boolean;
}

interface WorkOrderCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  onConfirmComplete: (settlementData: SettlementData) => Promise<void>;
  isCompleting: boolean;
}

export default function WorkOrderCompletionModal({
  visible,
  onClose,
  workOrder,
  onConfirmComplete,
  isCompleting,
}: WorkOrderCompletionModalProps) {
  const insets = useSafeAreaInsets();
  const safeModalBottom = useMemo(() => {
    return Math.max(insets.bottom || 0, Platform.OS === "android" ? 24 : 20) + 12;
  }, [insets.bottom]);

  // Step 1: Settlement & Billing | Step 2: Receipt & Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // 1. Did you charge the customer? Default: true (Yes)
  const [customerCharged, setCustomerCharged] = useState<boolean>(true);
  const [customerChargedAmount, setCustomerChargedAmount] = useState<string>("");
  const [customerChargeRemarks, setCustomerChargeRemarks] = useState<string>("");

  // 2. Were parts used? Default: false (No)
  const [partsUsed, setPartsUsed] = useState<boolean>(false);
  const [partsCost, setPartsCost] = useState<string>("");
  const [partsRemarks, setPartsRemarks] = useState<string>("");

  // 3. Did you receive payment? Default: true (Yes)
  const [isAmountReceived, setIsAmountReceived] = useState<boolean>(true);

  // Screenshot / Receipt Ref
  const receiptRef = useRef<View>(null);
  const [isCapturingReceipt, setIsCapturingReceipt] = useState(false);

  // Calculations
  const chargedAmountNum = useMemo(() => {
    if (!customerCharged) return 0;
    const n = parseFloat(customerChargedAmount);
    return isNaN(n) ? 0 : Math.max(0, n);
  }, [customerCharged, customerChargedAmount]);

  const partsCostNum = useMemo(() => {
    if (!partsUsed) return 0;
    const n = parseFloat(partsCost);
    return isNaN(n) ? 0 : Math.max(0, n);
  }, [partsUsed, partsCost]);

  // Automatic Labor Calculation: Math.max(0, charged - parts)
  const calculatedLabor = useMemo(() => {
    return Math.max(0, chargedAmountNum - partsCostNum);
  }, [chargedAmountNum, partsCostNum]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      setCustomerCharged(true);
      setCustomerChargedAmount("");
      setCustomerChargeRemarks("");
      setPartsUsed(false);
      setPartsCost("");
      setPartsRemarks("");
      setIsAmountReceived(true);
    }
  }, [visible]);

  // Validate step 1 before proceeding to step 2 (Receipt)
  const handleProceedToReceipt = () => {
    if (customerCharged) {
      if (chargedAmountNum <= 0) {
        Alert.alert(
          "Amount Required",
          "You selected that the customer was charged. Please enter the charged amount (or select 'No' if free of cost)."
        );
        return;
      }
      if (!customerChargeRemarks.trim()) {
        Alert.alert(
          "Remarks Required",
          "Please enter the reason/purpose for charging the customer (e.g. gas refilling, copper piping, inspection fee)."
        );
        return;
      }
    }

    if (partsUsed) {
      if (partsCostNum <= 0) {
        Alert.alert(
          "Parts Cost Required",
          "You selected that parts were used. Please enter the parts cost amount."
        );
        return;
      }
      if (!partsRemarks.trim()) {
        Alert.alert(
          "Parts Remarks Required",
          "Please enter the description of parts used (e.g. capacitor, fan motor)."
        );
        return;
      }
    }

    setCurrentStep(2);
  };

  // Share or Save Receipt Image
  const handleShareReceipt = async () => {
    try {
      if (!receiptRef.current) return;
      setIsCapturingReceipt(true);
      const uri = await captureRef(receiptRef, {
        format: "png",
        quality: 0.95,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `Receipt - Order #${workOrder.work_order_number || workOrder.id}`,
        });
      } else {
        Alert.alert("Receipt Captured", "Screenshot captured successfully.");
      }
    } catch (err: any) {
      console.error("Capture receipt error:", err);
      Alert.alert(
        "Screenshot Tip",
        "Please take a screenshot of your screen to give to the customer."
      );
    } finally {
      setIsCapturingReceipt(false);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    const settlementData: SettlementData = {
      customer_charged: customerCharged,
      customer_charged_amount: chargedAmountNum,
      customer_charge_remarks: customerCharged ? customerChargeRemarks.trim() : "Free of Cost / Warranty Service",
      parts_used: partsUsed,
      parts_cost: partsCostNum,
      parts_remarks: partsUsed ? partsRemarks.trim() : "",
      labor_amount: calculatedLabor,
      is_amount_received: chargedAmountNum > 0 ? isAmountReceived : true,
    };

    await onConfirmComplete(settlementData);
  };

  const formattedNow = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const brandName =
    workOrder.authorized_brand?.name ||
    workOrder.brand?.name ||
    (workOrder as any).brand_name ||
    "Authorized Service";

  const serviceName =
    workOrder.parent_service?.name ||
    workOrder.service?.name ||
    "Appliance Service & Repair";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isCompleting) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: safeModalBottom }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalHeaderTitle}>
                {currentStep === 1
                  ? "Job Completion & Settlement"
                  : "Customer Receipt & Payment"}
              </Text>
              <Text style={styles.modalHeaderSubtitle}>
                Order #{workOrder.work_order_number || workOrder.id} • Step {currentStep} of 2
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isCompleting}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ══════════════════════════════════════════════════════════
                STEP 1: BILLING, CHARGES & PARTS QUESTIONS
               ══════════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <View style={styles.stepContent}>
                {/* ── QUESTION 1: DID YOU CHARGE THE CUSTOMER? ── */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionQuestion}>
                    1. Did you charge the customer?
                  </Text>
                  <Text style={styles.sectionHint}>
                    (Even in warranty or free service, specify if any charges were collected)
                  </Text>

                  {/* Yes / No Selector (Default Yes) */}
                  <View style={styles.segmentRow}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        customerCharged && styles.segmentBtnActive,
                      ]}
                      onPress={() => setCustomerCharged(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={customerCharged ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={customerCharged ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          customerCharged && styles.segmentBtnTextActive,
                        ]}
                      >
                        Yes, Charged
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        !customerCharged && styles.segmentBtnActiveSecondary,
                      ]}
                      onPress={() => {
                        setCustomerCharged(false);
                        setCustomerChargedAmount("0");
                        setCustomerChargeRemarks("Free of Cost / Warranty Service");
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={!customerCharged ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={!customerCharged ? "#0F172A" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          !customerCharged && styles.segmentBtnTextActiveSecondary,
                        ]}
                      >
                        No (Free / Rs. 0)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* If Charged: Amount & Remarks */}
                  {customerCharged ? (
                    <View style={styles.inputsBlock}>
                      <Text style={styles.inputLabel}>
                        Total Customer Charged Amount (PKR) <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.inputWithPrefix}>
                        <Text style={styles.currencyPrefix}>Rs.</Text>
                        <TextInput
                          style={styles.numericInput}
                          placeholder="e.g. 1500"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={customerChargedAmount}
                          onChangeText={(t) => setCustomerChargedAmount(t.replace(/[^0-9.]/g, ""))}
                        />
                      </View>

                      <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                        Charge Purpose / Details <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInputArea}
                        placeholder="State why customer was charged (e.g. Gas charging, extra copper pipe, inspection fee)..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={3}
                        value={customerChargeRemarks}
                        onChangeText={setCustomerChargeRemarks}
                      />
                    </View>
                  ) : (
                    <View style={styles.freeBadgeBox}>
                      <Ionicons name="shield-checkmark" size={15} color="#059669" />
                      <Text style={styles.freeBadgeText}>
                        Free of Cost / Fully Covered Warranty Service (Rs. 0 to collect)
                      </Text>
                    </View>
                  )}
                </View>

                {/* ── QUESTION 2: WERE PARTS USED? ── */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionQuestion}>
                    2. Were any parts or materials used?
                  </Text>
                  <Text style={styles.sectionHint}>
                    (Check if replacement parts or extra materials were installed)
                  </Text>

                  {/* Yes / No Selector (Default No) */}
                  <View style={styles.segmentRow}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        !partsUsed && styles.segmentBtnActiveSecondary,
                      ]}
                      onPress={() => {
                        setPartsUsed(false);
                        setPartsCost("");
                        setPartsRemarks("");
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={!partsUsed ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={!partsUsed ? "#0F172A" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          !partsUsed && styles.segmentBtnTextActiveSecondary,
                        ]}
                      >
                        No Parts Used
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        partsUsed && styles.segmentBtnActive,
                      ]}
                      onPress={() => setPartsUsed(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={partsUsed ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={partsUsed ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          partsUsed && styles.segmentBtnTextActive,
                        ]}
                      >
                        Yes, Parts Used
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* If Parts Used: Cost & Description */}
                  {partsUsed && (
                    <View style={styles.inputsBlock}>
                      <Text style={styles.inputLabel}>
                        Parts / Material Cost (PKR) <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.inputWithPrefix}>
                        <Text style={styles.currencyPrefix}>Rs.</Text>
                        <TextInput
                          style={styles.numericInput}
                          placeholder="e.g. 800"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={partsCost}
                          onChangeText={(t) => setPartsCost(t.replace(/[^0-9.]/g, ""))}
                        />
                      </View>

                      <Text style={[styles.inputLabel, { marginTop: 10 }]}>
                        Parts Replaced / Installed <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInputArea}
                        placeholder="List parts used (e.g. 45uF Capacitor, Fan Relay, Sensor wire)..."
                        placeholderTextColor="#94A3B8"
                        multiline
                        numberOfLines={2}
                        value={partsRemarks}
                        onChangeText={setPartsRemarks}
                      />
                    </View>
                  )}
                </View>

                {/* ── AUTOMATIC LABOR & BREAKDOWN CARD ── */}
                <View style={styles.calculationCard}>
                  <View style={styles.calcHeader}>
                    <Ionicons name="calculator-outline" size={15} color="#0F172A" />
                    <Text style={styles.calcTitle}>Automatic Settlement Summary</Text>
                  </View>

                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Customer Charged:</Text>
                    <Text style={styles.calcValueBold}>
                      Rs. {chargedAmountNum.toLocaleString()}
                    </Text>
                  </View>

                  {partsUsed && (
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Parts / Material Cost:</Text>
                      <Text style={styles.calcValueDeduct}>
                        - Rs. {partsCostNum.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.calcDivider} />

                  <View style={styles.calcRow}>
                    <View>
                      <Text style={styles.calcLaborLabel}>Calculated Labor / Service:</Text>
                      <Text style={styles.calcLaborSub}>
                        (Customer Total − Parts Cost)
                      </Text>
                    </View>
                    <Text style={styles.calcLaborValue}>
                      Rs. {calculatedLabor.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Continue to Receipt Button */}
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleProceedToReceipt}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionText}>
                    Continue to Customer Receipt
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════════
                STEP 2: CUSTOMER RECEIPT & FINAL PAYMENT CONFIRMATION
               ══════════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <View style={styles.stepContent}>
                {/* Screenshot Hint Banner */}
                <View style={styles.screenshotBanner}>
                  <Ionicons name="camera-outline" size={16} color="#0284C7" />
                  <Text style={styles.screenshotBannerText}>
                    Take a screenshot of this receipt or tap below to share with customer.
                  </Text>
                </View>

                {/* ── DIGITAL RECEIPT CARD (SCREENSHOT READY) ── */}
                <View ref={receiptRef} collapsable={false} style={styles.receiptCard}>
                  {/* Company Header */}
                  <View style={styles.receiptBrandHeader}>
                    <Text style={styles.receiptCompanyTitle}>TASKER COMPANY</Text>
                    <Text style={styles.receiptTypeBadge}>OFFICIAL SERVICE RECEIPT</Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Metadata Row */}
                  <View style={styles.receiptMetaRow}>
                    <View>
                      <Text style={styles.receiptMetaLabel}>WORK ORDER #</Text>
                      <Text style={styles.receiptMetaValue}>
                        {workOrder.work_order_number || workOrder.id}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.receiptMetaLabel}>DATE & TIME</Text>
                      <Text style={styles.receiptMetaValue}>{formattedNow}</Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.receiptBlock}>
                    <Text style={styles.receiptSectionHeader}>CUSTOMER DETAILS</Text>
                    <Text style={styles.receiptCustomerName}>
                      {workOrder.customer?.name || "Valued Customer"}
                    </Text>
                    {Boolean(workOrder.customer?.mobile || workOrder.customer?.phone) && (
                      <Text style={styles.receiptCustomerContact}>
                        {workOrder.customer?.mobile || workOrder.customer?.phone}
                      </Text>
                    )}
                    <Text style={styles.receiptCustomerAddress} numberOfLines={2}>
                      {workOrder.customer_address?.address ||
                        workOrder.address?.address ||
                        "On-site Service"}
                    </Text>
                  </View>

                  {/* Appliance / Service Info */}
                  <View style={styles.receiptBlock}>
                    <Text style={styles.receiptSectionHeader}>EQUIPMENT & SERVICE</Text>
                    <Text style={styles.receiptEquipTitle}>
                      {brandName} • {serviceName}
                    </Text>
                    {Boolean(workOrder.indoor_serial_number) && (
                      <Text style={styles.receiptSerialText}>
                        Serial: {workOrder.indoor_serial_number}
                      </Text>
                    )}
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Itemized Table */}
                  <View style={styles.receiptItemsTable}>
                    <View style={styles.receiptTableHeader}>
                      <Text style={[styles.receiptTableCol1, styles.receiptTableHeadText]}>
                        DESCRIPTION
                      </Text>
                      <Text style={[styles.receiptTableCol2, styles.receiptTableHeadText]}>
                        AMOUNT
                      </Text>
                    </View>

                    {/* Labor row */}
                    <View style={styles.receiptTableRow}>
                      <View style={styles.receiptTableCol1}>
                        <Text style={styles.receiptItemTitle}>Service & Technical Labor</Text>
                        <Text style={styles.receiptItemSub}>Inspection, diagnosis & service</Text>
                      </View>
                      <Text style={styles.receiptTableCol2}>
                        Rs. {calculatedLabor.toLocaleString()}
                      </Text>
                    </View>

                    {/* Parts row (if applicable) */}
                    {partsUsed && (
                      <View style={styles.receiptTableRow}>
                        <View style={styles.receiptTableCol1}>
                          <Text style={styles.receiptItemTitle}>Parts & Materials</Text>
                          <Text style={styles.receiptItemSub}>{partsRemarks}</Text>
                        </View>
                        <Text style={styles.receiptTableCol2}>
                          Rs. {partsCostNum.toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.receiptDashedLine} />

                  {/* Grand Total */}
                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>TOTAL AMOUNT:</Text>
                    <Text style={styles.receiptTotalAmount}>
                      Rs. {chargedAmountNum.toLocaleString()}
                    </Text>
                  </View>

                  {/* Purpose / Remarks */}
                  {Boolean(customerChargeRemarks) && (
                    <View style={styles.receiptRemarksBox}>
                      <Text style={styles.receiptRemarksLabel}>Notes / Purpose:</Text>
                      <Text style={styles.receiptRemarksText}>{customerChargeRemarks}</Text>
                    </View>
                  )}

                  {/* Footer Seal */}
                  <View style={styles.receiptFooterSeal}>
                    <Text style={styles.receiptFooterSealText}>
                      ✓ Verified Tasker Company Technical Service
                    </Text>
                  </View>
                </View>

                {/* Share / Save Receipt Button */}
                <TouchableOpacity
                  style={styles.shareReceiptBtn}
                  onPress={handleShareReceipt}
                  disabled={isCapturingReceipt}
                  activeOpacity={0.8}
                >
                  {isCapturingReceipt ? (
                    <ActivityIndicator size="small" color="#0F172A" />
                  ) : (
                    <>
                      <Ionicons name="share-social-outline" size={15} color="#0F172A" />
                      <Text style={styles.shareReceiptBtnText}>Save / Share Receipt</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* ── QUESTION 3: DID YOU RECEIVE THE MONEY? ── */}
                <View style={styles.paymentReceivedCard}>
                  <Text style={styles.paymentReceivedQuestion}>
                    Did you receive the money from the customer?
                  </Text>
                  <Text style={styles.paymentReceivedSub}>
                    Total to collect: Rs. {chargedAmountNum.toLocaleString()}
                  </Text>

                  <View style={styles.segmentRow}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        isAmountReceived && styles.segmentBtnPaidActive,
                      ]}
                      onPress={() => setIsAmountReceived(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isAmountReceived ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={isAmountReceived ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          isAmountReceived && styles.segmentBtnTextActive,
                        ]}
                      >
                        Yes, Money Received
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        !isAmountReceived && styles.segmentBtnUnpaidActive,
                      ]}
                      onPress={() => setIsAmountReceived(false)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={!isAmountReceived ? "alert-circle" : "ellipse-outline"}
                        size={16}
                        color={!isAmountReceived ? "#FFFFFF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.segmentBtnText,
                          !isAmountReceived && styles.segmentBtnTextActive,
                        ]}
                      >
                        No, Payment Pending
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons: Back + Final Complete */}
                <View style={styles.finalActionsRow}>
                  <TouchableOpacity
                    style={styles.backToEditBtn}
                    onPress={() => setCurrentStep(1)}
                    disabled={isCompleting}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={15} color="#0F172A" />
                    <Text style={styles.backToEditText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.finalSubmitBtn}
                    onPress={handleFinalSubmit}
                    disabled={isCompleting}
                    activeOpacity={0.85}
                  >
                    {isCompleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={17} color="#FFFFFF" />
                        <Text style={styles.finalSubmitText}>
                          Confirm & Complete Job
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "92%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    elevation: 0,
    shadowColor: "transparent",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalHeaderSubtitle: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  stepContent: {
    gap: 12,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    elevation: 0,
    shadowColor: "transparent",
  },
  sectionQuestion: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionHint: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  segmentBtnActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  segmentBtnActiveSecondary: {
    backgroundColor: "#F1F5F9",
    borderColor: "#94A3B8",
  },
  segmentBtnPaidActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  segmentBtnUnpaidActive: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  segmentBtnText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#475569",
  },
  segmentBtnTextActive: {
    color: "#FFFFFF",
  },
  segmentBtnTextActiveSecondary: {
    color: "#0F172A",
  },
  inputsBlock: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  requiredStar: {
    color: "#EF4444",
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    paddingHorizontal: 10,
  },
  currencyPrefix: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginRight: 6,
  },
  numericInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  textInputArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    padding: 9,
    fontSize: 12.5,
    color: "#0F172A",
    textAlignVertical: "top",
    minHeight: 65,
  },
  freeBadgeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 7,
    padding: 8,
    marginTop: 10,
  },
  freeBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#065F46",
    flex: 1,
  },
  calculationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    elevation: 0,
    shadowColor: "transparent",
  },
  calcHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  calcTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  calcValueBold: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  calcValueDeduct: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#DC2626",
  },
  calcDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 6,
  },
  calcLaborLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  calcLaborSub: {
    fontSize: 10,
    color: "#64748B",
  },
  calcLaborValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    borderRadius: 9,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryActionText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  screenshotBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  screenshotBannerText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#0369A1",
    flex: 1,
  },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 14,
    elevation: 0,
    shadowColor: "transparent",
  },
  receiptBrandHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  receiptCompanyTitle: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#0F172A",
  },
  receiptTypeBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  receiptDashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    borderStyle: "dashed",
    marginVertical: 8,
  },
  receiptMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  receiptMetaLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  receiptMetaValue: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  receiptBlock: {
    marginTop: 6,
    paddingVertical: 4,
  },
  receiptSectionHeader: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  receiptCustomerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  receiptCustomerContact: {
    fontSize: 11,
    color: "#475569",
    marginTop: 1,
  },
  receiptCustomerAddress: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1,
  },
  receiptEquipTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  receiptSerialText: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 1,
  },
  receiptItemsTable: {
    marginVertical: 4,
  },
  receiptTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  receiptTableHeadText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
  },
  receiptTableCol1: {
    flex: 1,
  },
  receiptTableCol2: {
    width: 85,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  receiptTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  receiptItemTitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#0F172A",
  },
  receiptItemSub: {
    fontSize: 10,
    color: "#64748B",
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  receiptTotalAmount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#059669",
  },
  receiptRemarksBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    padding: 7,
    marginTop: 6,
  },
  receiptRemarksLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
  },
  receiptRemarksText: {
    fontSize: 11,
    color: "#334155",
    marginTop: 2,
  },
  receiptFooterSeal: {
    alignItems: "center",
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  receiptFooterSealText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
  },
  shareReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingVertical: 9,
  },
  shareReceiptBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  paymentReceivedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  paymentReceivedQuestion: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  paymentReceivedSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 8,
  },
  finalActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  backToEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backToEditText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#0F172A",
  },
  finalSubmitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
  },
  finalSubmitText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
