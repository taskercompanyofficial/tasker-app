import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function FreeInstallationCard() {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => router.push('/free-installation')}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.content}>
                    {/* Left Section */}
                    <View style={styles.leftSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="gift" size={28} color={Colors.neutral.white} />
                        </View>
                    </View>

                    {/* Middle Section */}
                    <View style={styles.middleSection}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>FREE SERVICE</Text>
                        </View>
                        <Text style={styles.title}>Free Installation</Text>
                        <Text style={styles.subtitle}>AC & Washing Machine</Text>
                        <View style={styles.citiesRow}>
                            <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.citiesText}>4 Major Cities</Text>
                        </View>
                    </View>

                    {/* Right Section */}
                    <View style={styles.rightSection}>
                        <View style={styles.arrowButton}>
                            <Ionicons name="arrow-forward" size={20} color="#10B981" />
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.sm,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    gradient: {
        padding: Spacing.md,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    leftSection: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    middleSection: {
        flex: 1,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.neutral.white,
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.neutral.white,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    citiesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    citiesText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.85)',
    },
    rightSection: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
})
