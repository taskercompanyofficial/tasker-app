import AddAddressForm from '@/components/home/AddAddressForm'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import { ADDRESS_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
}

interface AddressSelectorProps {
    selectedAddressId: number | null
    onSelectAddress: (addressId: number, address: Address) => void
    error?: string
}

export default function AddressSelector({ selectedAddressId, onSelectAddress, error }: AddressSelectorProps) {
    const { session } = useSession()
    const [addresses, setAddresses] = useState<Address[]>([])
    const [showAddressForm, setShowAddressForm] = useState(false)
    const [loading, setLoading] = useState(true)

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

    const handleSaveAddress = () => {
        fetchAddresses()
        setShowAddressForm(false)
    }

    return (
        <>
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading addresses...</Text>
                    </View>
                ) : addresses.length > 0 ? (
                    <>
                        {addresses.map((address) => (
                            <TouchableOpacity
                                key={address.id}
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
                                            color={selectedAddressId === address.id ? Colors.primary.main : Colors.text.secondary}
                                        />
                                        <Text style={[
                                            styles.addressLabel,
                                            selectedAddressId === address.id && styles.addressLabelSelected
                                        ]}>
                                            {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.radioButton,
                                        selectedAddressId === address.id && styles.radioButtonSelected
                                    ]}>
                                        {selectedAddressId === address.id && (
                                            <View style={styles.radioButtonInner} />
                                        )}
                                    </View>
                                </View>
                                <Text style={styles.addressText}>{address.address_line_1}</Text>
                                {address.address_line_2 && <Text style={styles.addressText}>{address.address_line_2}</Text>}
                                <Text style={styles.addressText}>{address.city}, {address.state} {address.zip_code || ''}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.addAddressButton}
                            onPress={() => setShowAddressForm(true)}
                        >
                            <Ionicons name="add-circle" size={16} color={Colors.primary.main} />
                            <Text style={styles.addAddressText}>Add New Address</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={styles.emptyAddressButton}
                        onPress={() => setShowAddressForm(true)}
                    >
                        <Ionicons name="location-outline" size={32} color={Colors.text.tertiary} />
                        <Text style={styles.emptyAddressText}>No addresses found</Text>
                        <Text style={styles.addAddressText}>Add New Address</Text>
                    </TouchableOpacity>
                )}
                {error && <Text style={styles.error}>{error}</Text>}
            </View>

            {/* Address Form Modal */}
            <AddAddressForm
                visible={showAddressForm}
                onClose={() => setShowAddressForm(false)}
                onSave={handleSaveAddress}
            />
        </>
    )
}

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
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.light,
        backgroundColor: Colors.neutral.white,
    },
    addressCardSelected: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.primary.light,
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
        color: Colors.primary.main,
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
        borderColor: Colors.primary.main,
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary.main,
    },
    addressText: {
        fontSize: 13,
        color: Colors.text.primary,
        lineHeight: 18,
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: Spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.primary.main,
        backgroundColor: Colors.primary.light,
    },
    addAddressText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary.main,
    },
    emptyAddressButton: {
        padding: Spacing.xl,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.border.light,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    emptyAddressText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    error: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
    },
})
