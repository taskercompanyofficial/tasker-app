import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSession } from '@/context/ctx'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import AddAddressForm from './AddAddressForm'
import { ADDRESS_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'

interface Address {
    id: number
    customer_id: number
    address_type: 'home' | 'office' | 'other'
    area_type: 'residential' | 'commercial' | 'industrial' | 'other'
    address_line_1: string
    address_line_2: string | null
    city: string
    state: string
    zip_code: string
    country: string
    latitude: number | null
    longitude: number | null
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
    isActive?: boolean
}

export default function HomeHeader() {
    const { session } = useSession()
    const [userAddresses, setUserAddresses] = useState<Address[]>([])
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [showAddressSheet, setShowAddressSheet] = useState(false)
    const [showAddressForm, setShowAddressForm] = useState(false)

    const fetchAddress = async () => {
        try {
            const res = await myAxios.get(ADDRESS_URL + `?customer_id=${session.user?.id}`)
            const addresses: Address[] = res.data.data || []

            // Set first address as active by default
            if (addresses.length > 0) {
                addresses[0].isActive = true
                setSelectedAddress(addresses[0])
            }

            setUserAddresses(addresses)
        } catch (error) {
            console.error("Failed to fetch addresses:", error)
        }
    }

    useEffect(() => {
        fetchAddress()
    }, [])

    const userName = session.user?.name || 'Guest'
    const firstName = userName.split(' ')[0]
    const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

    const handleAddressSelect = (address: Address) => {
        // Update isActive status
        const updatedAddresses = userAddresses.map(addr => ({
            ...addr,
            isActive: addr.id === address.id
        }))
        setUserAddresses(updatedAddresses)
        setSelectedAddress(address)
        setShowAddressSheet(false)
    }

    const handleSaveAddress = () => {
        fetchAddress()
    }

    const renderAddressItem = ({ item }: { item: Address }) => (
        <TouchableOpacity
            style={[
                styles.addressItem,
                item.id === selectedAddress?.id && styles.addressItemActive
            ]}
            onPress={() => handleAddressSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.addressItemLeft}>
                <View style={[
                    styles.addressIcon,
                    item.id === selectedAddress?.id && styles.addressIconActive
                ]}>
                    <Ionicons
                        name={item.address_type === 'home' ? 'home' : item.address_type === 'office' ? 'briefcase' : 'location'}
                        size={14}
                        color={item.id === selectedAddress?.id ? Colors.primary.main : Colors.text.tertiary}
                    />
                </View>
                <View style={styles.addressInfo}>
                    <Text style={[
                        styles.addressLabel,
                        item.id === selectedAddress?.id && styles.addressLabelActive
                    ]}>
                        {item.address_type.charAt(0).toUpperCase() + item.address_type.slice(1)}
                    </Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                        {item.address_line_1}
                    </Text>
                </View>
            </View>
            {item.id === selectedAddress?.id && (
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary.main} />
            )}
        </TouchableOpacity>
    )

    return (
        <>
            <View style={styles.container}>
                <View style={styles.leftSection}>
                    {/* User Avatar */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{userInitials}</Text>
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Text style={styles.greeting}>Hi, {firstName}! 👋</Text>
                        <TouchableOpacity
                            style={styles.addressRow}
                            onPress={() => setShowAddressSheet(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="location" size={11} color={Colors.text.tertiary} />
                            <Text style={styles.address} numberOfLines={1}>
                                {selectedAddress?.address_line_1?.substring(0, 30).concat('...') || 'Select address'}
                            </Text>
                            <Ionicons name="chevron-down" size={12} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={20} color={Colors.text.primary} />
                    <View style={styles.badge} />
                </TouchableOpacity>
            </View>

            {/* Address Bottom Sheet */}
            <Modal
                visible={showAddressSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddressSheet(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowAddressSheet(false)}
                >
                    <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
                        {/* Handle Bar */}
                        <View style={styles.handleBar} />

                        {/* Header */}
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Select Address</Text>
                            <TouchableOpacity
                                onPress={() => setShowAddressSheet(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={20} color={Colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Address List */}
                        <FlatList
                            data={userAddresses}
                            renderItem={renderAddressItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.addressList}
                            ListEmptyComponent={<Text style={styles.emptyAddressText}>No addresses found</Text>}
                        />

                        {/* Add New Address */}
                        <TouchableOpacity
                            style={styles.addAddressButton}
                            onPress={() => {
                                setShowAddressSheet(false)
                                setTimeout(() => setShowAddressForm(true), 300)
                            }}
                        >
                            <Ionicons name="add-circle" size={18} color={Colors.primary.main} />
                            <Text style={styles.addAddressText}>Add New Address</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Add Address Form */}
            <AddAddressForm
                visible={showAddressForm}
                onClose={() => setShowAddressForm(false)}
                onSave={handleSaveAddress}
                customer_id={session.user?.id}
            />
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        backgroundColor: Colors.neutral.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.neutral.white,
    },
    userInfo: {
        flex: 1,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    address: {
        fontSize: 11,
        color: Colors.text.tertiary,
    },
    notificationButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
        borderWidth: 1.5,
        borderColor: Colors.neutral.white,
    },

    // Bottom Sheet Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: Colors.neutral.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: '70%',
    },
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: Colors.neutral.gray[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 12,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    closeButton: {
        padding: 4,
    },
    addressList: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        backgroundColor: Colors.neutral.gray[50],
        borderWidth: 1,
        borderColor: 'transparent',
    },
    addressItemActive: {
        backgroundColor: Colors.primary.main + '10',
        borderColor: Colors.primary.main,
    },
    addressItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    addressIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressIconActive: {
        backgroundColor: Colors.primary.main + '20',
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    addressLabelActive: {
        color: Colors.primary.main,
    },
    addressText: {
        fontSize: 11,
        color: Colors.text.tertiary,
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.primary.main,
        borderStyle: 'dashed',
    },
    addAddressText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary.main,
    },
    emptyAddressText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
    },
})
