import AppText from "@/components/common/AppText";
import AddAddressForm from '@/components/home/AddAddressForm'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import { ADDRESS_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { StyleSheet, TouchableOpacity, View, FlatList, Pressable } from 'react-native'

export interface Address {
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
}

interface AddressSelectorProps {
    selectedAddressId: number | null
    onSelectAddress: (addressId: number, address: Address) => void
    onAddNewAddress?: () => void
    onViewDetails?: (address: Address) => void
    error?: string
}

export interface AddressSelectorRef {
    refresh: () => void
    getAddress: (id: number | null) => Address | null
}

export default forwardRef<AddressSelectorRef, AddressSelectorProps>(
    function AddressSelector({ selectedAddressId, onSelectAddress, onAddNewAddress, onViewDetails, error }, ref) {
        const { session } = useSession()
        const [addresses, setAddresses] = useState<Address[]>([])
        const [loading, setLoading] = useState(true)

        useImperativeHandle(ref, () => ({
            refresh: fetchAddresses,
            getAddress: (id) => addresses.find(a => a.id === id) || null
        }))

    useEffect(() => {
        if (session.user?.id) {
            fetchAddresses()
        }
    }, [session.user?.id])

    const fetchAddresses = async () => {
        try {
            setLoading(true)
            const response = await myAxios.get(ADDRESS_URL + `?customer_id=${session.user?.id}`)
            const addressData = response.data.data || []
            setAddresses(addressData)
        } catch (error) {
            setAddresses([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <AppText style={styles.loadingText}>Loading addresses...</AppText>
                    </View>
                ) : (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={addresses}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ gap: Spacing.sm }}
                        renderItem={({ item: address }) => (
                            <TouchableOpacity
                                style={[
                                    styles.addressCard,
                                    selectedAddressId === address.id && styles.addressCardSelected
                                ]}
                                onPress={() => onSelectAddress(address.id, address)}
                            >
                                <View style={styles.addressHeader}>
                                    <View style={styles.addressLabelContainer}>
                                        <Ionicons
                                            name={address.address_type === 'home' ? 'home' : address.address_type === 'office' ? 'briefcase' : 'location'}
                                            size={16}
                                            color={selectedAddressId === address.id ? Colors.themes.customer.primary : Colors.text.secondary}
                                        />
                                        <AppText style={[
                                            styles.addressLabel,
                                            selectedAddressId === address.id && styles.addressLabelSelected
                                        ]}>
                                            {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}
                                        </AppText>
                                    </View>
                                    <View style={styles.radioAndInfo}>
                                        {onViewDetails ? (
                                            <TouchableOpacity
                                                style={styles.infoButton}
                                                onPress={() => onViewDetails(address)}
                                                hitSlop={8}
                                            >
                                                <Ionicons name="information-circle-outline" size={20} color={Colors.text.tertiary} />
                                            </TouchableOpacity>
                                        ) : null}
                                        <View style={[
                                            styles.radioButton,
                                            selectedAddressId === address.id && styles.radioButtonSelected
                                        ]}>
                                            {selectedAddressId === address.id && (
                                                <View style={styles.radioButtonInner} />
                                            )}
                                        </View>
                                    </View>
                                </View>
                                <AppText style={styles.addressText} numberOfLines={1}>{address.address_line_1}</AppText>
                                {address.address_line_2 ? <AppText style={styles.addressText} numberOfLines={1}>{address.address_line_2}</AppText> : null}
                                <AppText style={styles.addressText} numberOfLines={1}>{address.city}, {address.state} {address.zip_code || ''}</AppText>
                            </TouchableOpacity>
                        )}
                        ListFooterComponent={
                            onAddNewAddress ? (
                                <TouchableOpacity
                                    style={[styles.addAddressButton, addresses.length === 0 && styles.addAddressButtonEmpty]}
                                    onPress={onAddNewAddress}
                                >
                                    <Ionicons name="add-circle-outline" size={28} color={Colors.themes.customer.primary} />
                                    <AppText style={styles.addAddressText}>Add New</AppText>
                                </TouchableOpacity>
                            ) : null
                        }
                    />
                )}
                {error && <AppText style={styles.error}>{error}</AppText>}
            </View>
    )
})

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
    },
    loadingContainer: {
        padding: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
    addressCard: {
        width: 220,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.light,
        backgroundColor: Colors.neutral.white,
    },
    addressCardSelected: {
        borderColor: Colors.themes.customer.primary,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    addressLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
        textTransform: 'capitalize',
    },
    addressLabelSelected: {
        color: Colors.themes.customer.primary,
    },
    radioAndInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoButton: {
        padding: 2,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: Colors.themes.customer.primary,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.themes.customer.primary,
    },
    addressText: {
        fontSize: 13,
        color: Colors.text.primary,
        lineHeight: 18,
    },
    addAddressButton: {
        width: 140,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.themes.customer.primary,
        backgroundColor: Colors.themes.customer.primary + '08',
    },
    addAddressButtonEmpty: {
        width: 220,
    },
    addAddressText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.themes.customer.primary,
    },
    error: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
    },
})
