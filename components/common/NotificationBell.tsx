import Colors from '@/constants/Colors'
import { NOTIFICATION_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount()
        }, [])
    )

    const fetchUnreadCount = async () => {
        try {
            const res = await myAxios.get(`${NOTIFICATION_URL}/unread-count`)
            setUnreadCount(res.data.data.count || 0)
        } catch (error) {
            console.error('Failed to fetch unread count:', error)
        }
    }

    return (
        <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
        >
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#EF4444',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.neutral.white,
    },
})
