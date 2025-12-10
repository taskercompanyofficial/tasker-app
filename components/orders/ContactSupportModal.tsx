import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Alert, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
                Alert.alert('Error', 'Unable to make phone calls on this device')
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open phone dialer')
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
                Alert.alert('WhatsApp Not Installed', 'Please install WhatsApp to use this feature')
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open WhatsApp')
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
                            <Ionicons name="headset" size={32} color={Colors.primary.main} />
                        </View>
                        <Text style={styles.title}>Contact Support</Text>
                        <Text style={styles.subtitle}>How would you like to reach us?</Text>
                    </View>

                    {/* Contact Options */}
                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.optionButton} onPress={handleCall}>
                            <View style={[styles.optionIcon, { backgroundColor: '#10B98115' }]}>
                                <Ionicons name="call" size={24} color="#10B981" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Phone Call</Text>
                                <Text style={styles.optionSubtitle}>{PHONE_NUMBER}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionButton} onPress={handleWhatsApp}>
                            <View style={[styles.optionIcon, { backgroundColor: '#25D36615' }]}>
                                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>WhatsApp</Text>
                                <Text style={styles.optionSubtitle}>Chat with us</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
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
        padding: Spacing.lg,
    },
    container: {
        backgroundColor: Colors.neutral.white,
        borderRadius: 20,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[50],
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    optionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    closeButton: {
        backgroundColor: Colors.neutral.gray[100],
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
    },
})
