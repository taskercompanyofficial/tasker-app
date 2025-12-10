import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface AlertModalProps {
    visible: boolean
    title: string
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    onClose: () => void
    primaryButton?: {
        text: string
        onPress: () => void
    }
    secondaryButton?: {
        text: string
        onPress: () => void
    }
}

export default function AlertModal({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    primaryButton,
    secondaryButton,
}: AlertModalProps) {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle', color: '#10B981' }
            case 'error':
                return { name: 'close-circle', color: '#EF4444' }
            case 'warning':
                return { name: 'warning', color: '#F59E0B' }
            default:
                return { name: 'information-circle', color: '#3B82F6' }
        }
    }

    const icon = getIcon()

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                        <Ionicons name={icon.name as any} size={48} color={icon.color} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                        {secondaryButton && (
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={() => {
                                    secondaryButton.onPress()
                                    onClose()
                                }}
                            >
                                <Text style={styles.secondaryButtonText}>{secondaryButton.text}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => {
                                if (primaryButton) {
                                    primaryButton.onPress()
                                }
                                onClose()
                            }}
                        >
                            <Text style={styles.primaryButtonText}>
                                {primaryButton?.text || 'OK'}
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
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
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
    buttonsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary.main,
    },
    primaryButtonText: {
        color: Colors.neutral.white,
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: Colors.neutral.gray[100],
    },
    secondaryButtonText: {
        color: Colors.text.primary,
        fontSize: 15,
        fontWeight: '700',
    },
})
