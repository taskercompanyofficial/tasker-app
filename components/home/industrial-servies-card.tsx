import ContactSupportModal from '@/components/orders/ContactSupportModal'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function IndustrialServicesCard() {
    const [showContactModal, setShowContactModal] = useState(false)

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80' }}
                style={styles.backgroundImage}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
                style={styles.gradient}
                locations={[0, 0.4, 1]}
            >
                <View style={styles.content}>
                    {/* Top Section */}
                    <View style={styles.topSection}>
                        {/* Badge */}
                        <View style={styles.badge}>
                            <Ionicons name="business" size={14} color={Colors.neutral.white} />
                            <Text style={styles.badgeText}>Commercial & Industrial</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Need Services for{'\n'}Your Business?</Text>
                        <Text style={styles.subtitle}>
                            Get custom quotations for commercial units, factories, and industrial facilities
                        </Text>
                    </View>

                    {/* Middle Section - Features */}
                    <View style={styles.featuresSection}>
                        <View style={styles.feature}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            </View>
                            <Text style={styles.featureText}>Custom Solutions</Text>
                        </View>
                        <View style={styles.feature}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            </View>
                            <Text style={styles.featureText}>Bulk Discounts</Text>
                        </View>
                        <View style={styles.feature}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            </View>
                            <Text style={styles.featureText}>24/7 Support</Text>
                        </View>
                    </View>

                    {/* Bottom Section - CTA Buttons */}
                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push('/commercial-quote')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="document-text" size={18} color={Colors.neutral.white} />
                            <Text style={styles.primaryButtonText}>Request Quote</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setShowContactModal(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chatbubbles" size={18} color={Colors.primary.main} />
                            <Text style={styles.secondaryButtonText}>Contact Us</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Contact Modal */}
            <ContactSupportModal
                visible={showContactModal}
                onClose={() => setShowContactModal(false)}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.lg,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        position: 'relative',
        height: 450,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    topSection: {
        flex: 0,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        marginBottom: Spacing.lg,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.neutral.white,
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.neutral.white,
        marginBottom: Spacing.sm,
        lineHeight: 22,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.neutral.white,
        lineHeight: 22,
        marginBottom: Spacing.xs,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    featuresSection: {
        flex: 0,
        gap: Spacing.xs,
        marginVertical: Spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    featureIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.neutral.white,
    },
    actionsSection: {
        flex: 0,
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary.main,
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.neutral.white,
        letterSpacing: 0.3,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.neutral.white,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary.main,
        letterSpacing: 0.3,
    },
})
