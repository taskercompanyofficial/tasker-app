import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

interface CancelOrderModalProps {
    visible: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    loading: boolean
}

export default function CancelOrderModal({ visible, onClose, onConfirm, loading }: CancelOrderModalProps) {
    const [reason, setReason] = useState('')

    const handleConfirm = () => {
        onConfirm(reason || 'Cancelled by customer')
        setReason('')
    }

    const handleClose = () => {
        setReason('')
        onClose()
    }

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="warning" size={40} color="#EF4444" />
                        </View>
                    </View>

                    {/* Title & Message */}
                    <Text style={styles.title}>Cancel Order?</Text>
                    <Text style={styles.message}>
                        Are you sure you want to cancel this order? This action cannot be undone.
                    </Text>

                    {/* Reason Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Reason (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Why are you cancelling?"
                            placeholderTextColor={Colors.text.tertiary}
                            value={reason}
                            onChangeText={setReason}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Keep Order</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            <Text style={styles.confirmButtonText}>
                                {loading ? 'Cancelling...' : 'Yes, Cancel'}
                            </Text>
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
        marginBottom: Spacing.md,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#EF444410',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
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
    inputContainer: {
        width: '100%',
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.neutral.gray[50],
        borderRadius: 10,
        padding: Spacing.sm,
        fontSize: 13,
        color: Colors.text.primary,
        borderWidth: 1,
        borderColor: Colors.border.light,
        minHeight: 80,
    },
    buttonsContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: Spacing.sm,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: Colors.neutral.gray[100],
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: Colors.text.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
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
