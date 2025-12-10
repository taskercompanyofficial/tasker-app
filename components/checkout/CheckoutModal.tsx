import AddAddressForm from '@/components/home/AddAddressForm'
import OrderSuccessModal from '@/components/orders/OrderSuccessModal'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import { useForm } from '@/hooks/useForm'
import { ADDRESS_URL, ORDER_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'

interface CheckoutItem {
    serviceId: number
    serviceName: string
    quantity: number
    price: number
    discount: number
    discountType: string
}

interface CheckoutModalProps {
    visible: boolean
    onClose: () => void
    items: CheckoutItem[]
    totalAmount: number
}

interface Address {
    id: number
    customer_id: number
    address_type: 'home' | 'office' | 'other'
    area_type: 'residential' | 'commercial' | 'industrial' | 'other'
    address_line_1: string
    address_line_2: string | null
    city: string
    state: string
    zip_code: string
    country: string
    latitude: number | null
    longitude: number | null
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
}

const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: 'cash' },
    { id: 'card', name: 'Card', icon: 'card' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet' },
]

// Working hours: 9 AM to 6 PM
const WORKING_HOURS_START = 9
const WORKING_HOURS_END = 18

export default function CheckoutModal({ visible, onClose, items, totalAmount }: CheckoutModalProps) {
    const { session } = useSession()
    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedAddress, setSelectedAddress] = useState<number | null>(null)
    const [selectedPayment, setSelectedPayment] = useState<string>('cash')
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')

    const { formData, handleChange, handleSubmit, loading } = useForm({
        initialValues: {
            scheduledDate: new Date(),
            scheduledTime: (() => {
                const now = new Date()
                const hour = now.getHours()
                // If outside working hours, set to 9 AM
                if (hour < WORKING_HOURS_START || hour >= WORKING_HOURS_END) {
                    now.setHours(WORKING_HOURS_START, 0, 0, 0)
                }
                return now
            })(),
            notes: '',
        },
        onSubmit: async (values) => {
            if (!selectedAddress) {
                Alert.alert('Error', 'Please select a service address')
                return
            }

            const orderData = {
                customer_id: session.user?.id,
                customer_address_id: selectedAddress,
                payment_method: selectedPayment,
                notes: values.notes,
                items: items.map(item => ({
                    parent_service_id: item.serviceId,
                    quantity: item.quantity,
                    unit_price: item.price,
                    discount: item.discount,
                    discount_type: item.discountType,
                    scheduled_date: values.scheduledDate.toISOString().split('T')[0],
                    scheduled_time: values.scheduledTime.toTimeString().split(' ')[0],
                })),
            }

            try {
                const response = await myAxios.post(ORDER_URL, orderData)

                if (response.data.status === 'success') {
                    setOrderNumber(response.data.data.order_number)
                    onClose()
                    setShowSuccessModal(true)
                }
            } catch (error: any) {
                Alert.alert(
                    'Error',
                    error.response?.data?.message || 'Failed to create order. Please try again.'
                )
            }
        },
    })

    const fetchAddresses = async () => {
        try {
            const res = await myAxios.get(ADDRESS_URL + `?customer_id=${session.user?.id}`)
            const fetchedAddresses: Address[] = res.data.data || []
            setAddresses(fetchedAddresses)
            if (fetchedAddresses.length > 0 && !selectedAddress) {
                setSelectedAddress(fetchedAddresses[0].id)
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error)
        }
    }

    useEffect(() => {
        if (visible) {
            fetchAddresses()
        }
    }, [visible])

    const handleSaveAddress = () => {
        fetchAddresses()
        setShowAddressForm(false)
    }

    const validateTime = (time: Date): Date => {
        const hour = time.getHours()
        const validatedTime = new Date(time)

        if (hour < WORKING_HOURS_START) {
            validatedTime.setHours(WORKING_HOURS_START, 0, 0, 0)
        } else if (hour >= WORKING_HOURS_END) {
            validatedTime.setHours(WORKING_HOURS_END - 1, 0, 0, 0)
        }

        return validatedTime
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Checkout</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={22} color={Colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            {/* Service Overview */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Services ({items.length})</Text>
                                {items.map((item, index) => {
                                    const discountedPrice = item.discountType === 'percentage'
                                        ? item.price * (1 - item.discount / 100)
                                        : item.price - item.discount
                                    return (
                                        <View key={index} style={styles.serviceItem}>
                                            <View style={styles.serviceInfo}>
                                                <Text style={styles.serviceName}>{item.serviceName}</Text>
                                                <Text style={styles.serviceQuantity}>Qty: {item.quantity}</Text>
                                            </View>
                                            <Text style={styles.servicePrice}>₨{Math.round(discountedPrice * item.quantity)}</Text>
                                        </View>
                                    )
                                })}
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalAmount}>₨{Math.round(totalAmount)}</Text>
                                </View>
                            </View>

                            {/* Address Selection */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Service Address</Text>
                                {addresses.length > 0 ? (
                                    <>
                                        {addresses.map((address) => (
                                            <TouchableOpacity
                                                key={address.id}
                                                style={[
                                                    styles.addressCard,
                                                    selectedAddress === address.id && styles.addressCardSelected
                                                ]}
                                                onPress={() => setSelectedAddress(address.id)}
                                            >
                                                <View style={styles.addressHeader}>
                                                    <View style={styles.addressLabelContainer}>
                                                        <Ionicons
                                                            name={address.address_type === 'home' ? 'home' : address.address_type === 'office' ? 'briefcase' : 'location'}
                                                            size={16}
                                                            color={selectedAddress === address.id ? Colors.primary.main : Colors.text.secondary}
                                                        />
                                                        <Text style={[
                                                            styles.addressLabel,
                                                            selectedAddress === address.id && styles.addressLabelSelected
                                                        ]}>
                                                            {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}
                                                        </Text>
                                                    </View>
                                                    <View style={[
                                                        styles.radioButton,
                                                        selectedAddress === address.id && styles.radioButtonSelected
                                                    ]}>
                                                        {selectedAddress === address.id && (
                                                            <View style={styles.radioButtonInner} />
                                                        )}
                                                    </View>
                                                </View>
                                                <Text style={styles.addressText}>{address.address_line_1}</Text>
                                                <Text style={styles.addressText}>{address.city}, {address.state} {address.zip_code}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            style={styles.addAddressButton}
                                            onPress={() => setShowAddressForm(true)}
                                        >
                                            <Ionicons name="add-circle" size={16} color={Colors.primary.main} />
                                            <Text style={styles.addAddressText}>Add New Address</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.emptyAddressButton}
                                        onPress={() => setShowAddressForm(true)}
                                    >
                                        <Ionicons name="location-outline" size={32} color={Colors.text.tertiary} />
                                        <Text style={styles.emptyAddressText}>No addresses found</Text>
                                        <Text style={styles.addAddressText}>Add New Address</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Schedule */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Schedule</Text>
                                <Text style={styles.workingHoursText}>Working hours: 9:00 AM - 6:00 PM</Text>
                                <View style={styles.scheduleRow}>
                                    <TouchableOpacity
                                        style={styles.scheduleButton}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Ionicons name="calendar" size={18} color={Colors.primary.main} />
                                        <View style={styles.scheduleInfo}>
                                            <Text style={styles.scheduleLabel}>Date</Text>
                                            <Text style={styles.scheduleValue}>{formatDate(formData.scheduledDate)}</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.scheduleButton}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <Ionicons name="time" size={18} color={Colors.primary.main} />
                                        <View style={styles.scheduleInfo}>
                                            <Text style={styles.scheduleLabel}>Time</Text>
                                            <Text style={styles.scheduleValue}>{formatTime(formData.scheduledTime)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={formData.scheduledDate}
                                        mode="date"
                                        display="default"
                                        minimumDate={new Date()}
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(Platform.OS === 'ios')
                                            if (selectedDate) {
                                                handleChange('scheduledDate', selectedDate)
                                            }
                                        }}
                                    />
                                )}

                                {showTimePicker && (
                                    <DateTimePicker
                                        value={formData.scheduledTime}
                                        mode="time"
                                        display="default"
                                        onChange={(event, selectedTime) => {
                                            setShowTimePicker(Platform.OS === 'ios')
                                            if (selectedTime) {
                                                const validatedTime = validateTime(selectedTime)
                                                handleChange('scheduledTime', validatedTime)
                                            }
                                        }}
                                    />
                                )}
                            </View>

                            {/* Notes */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Notes (Optional)</Text>
                                <TextInput
                                    style={styles.notesInput}
                                    placeholder="Special instructions..."
                                    placeholderTextColor={Colors.text.tertiary}
                                    multiline
                                    numberOfLines={3}
                                    value={formData.notes}
                                    onChangeText={(text) => handleChange('notes', text)}
                                />
                            </View>

                            {/* Payment Method */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Payment</Text>
                                {paymentMethods.map((method) => (
                                    <TouchableOpacity
                                        key={method.id}
                                        style={[
                                            styles.paymentCard,
                                            selectedPayment === method.id && styles.paymentCardSelected
                                        ]}
                                        onPress={() => setSelectedPayment(method.id)}
                                    >
                                        <View style={styles.paymentInfo}>
                                            <Ionicons
                                                name={method.icon as any}
                                                size={20}
                                                color={selectedPayment === method.id ? Colors.primary.main : Colors.text.secondary}
                                            />
                                            <Text style={[
                                                styles.paymentName,
                                                selectedPayment === method.id && styles.paymentNameSelected
                                            ]}>
                                                {method.name}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.radioButton,
                                            selectedPayment === method.id && styles.radioButtonSelected
                                        ]}>
                                            {selectedPayment === method.id && (
                                                <View style={styles.radioButtonInner} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <View style={styles.footerTotal}>
                                <Text style={styles.footerTotalLabel}>Total</Text>
                                <Text style={styles.footerTotalAmount}>₨{Math.round(totalAmount)}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading || !selectedAddress}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {loading ? 'Processing...' : 'Confirm Booking'}
                                </Text>
                                {!loading && <Ionicons name="checkmark-circle" size={18} color={Colors.neutral.white} />}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Address Form */}
            <AddAddressForm
                visible={showAddressForm}
                onClose={() => setShowAddressForm(false)}
                onSave={handleSaveAddress}
                customer_id={session.user?.id}
            />

            {/* Success Modal */}
            <OrderSuccessModal
                visible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                orderNumber={orderNumber}
            />
        </>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Colors.neutral.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        maxHeight: '70%',
    },
    section: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    serviceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    serviceQuantity: {
        fontSize: 11,
        color: Colors.text.secondary,
    },
    servicePrice: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.xs,
        paddingTop: Spacing.xs,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary.main,
    },
    addressCard: {
        backgroundColor: Colors.neutral.gray[50],
        borderRadius: 10,
        padding: Spacing.sm,
        marginBottom: Spacing.xs,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    addressCardSelected: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.primary.main + '08',
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    addressLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    addressLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    addressLabelSelected: {
        color: Colors.primary.main,
    },
    addressText: {
        fontSize: 11,
        color: Colors.text.secondary,
        lineHeight: 16,
    },
    radioButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: Colors.neutral.gray[300],
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: Colors.primary.main,
    },
    radioButtonInner: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: Colors.primary.main,
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: Spacing.xs,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary.main,
        borderStyle: 'dashed',
    },
    addAddressText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary.main,
    },
    emptyAddressButton: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: 10,
        backgroundColor: Colors.neutral.gray[50],
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderStyle: 'dashed',
    },
    emptyAddressText: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    scheduleRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    scheduleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[50],
        padding: Spacing.sm,
        borderRadius: 10,
        gap: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    scheduleInfo: {
        flex: 1,
    },
    scheduleLabel: {
        fontSize: 10,
        color: Colors.text.tertiary,
        marginBottom: 2,
    },
    scheduleValue: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    workingHoursText: {
        fontSize: 10,
        color: Colors.text.tertiary,
        marginBottom: Spacing.xs,
        fontStyle: 'italic',
    },
    notesInput: {
        backgroundColor: Colors.neutral.gray[50],
        borderRadius: 10,
        padding: Spacing.sm,
        fontSize: 12,
        color: Colors.text.primary,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.border.light,
        minHeight: 70,
    },
    paymentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[50],
        borderRadius: 10,
        padding: Spacing.sm,
        marginBottom: Spacing.xs,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    paymentCardSelected: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.primary.main + '08',
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    paymentName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    paymentNameSelected: {
        color: Colors.primary.main,
    },
    footer: {
        padding: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
    },
    footerTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    footerTotalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    footerTotalAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary.main,
        paddingVertical: 13,
        borderRadius: 10,
        gap: 6,
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonDisabled: {
        opacity: 0.6,
    },
    confirmButtonText: {
        color: Colors.neutral.white,
        fontSize: 14,
        fontWeight: '700',
    },
})
