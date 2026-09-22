import AddressSelector, { Address, AddressSelectorRef } from "@/components/AddressSelector";
import AddressDetailsModal from "@/components/checkout/AddressDetailsModal";
import ConfirmOrderModal from "@/components/checkout/ConfirmOrderModal";
import AddAddressForm from "@/components/home/AddAddressForm";
import OrderSuccessModal from "@/components/orders/OrderSuccessModal";
import Colors from "@/constants/Colors";
import { Spacing } from "@/constants/Styles";
import { useSession } from "@/context/ctx";
import { useCheckout, PaymentMethodId, CheckoutItem } from "@/hooks/useCheckout";
import { compressAndSquare } from "@/lib/image";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useImperativeHandle, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface CheckoutModalProps {
  items: CheckoutItem[];
  totalAmount: number;
}

type IoniconName = keyof typeof Ionicons.glyphMap;

const paymentMethods: { id: PaymentMethodId; name: string; subtitle: string; icon: IoniconName }[] =
  [
    { id: "cash", name: "Cash on Delivery", subtitle: "Pay after service is done", icon: "cash-outline" },
    { id: "card", name: "Card Payment", subtitle: "Debit / Credit Card", icon: "card-outline" },
    { id: "wallet", name: "Tasker Wallet", subtitle: "Pay from your balance", icon: "wallet-outline" },
    { id: "online", name: "Online Transfer", subtitle: "Bank / Instant Transfer", icon: "globe-outline" },
  ];

// Working hours: 9 AM to 6 PM
const WORKING_HOURS_START = 9;
const WORKING_HOURS_END = 18;

