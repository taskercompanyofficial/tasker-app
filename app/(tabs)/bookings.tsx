import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'

export default function Bookings() {
    const bookings = [
        { id: 1, service: 'AC Repair', provider: 'Cool Breeze', date: 'Dec 12, 2025', time: '10:00 AM', status: 'upcoming' },
        { id: 2, service: 'Cleaning', provider: 'Sparkle Clean', date: 'Dec 15, 2025', time: '2:00 PM', status: 'upcoming' },
        { id: 3, service: 'Plumbing', provider: 'Fix It Pro', date: 'Dec 10, 2025', time: '11:00 AM', status: 'in-progress' },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return '#F59E0B'
            case 'in-progress': return '#10B981'
            case 'completed': return '#8B5CF6'
            default: return Colors.text.tertiary
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="filter" size={20} color={Colors.primary.main} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {bookings.map((booking) => (
                    <TouchableOpacity key={booking.id} style={styles.bookingCard} activeOpacity={0.7}>
                        <View style={styles.bookingHeader}>
                            <View style={styles.serviceInfo}>
                                <Text style={styles.serviceName}>{booking.service}</Text>
                                <Text style={styles.providerName}>{booking.provider}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                                    {booking.status.replace('-', ' ')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bookingDetails}>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar" size={14} color={Colors.text.tertiary} />
                                <Text style={styles.detailText}>{booking.date}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="time" size={14} color={Colors.text.tertiary} />
                                <Text style={styles.detailText}>{booking.time}</Text>
                            </View>
                        </View>

                        <View style={styles.bookingActions}>
                            <TouchableOpacity style={styles.actionButton}>
                                <Text style={styles.actionButtonText}>View Details</Text>
                            </TouchableOpacity>
                            {booking.status === 'upcoming' && (
                                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}

                {bookings.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={Colors.text.tertiary} />
                        <Text style={styles.emptyTitle}>No Bookings Yet</Text>
                        <Text style={styles.emptyText}>Book a service to get started</Text>
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
    filterButton: {
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
    bookingCard: {
        backgroundColor: Colors.neutral.white,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    providerName: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    bookingDetails: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    bookingActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: Colors.primary.main,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.neutral.white,
    },
    cancelButton: {
        backgroundColor: Colors.neutral.white,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    cancelButtonText: {
        color: Colors.text.secondary,
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
