import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'

export default function History() {
    const history = [
        { id: 1, service: 'AC Repair', provider: 'Cool Breeze', date: 'Dec 5, 2025', amount: '$50', rating: 5 },
        { id: 2, service: 'Cleaning', provider: 'Sparkle Clean', date: 'Nov 28, 2025', amount: '$80', rating: 4 },
        { id: 3, service: 'Plumbing', provider: 'Fix It Pro', date: 'Nov 20, 2025', amount: '$40', rating: 5 },
        { id: 4, service: 'Electrical', provider: 'PowerUp', date: 'Nov 15, 2025', amount: '$45', rating: 4 },
    ]

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Service History</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={20} color={Colors.primary.main} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {history.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.historyCard} activeOpacity={0.7}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            </View>
                            <View style={styles.serviceInfo}>
                                <Text style={styles.serviceName}>{item.service}</Text>
                                <Text style={styles.providerName}>{item.provider}</Text>
                                <Text style={styles.dateText}>{item.date}</Text>
                            </View>
                            <View style={styles.amountContainer}>
                                <Text style={styles.amountText}>{item.amount}</Text>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={styles.ratingContainer}>
                                {[...Array(5)].map((_, index) => (
                                    <Ionicons
                                        key={index}
                                        name={index < item.rating ? 'star' : 'star-outline'}
                                        size={14}
                                        color="#F59E0B"
                                    />
                                ))}
                            </View>
                            <TouchableOpacity style={styles.rebookButton}>
                                <Ionicons name="refresh" size={14} color={Colors.primary.main} />
                                <Text style={styles.rebookText}>Rebook</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}

                {history.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="time-outline" size={64} color={Colors.text.tertiary} />
                        <Text style={styles.emptyTitle}>No History Yet</Text>
                        <Text style={styles.emptyText}>Your completed services will appear here</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.gray[50],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.neutral.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    searchButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: Colors.primary.main + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
        padding: Spacing.md,
    },
    historyCard: {
        backgroundColor: Colors.neutral.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    iconContainer: {
        marginRight: Spacing.sm,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    providerName: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginBottom: 2,
    },
    dateText: {
        fontSize: 11,
        color: Colors.text.tertiary,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary.main,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    rebookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: Colors.primary.main + '10',
    },
    rebookText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary.main,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl * 2,
        gap: Spacing.sm,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.text.tertiary,
    },
})