export default React.forwardRef<BottomSheetModal, CheckoutModalProps>(
  function CheckoutModal({
    items,
    totalAmount,
  }, ref) {
    const insets = useSafeAreaInsets();
    const internalRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => {
      return {
        present: () => internalRef.current?.present(),
        dismiss: () => internalRef.current?.dismiss(),
      } as unknown as BottomSheetModal;
    });

    const addressSelectorRef = useRef<AddressSelectorRef>(null);
    const addAddressModalRef = useRef<BottomSheetModal>(null);

    const [detailsAddress, setDetailsAddress] = useState<Address | null>(null);
    const { session } = useSession();

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");

    const {
      scheduledDate,
      setScheduledDate,
      scheduledTime,
      setScheduledTime,
      paymentMethod,
      setPaymentMethod,
      customerName,
      setCustomerName,
      customerPhone,
      setCustomerPhone,
      notes,
      setNotes,
      reminderOption,
      setReminderOption,
      attachments,
      setAttachments,
      addressId,
      setAddressId,
      processing,
      submit,
    } = useCheckout(items);

    // Initial pre-fill from session user
    React.useEffect(() => {
      if (session?.user) {
        if (!customerName) {
          const userName = session.user.name;
          if (userName && !/^cus[A-Z0-9]{4,20}$/i.test(userName) && userName !== "Customer") {
            setCustomerName(userName);
          }
        }
        if (!customerPhone) {
          setCustomerPhone(session.user.phone || "");
        }
      }
    }, [session?.user]);

    const handlePickImage = async () => {
      try {
        if (Platform.OS !== "android") {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Toast.show({
              type: "error",
              text1: "Permission Required",
              text2: "Gallery permission is required to attach photos.",
            });
            return;
          }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          let uri = result.assets[0].uri;
          try {
            uri = await compressAndSquare(uri, 800, 0.85);
          } catch {
            // fallback to original uri
          }

          const filename = uri.split("/").pop() || `attachment_${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";

          setAttachments((prev) => [
            ...prev,
            {
              uri,
              name: filename,
              type,
            },
          ]);
        }
      } catch (err) {
        console.error("Image pick error:", err);
      }
    };

    const removeAttachment = (index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleConfirmBookingClick = () => {
      if (!addressId) {
        Alert.alert("Missing Address", "Please select a service address to continue.");
        return;
      }
      if (!customerName.trim()) {
        Alert.alert("Missing Name", "Please provide your contact name.");
        return;
      }
      if (!customerPhone.trim()) {
        Alert.alert("Missing Phone", "Please provide your contact phone number.");
        return;
      }
      setShowConfirmModal(true);
    };

    const handlePlaceOrder = async () => {
      setShowConfirmModal(false);

      const result = await submit();
      if (result.ok) {
        setOrderNumber(result.workOrderNumber || "");
        internalRef.current?.dismiss();
        setShowSuccessModal(true);
        return;
      }
      Alert.alert("Booking Error", result.message || "Failed to create order. Please try again.");
    };

    const validateTime = (time: Date): Date => {
      const hour = time.getHours();
      const validatedTime = new Date(time);

      if (hour < WORKING_HOURS_START) {
        validatedTime.setHours(WORKING_HOURS_START, 0, 0, 0);
      } else if (hour >= WORKING_HOURS_END) {
        validatedTime.setHours(WORKING_HOURS_END - 1, 0, 0, 0);
      }

      return validatedTime;
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
        />
      ),
      []
    );

    const handleClose = () => {
      internalRef.current?.dismiss();
    };

    return (
      <>
        <BottomSheetModal
          ref={internalRef}
          snapPoints={["92%"]}
          backdropComponent={renderBackdrop}
          index={0}
          enablePanDownToClose
          enableDynamicSizing={false}
          keyboardBlurBehavior="restore"
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Checkout</Text>
                <Text style={styles.headerSubtitle}>Review details & schedule booking</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <BottomSheetScrollView
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: Spacing.xl + 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Contact Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.text.tertiary}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="e.g. 03001234567"
                    placeholderTextColor={Colors.text.tertiary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Service Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Selected Services ({items.length})
                </Text>
                {items.map((item, index) => {
                  const discountedPrice =
                    item.discountType === "percentage"
                      ? item.price * (1 - item.discount / 100)
                      : item.price - item.discount;
                  return (
                    <View key={index} style={styles.serviceItem}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>
                          {item.serviceName}
                        </Text>
                        <Text style={styles.serviceQuantity}>
                          Qty: {item.quantity} × ₨{Math.round(discountedPrice)}
                        </Text>
                      </View>
                      <Text style={styles.servicePrice}>
                        ₨{Math.round(discountedPrice * item.quantity)}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Estimated Cost</Text>
                  <Text style={styles.totalAmount}>
                    ₨{Math.round(totalAmount)}
                  </Text>
                </View>
              </View>

              {/* Address Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service Location</Text>
                <AddressSelector
                  ref={addressSelectorRef}
                  selectedAddressId={addressId}
                  onSelectAddress={setAddressId}
                  onAddNewAddress={() => addAddressModalRef.current?.present()}
                  onViewDetails={(addr) => setDetailsAddress(addr)}
                  error={
                    processing && !addressId
                      ? "Please select a service address"
                      : undefined
                  }
                />
              </View>

              {/* Schedule */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Schedule & Timing</Text>
                <Text style={styles.workingHoursText}>
                  Operating hours: 9:00 AM - 6:00 PM
                </Text>

                {/* Quick Date Shortcuts */}
                <View style={{ flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.sm }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 8, backgroundColor: Colors.neutral.gray[100], borderRadius: 8, alignItems: "center" }}
                    onPress={() => {
                      const d = new Date();
                      setScheduledDate(d);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.text.primary }}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 8, backgroundColor: Colors.neutral.gray[100], borderRadius: 8, alignItems: "center" }}
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setScheduledDate(d);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.text.primary }}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 8, backgroundColor: Colors.neutral.gray[100], borderRadius: 8, alignItems: "center" }}
                    onPress={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 2);
                      setScheduledDate(d);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.text.primary }}>In 2 Days</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.scheduleRow}>
                  <TouchableOpacity
                    style={styles.scheduleButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.scheduleIconCircle}>
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={Colors.themes.customer.primary}
                      />
                    </View>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleLabel}>Date</Text>
                      <Text style={styles.scheduleValue}>
                        {formatDate(scheduledDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.scheduleButton}
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.scheduleIconCircle}>
                      <Ionicons
                        name="time"
                        size={20}
                        color={Colors.themes.customer.primary}
                      />
                    </View>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleLabel}>Time</Text>
                      <Text style={styles.scheduleValue}>
                        {formatTime(scheduledTime)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Service Reminder Options */}
                <View style={{ marginTop: Spacing.md }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.text.primary, marginBottom: 6 }}>
                    Service Reminder Alert
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {[
                      { id: "30m", label: "30 mins before" },
                      { id: "1h", label: "1 hour before" },
                      { id: "2h", label: "2 hours before" },
                      { id: "1d", label: "1 day before" },
                      { id: "off", label: "Off" },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 16,
                          backgroundColor: reminderOption === opt.id ? Colors.themes.customer.primary + "15" : Colors.neutral.gray[100],
                          borderWidth: 1,
                          borderColor: reminderOption === opt.id ? Colors.themes.customer.primary : "transparent",
                        }}
                        onPress={() => setReminderOption(opt.id)}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: reminderOption === opt.id ? Colors.themes.customer.primary : Colors.text.secondary,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Attachments Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Problem Photos & Attachments (Optional)</Text>
                <Text style={styles.sectionSubtitle}>
                  Add photos of the issue or requirement to help our technicians prepare.
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md, marginTop: Spacing.sm }}>
                  {attachments.map((item, index) => {
                    const uri = typeof item === "string" ? item : item.uri;
                    return (
                      <View key={index} style={styles.attachmentContainer}>
                        <Image source={{ uri }} style={styles.attachmentImage} />
                        <TouchableOpacity
                          style={styles.attachmentRemoveBtn}
                          onPress={() => removeAttachment(index)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="close" size={14} color={Colors.neutral.white} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.addAttachmentBtn}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={26} color={Colors.text.tertiary} />
                    <Text style={styles.addAttachmentText}>Add Photo</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Special Instructions Notes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="e.g. Please call before arrival, gate code, etc."
                  placeholderTextColor={Colors.text.tertiary}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Payment Method */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.paymentColumn}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentCard,
                        paymentMethod === method.id && styles.paymentCardSelected,
                      ]}
                      onPress={() => setPaymentMethod(method.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.paymentIconCircle,
                          paymentMethod === method.id && styles.paymentIconCircleSelected,
                        ]}
                      >
                        <Ionicons
                          name={method.icon}
                          size={22}
                          color={
                            paymentMethod === method.id
                              ? Colors.themes.customer.primary
                              : Colors.text.secondary
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.paymentName,
                            paymentMethod === method.id && styles.paymentNameSelected,
                          ]}
                        >
                          {method.name}
                        </Text>
                        <Text style={styles.paymentSubtext}>{method.subtitle}</Text>
                      </View>
                      <Ionicons
                        name={
                          paymentMethod === method.id
                            ? "radio-button-on"
                            : "radio-button-off"
                        }
                        size={20}
                        color={
                          paymentMethod === method.id
                            ? Colors.themes.customer.primary
                            : "#D1D5DB"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </BottomSheetScrollView>

            {/* Sticky Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
              <View style={styles.footerTotal}>
                <Text style={styles.footerTotalLabel}>Total Amount</Text>
                <Text style={styles.footerTotalAmount}>
                  ₨{Math.round(totalAmount)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  processing && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirmBookingClick}
                disabled={processing}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmButtonText}>
                  {processing ? "Processing..." : "Confirm Booking"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.neutral.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetModal>

        {/* Android Date Picker */}
        {Platform.OS === "android" && showDatePicker && (
          <DateTimePicker
            value={scheduledDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(_event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setScheduledDate(selectedDate);
              }
            }}
          />
        )}

        {/* Android Time Picker */}
        {Platform.OS === "android" && showTimePicker && (
          <DateTimePicker
            value={scheduledTime}
            mode="time"
            display="default"
            onChange={(_event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                setScheduledTime(validateTime(selectedTime));
              }
            }}
          />
        )}

        {/* iOS Date Picker Modal */}
        {Platform.OS === "ios" && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.iosModalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.iosPickerHeaderBtn}
                  >
                    <Text style={styles.iosPickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosPickerTitle}>Select Service Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.iosPickerHeaderBtn}
                  >
                    <Text style={styles.iosPickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={scheduledDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  textColor="#18181B"
                  onChange={(_event, selectedDate) => {
                    if (selectedDate) setScheduledDate(selectedDate);
                  }}
                  style={styles.iosDateTimePicker}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* iOS Time Picker Modal */}
        {Platform.OS === "ios" && (
          <Modal
            visible={showTimePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <TouchableOpacity
              style={styles.iosModalOverlay}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            >
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(false)}
                    style={styles.iosPickerHeaderBtn}
                  >
                    <Text style={styles.iosPickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosPickerTitle}>Select Service Time</Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(false)}
                    style={styles.iosPickerHeaderBtn}
                  >
                    <Text style={styles.iosPickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={scheduledTime}
                  mode="time"
                  display="spinner"
                  textColor="#18181B"
                  onChange={(_event, selectedTime) => {
                    if (selectedTime) setScheduledTime(validateTime(selectedTime));
                  }}
                  style={styles.iosDateTimePicker}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Modals outside BottomSheetScrollView */}
        <OrderSuccessModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          orderNumber={orderNumber}
          totalAmount={totalAmount}
          customerName={customerName}
          customerPhone={customerPhone}
          addressText={
            (() => {
              const addr = addressSelectorRef.current?.getAddress(addressId);
              return addr ? `${addr.address_line_1}, ${addr.city}` : undefined;
            })()
          }
          scheduledDate={formatDate(scheduledDate)}
          scheduledTime={formatTime(scheduledTime)}
          paymentMethod={paymentMethod}
          itemsCount={items.length}
        />

        <AddAddressForm
          ref={addAddressModalRef}
          onSave={() => addressSelectorRef.current?.refresh()}
          customer_id={session?.user?.id}
        />

        <AddressDetailsModal
          visible={!!detailsAddress}
          onClose={() => setDetailsAddress(null)}
          address={detailsAddress}
        />

        <ConfirmOrderModal
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onSubmit={handlePlaceOrder}
          processing={processing}
          totalAmount={totalAmount}
          itemsCount={items.length}
          scheduledDate={scheduledDate}
          scheduledTime={scheduledTime}
          address={addressSelectorRef.current?.getAddress(addressId) || null}
          customerName={customerName}
          customerPhone={customerPhone}
          paymentMethod={paymentMethod}
          attachmentsCount={attachments.length}
          notes={notes}
        />
      </>
    );
  }
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginTop: Spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.gray[50],
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    color: Colors.text.primary,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  serviceQuantity: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
  },
  workingHoursText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.neutral.gray[50],
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  scheduleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.themes.customer.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  scheduleValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: 2,
  },
  attachmentContainer: {
    position: "relative",
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: "hidden",
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  attachmentRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  addAttachmentBtn: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.neutral.gray[50],
  },
  addAttachmentText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text.secondary,
    marginTop: 4,
  },
  notesInput: {
    minHeight: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.gray[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 13,
    color: Colors.text.primary,
    textAlignVertical: "top",
  },
  paymentColumn: {
    gap: Spacing.xs,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.neutral.gray[50],
  },
  paymentCardSelected: {
    borderColor: Colors.themes.customer.primary,
    backgroundColor: "#FEF9EB",
  },
  paymentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  paymentIconCircleSelected: {
    backgroundColor: Colors.themes.customer.primary + "20",
  },
  paymentName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  paymentNameSelected: {
    color: Colors.themes.customer.primaryDark,
  },
  paymentSubtext: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.neutral.white,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  footerTotalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.themes.customer.primary,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.themes.customer.primary,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  iosPickerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iosPickerHeaderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iosPickerCancelText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#18181B",
  },
  iosPickerDoneText: {
    fontSize: 15,
    color: Colors.themes.customer.primary,
    fontWeight: "700",
  },
  iosDateTimePicker: {
    height: 200,
  },
});
