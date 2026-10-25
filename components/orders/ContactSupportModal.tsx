import { localizedAlert } from "@/lib/i18n/localized-alert";
import AppText from "@/components/common/AppText";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import Colors from '@/constants/Colors'
import { Spacing, BorderRadius, Typography } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Alert, Linking, Modal, StyleSheet, TouchableOpacity, View } from 'react-native'

interface ContactSupportModalProps {
    visible: boolean
    onClose: () => void
}

const PHONE_NUMBER = '03041112717'
const WHATSAPP_NUMBER = '923041112717' // WhatsApp format with country code

export default function ContactSupportModal({ visible, onClose }: ContactSupportModalProps) {
    const handleCall = async () => {
        try {
            const url = `tel:${PHONE_NUMBER}`
            const canOpen = await Linking.canOpenURL(url)
            if (canOpen) {
                await Linking.openURL(url)
                onClose()
            } else {
                localizedAlert('Error', 'Unable to make phone calls on this device')
            }
        } catch (error) {
            localizedAlert('Error', 'Failed to open phone dialer')
        }
    }

    const handleWhatsApp = async () => {
        try {
            const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}`
            const canOpen = await Linking.canOpenURL(url)
            if (canOpen) {
                await Linking.openURL(url)
                onClose()
            } else {
                localizedAlert('WhatsApp Not Installed', 'Please install WhatsApp to use this feature')
            }
        } catch (error) {
            localizedAlert('Error', 'Failed to open WhatsApp')
        }
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
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="headset" size={Typography.sizes.xl} color={Colors.themes.customer.primary} />
                        </View>
                        <AppText style={styles.title}>Contact Support</AppText>
                        <AppText style={styles.subtitle}>How would you like to reach us?</AppText>
                    </View>

                    {/* Contact Options */}
                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.optionButton} onPress={handleCall}>
                            <View style={[styles.optionIcon, { backgroundColor: Colors.success + '15' }]}>
                                <Ionicons name="call" size={Typography.sizes.lg} color={Colors.success} />
                            </View>
                            <View style={styles.optionContent}>
                                <AppText style={styles.optionTitle}>Phone Call</AppText>
                                <AppText style={styles.optionSubtitle}>{PHONE_NUMBER}</AppText>
                            </View>
                            <DirectionalIcon name="chevron-forward" size={Typography.sizes.base} color={Colors.text.tertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionButton} onPress={handleWhatsApp}>
                            <View style={[styles.optionIcon, { backgroundColor: Colors.social.whatsapp + '15' }]}>
                                <Ionicons name="logo-whatsapp" size={Typography.sizes.lg} color={Colors.social.whatsapp} />
                            </View>
                            <View style={styles.optionContent}>
                                <AppText style={styles.optionTitle}>WhatsApp</AppText>
                                <AppText style={styles.optionSubtitle}>Chat with us</AppText>
                            </View>
                            <DirectionalIcon name="chevron-forward" size={Typography.sizes.base} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <AppText style={styles.closeButtonText}>Cancel</AppText>
                    </TouchableOpacity>
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
        padding: Spacing.md,
    },
    container: {
        backgroundColor: Colors.neutral.white,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        width: '100%',
        maxWidth: 400,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    iconContainer: {
        width: Spacing.xl * 2,
        height: Spacing.xl * 2,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.themes.customer.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography.sizes.lg,
        fontWeight: '800',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.sizes.sm,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[50],
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    optionIcon: {
        width: Spacing.xl * 2,
        height: Spacing.xl * 2,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.xs,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: Typography.sizes.sm,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: Typography.sizes.xs,
        color: Colors.text.secondary,
    },
    closeButton: {
        backgroundColor: Colors.neutral.gray[100],
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: Typography.sizes.sm,
        fontWeight: '700',
        color: Colors.text.primary,
    },
})
