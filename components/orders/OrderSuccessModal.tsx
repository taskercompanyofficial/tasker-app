import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface OrderSuccessModalProps {
    visible: boolean
    onClose: () => void
    orderNumber: string
}

export default function OrderSuccessModal({ visible, onClose, orderNumber }: OrderSuccessModalProps) {
    const handleViewOrder = () => {
        onClose()
        router.push(`/orders/${orderNumber}`)
    }

    const handleBookMore = () => {
        onClose()
        router.push('/(tabs)')
    }

    const handleGoHome = () => {
        onClose()
        router.push('/')
    }

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="checkmark" size={48} color={Colors.neutral.white} />
                        </View>
                    </View>

                    {/* Success Message */}
                    <Text style={styles.title}>Booking Confirmed!</Text>
                    <Text style={styles.message}>
                        Your service has been successfully booked.
                    </Text>

                    {/* Order Number */}
                    <View style={styles.orderNumberContainer}>
                        <Text style={styles.orderNumberLabel}>Order Number</Text>
                        <Text style={styles.orderNumber}>{orderNumber}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleViewOrder}
                        >
                            <Ionicons name="receipt-outline" size={20} color={Colors.neutral.white} />
                            <Text style={styles.primaryButtonText}>View Order</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleBookMore}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={Colors.primary.main} />
                            <Text style={styles.secondaryButtonText}>Book More Services</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.tertiaryButton}
                            onPress={handleGoHome}
                        >
                            <Text style={styles.tertiaryButtonText}>Go to Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    container: {
        backgroundColor: Colors.neutral.white,
        borderRadius: 20,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: Spacing.lg,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: Spacing.lg,
        lineHeight: 20,
    },
    orderNumberContainer: {
        backgroundColor: Colors.neutral.gray[50],
        borderRadius: 12,
        padding: Spacing.md,
        width: '100%',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    orderNumberLabel: {
        fontSize: 11,
        color: Colors.text.tertiary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary.main,
    },
    buttonsContainer: {
        width: '100%',
        gap: Spacing.sm,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary.main,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: Colors.neutral.white,
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.neutral.white,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        borderWidth: 2,
        borderColor: Colors.primary.main,
    },
    secondaryButtonText: {
        color: Colors.primary.main,
        fontSize: 15,
        fontWeight: '700',
    },
    tertiaryButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    tertiaryButtonText: {
        color: Colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
})
