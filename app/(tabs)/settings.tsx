import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useSession } from '@/context/ctx'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { router } from 'expo-router'
import NotificationBell from '@/components/common/NotificationBell'
import AlertModal from '@/components/common/AlertModal'

type SettingItem = {
    icon: string
    label: string
    onPress?: () => void
    toggle?: boolean
    value?: boolean | string
    onToggle?: (value: boolean) => void
}

export default function Settings() {
    const { signOut, session } = useSession()
    const [notifications, setNotifications] = useState(true)
    const [locationServices, setLocationServices] = useState(true)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const settingsSections = [
        {
            title: 'Account',
            items: [
                { icon: 'person', label: 'Edit Profile', onPress: () => router.push('/profile/edit') },
                { icon: 'location', label: 'Manage Addresses', onPress: () => router.push('/profile/addresses') },
                { icon: 'card', label: 'Payment Methods', onPress: () => { } },
            ] as SettingItem[],
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'notifications', label: 'Notifications', toggle: true, value: notifications, onToggle: setNotifications },
                { icon: 'navigate', label: 'Location Services', toggle: true, value: locationServices, onToggle: setLocationServices },
                { icon: 'language', label: 'Language', onPress: () => { }, value: 'English' },
            ] as SettingItem[],
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle', label: 'Help Center', onPress: () => { } },
                { icon: 'chatbubble', label: 'Contact Us', onPress: () => router.push('/contact-us') },
                { icon: 'document-text', label: 'Terms & Privacy', onPress: () => { } },
            ] as SettingItem[],
        },
    ]

    const handleSignOut = async () => {
        await signOut()
        router.replace('/auth/sign-in')
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
                <NotificationBell />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* User Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {session.user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{session.user?.name || 'User'}</Text>
                        <Text style={styles.profileEmail}>{session.user?.email || session.user?.phone}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push('/profile/edit')}
                    >
                        <Ionicons name="create" size={18} color={Colors.primary.main} />
                    </TouchableOpacity>
                </View>

                {/* Settings Sections */}
                {settingsSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionContent}>
                            {section.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    style={[
                                        styles.settingItem,
                                        itemIndex === section.items.length - 1 && styles.settingItemLast
                                    ]}
                                    onPress={item.onPress}
                                    disabled={item.toggle}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.settingLeft}>
                                        <View style={styles.settingIcon}>
                                            <Ionicons name={item.icon as any} size={20} color={Colors.primary.main} />
                                        </View>
                                        <Text style={styles.settingLabel}>{item.label}</Text>
                                    </View>
                                    <View style={styles.settingRight}>
                                        {item.toggle ? (
                                            <Switch
                                                value={typeof item.value === 'boolean' ? item.value : false}
                                                onValueChange={item.onToggle}
                                                trackColor={{ false: Colors.neutral.gray[300], true: Colors.primary.main + '50' }}
                                                thumbColor={item.value ? Colors.primary.main : Colors.neutral.white}
                                            />
                                        ) : (
                                            <>
                                                {item.value && typeof item.value === 'string' && <Text style={styles.settingValue}>{item.value}</Text>}
                                                <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
                                            </>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Sign Out Button */}
                <TouchableOpacity style={styles.signOutButton} onPress={() => setShowLogoutConfirm(true)}>
                    <Ionicons name="log-out" size={20} color="#EF4444" />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>

            {/* Logout Confirmation Modal */}
            <AlertModal
                visible={showLogoutConfirm}
                type="warning"
                title="Sign Out"
                message="Are you sure you want to sign out?"
                onClose={() => setShowLogoutConfirm(false)}
                primaryButton={{
                    text: 'Sign Out',
                    onPress: handleSignOut,
                }}
                secondaryButton={{
                    text: 'Cancel',
                    onPress: () => { },
                }}
            />
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
        alignItems: 'center',
        justifyContent: 'space-between',
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
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationBadge: {
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
    notificationBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.neutral.white,
    },
    scrollView: {
        flex: 1,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
        margin: Spacing.md,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.neutral.white,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: Colors.primary.main + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.tertiary,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
    },
    sectionContent: {
        backgroundColor: Colors.neutral.white,
        marginHorizontal: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    settingItemLast: {
        borderBottomWidth: 0,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: Colors.primary.main + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    settingValue: {
        fontSize: 13,
        color: Colors.text.tertiary,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.neutral.white,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    signOutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    versionText: {
        fontSize: 12,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginVertical: Spacing.lg,
    },
})
