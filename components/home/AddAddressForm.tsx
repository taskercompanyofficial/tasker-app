import Button from '@/components/Button'
import Input from '@/components/Input'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import useForm from '@/hooks/use-form'
import { ADDRESS_URL, CITIES_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import MapPicker from './MapPicker'

interface Addressdata {
    address_type: 'home' | 'office' | 'other'
    area_type: 'residential' | 'commercial' | 'industrial' | 'other'
    address_line_1: string
    address_line_2: string
    city: string
    state: string
}

interface AddAddressFormProps {
    onSave: () => void
    customer_id?: number
}

const AddressTypeButton = ({
    label,
    icon,
    selected,
    onPress
}: {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    selected: boolean
    onPress: () => void
}) => (
    <Pressable
        style={[styles.typeButton, selected && styles.typeButtonActive]}
        onPress={onPress}
    >
        <Ionicons
            name={icon}
            size={18}
            color={selected ? Colors.themes.customer.primary : Colors.text.tertiary}
        />
        <Text style={[styles.typeButtonText, selected && styles.typeButtonTextActive]}>
            {label}
        </Text>
    </Pressable>
)

export default React.forwardRef<BottomSheetModal, AddAddressFormProps>(
    function AddAddressForm({ onSave, customer_id }, ref) {

        const { data, setData, processing, errors, post, reset } = useForm(
            {
                customer_id: customer_id,
                address_type: 'home',
                area_type: 'residential',
                latitude: 0,
                longitude: 0,
                address_line_1: '',
                address_line_2: '',
                city: '',
                state: '',
            }
        )
        const [showMapPicker, setShowMapPicker] = useState(false)
        const insets = useSafeAreaInsets()

        // Removed internal visible sync effect since we use forwardRef directly

        const closeSheet = () => {
            if (typeof ref === 'function') {
                // Not handled
            } else if (ref && ref.current) {
                ref.current.dismiss()
            }
        }

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    pressBehavior="close"
                />
            ),
            []
        )

        // City selection state
        const [cities, setCities] = useState<{ id: number; name: string }[]>([])
        const [citySearch, setCitySearch] = useState('')
        const [showCityDropdown, setShowCityDropdown] = useState(false)
        const [loadingCities, setLoadingCities] = useState(false)

        // Fetch cities from API with debounce
        useEffect(() => {
            const timer = setTimeout(() => {
                if (citySearch.length >= 1) {
                    fetchCities(citySearch)
                } else {
                    setCities([])
                }
            }, 300)
            return () => clearTimeout(timer)
        }, [citySearch])

        const fetchCities = async (search: string) => {
            setLoadingCities(true)
            try {
                const res = await myAxios.get(`${CITIES_URL}?search=${search}`)
                setCities(res.data.data || [])
            } catch (err) {
                setCities([])
            } finally {
                setLoadingCities(false)
            }
        }

        const handleCitySelect = (city: { id: number; name: string }) => {
            setData(prev => ({ ...prev, city: city.name }))
            setCitySearch(city.name)
            setShowCityDropdown(false)
        }

        const updateField = (field: keyof Addressdata, value: string) => {
            setData(prev => ({ ...prev, [field]: value }))
        }

        const handleLocationSelect = (locationData: {
            latitude: number
            longitude: number
            street: string
            city: string
            state: string
        }) => {
            // Format complete address for line 1
            const fullAddress = [

                locationData.street,
                locationData.city,
                locationData.state,
            ].filter(Boolean).join(', ')

            setData(prev => ({
                ...prev,
                address_line_1: fullAddress,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                city: locationData.city,
                state: locationData.state,
            }))

            Toast.show({
                type: 'success',
                text1: 'Location Selected',
                text2: 'Address fields have been filled. Please review and edit if needed.',
            })
        }

        const handleSave = () => {
            post(ADDRESS_URL, {
                onSuccess: (response) => {
                    Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: response.message || 'Address added successfully'
                    })

                    // Call parent onSave callback to refetch addresses
                    onSave()
                    reset()
                    // Close modal
                    closeSheet()
                },
                onError: (error) => {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: error.message || 'Failed to save address',
                    })
                }
            })
        }

        return (
            <>
                <BottomSheetModal
                    ref={ref}
                    snapPoints={['70%']}
                    backdropComponent={renderBackdrop}
                    index={0}
                    enableDynamicSizing={false}
                    backgroundStyle={{ backgroundColor: Colors.neutral.white, borderRadius: 20 }}
                    handleIndicatorStyle={{ backgroundColor: Colors.neutral.gray[300], width: 36 }}
                >
                    <View style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 12) }}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Add New Address</Text>

                            {/* Select on Map Button */}
                            <View style={{ flexDirection: 'row', gap: 2 }}>
                                <Pressable
                                    style={styles.locationButton}
                                    onPress={() => setShowMapPicker(true)}
                                >
                                    <Ionicons name="map" size={16} color={Colors.themes.customer.primary} />
                                    <Text style={styles.locationButtonText}>
                                        Map
                                    </Text>
                                </Pressable>
                                <Pressable onPress={closeSheet} style={styles.closeButton}>
                                    <Ionicons name="close" size={20} color={Colors.text.primary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Form */}
                        <BottomSheetScrollView
                            style={styles.form}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: Spacing.lg }}
                        >
                            {/* Address Type */}
                            <View style={styles.section}>
                                <Text style={styles.label}>Address Type *</Text>
                                <View style={styles.typeRow}>
                                    <AddressTypeButton
                                        label="Home"
                                        icon="home"
                                        selected={data.address_type === 'home'}
                                        onPress={() => updateField('address_type', 'home')}
                                    />
                                    <AddressTypeButton
                                        label="Office"
                                        icon="briefcase"
                                        selected={data.address_type === 'office'}
                                        onPress={() => updateField('address_type', 'office')}
                                    />
                                    <AddressTypeButton
                                        label="Other"
                                        icon="location"
                                        selected={data.address_type === 'other'}
                                        onPress={() => updateField('address_type', 'other')}
                                    />
                                </View>
                                <Text style={styles.error}>{errors.address_type}</Text>
                            </View>

                            {/* Area Type */}
                            <View style={styles.section}>
                                <Text style={styles.label}>Area Type *</Text>
                                <View style={styles.typeRow}>
                                    <AddressTypeButton
                                        label="Residential"
                                        icon="home-outline"
                                        selected={data.area_type === 'residential'}
                                        onPress={() => updateField('area_type', 'residential')}
                                    />
                                    <AddressTypeButton
                                        label="Commercial"
                                        icon="business"
                                        selected={data.area_type === 'commercial'}
                                        onPress={() => updateField('area_type', 'commercial')}
                                    />
                                </View>
                                <Text style={styles.error}>{errors.area_type}</Text>
                            </View>
                            {/* Address Line 1 */}
                            <Input
                                label="Address Line 1 *"
                                placeholder="Street address"
                                value={data.address_line_1}
                                onChangeText={(text) => updateField('address_line_1', text)}
                                containerStyle={{ marginBottom: 0 }}
                                error={errors.address_line_1}
                            />
                            {/* Address Line 2 */}
                            <Input
                                label="Address Line 2"
                                placeholder="Apartment, suite, unit, etc."
                                value={data.address_line_2}
                                onChangeText={(text) => updateField('address_line_2', text)}
                                containerStyle={{ marginBottom: 0 }}
                                error={errors.address_line_2}
                            />

                            {/* City & State */}
                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <Text style={styles.label}>City *</Text>
                                    <View style={styles.cityInputContainer}>
                                        <Ionicons name="search-outline" size={16} color={Colors.text.tertiary} style={{ marginRight: 6 }} />
                                        <TextInput
                                            style={styles.cityInput}
                                            placeholder="Search city..."
                                            placeholderTextColor={Colors.text.tertiary}
                                            value={citySearch || data.city}
                                            onFocus={() => {
                                                setCitySearch(data.city || '')
                                                setShowCityDropdown(true)
                                            }}
                                            onChangeText={(text) => {
                                                setCitySearch(text)
                                                setShowCityDropdown(true)
                                                if (!text) {
                                                    setData(prev => ({ ...prev, city: '' }))
                                                }
                                            }}
                                        />
                                        {data.city ? (
                                            <TouchableOpacity onPress={() => {
                                                setData(prev => ({ ...prev, city: '' }))
                                                setCitySearch('')
                                                setShowCityDropdown(false)
                                            }}>
                                                <Ionicons name="close-circle" size={16} color={Colors.text.tertiary} />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                    {showCityDropdown && (citySearch.length >= 1) && (
                                        <View style={styles.cityDropdown}>
                                            {loadingCities ? (
                                                <View style={styles.cityDropdownLoading}>
                                                    <ActivityIndicator size="small" color={Colors.themes.customer.primary} />
                                                </View>
                                            ) : cities.length > 0 ? (
                                                <FlatList
                                                    data={cities.slice(0, 8)}
                                                    keyExtractor={(item) => item.id.toString()}
                                                    keyboardShouldPersistTaps="handled"
                                                    renderItem={({ item }) => (
                                                        <TouchableOpacity
                                                            style={styles.cityDropdownItem}
                                                            onPress={() => handleCitySelect(item)}
                                                        >
                                                            <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
                                                            <Text style={styles.cityDropdownText}>{item.name}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                />
                                            ) : (
                                                <View style={styles.cityDropdownEmpty}>
                                                    <Text style={styles.cityDropdownEmptyText}>No cities found</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                    {errors.city ? <Text style={styles.error}>{errors.city}</Text> : null}
                                </View>
                                <Input
                                    label="State *"
                                    placeholder="State"
                                    value={data.state}
                                    onChangeText={(text) => updateField('state', text)}
                                    containerStyle={styles.halfWidth}
                                    error={errors.state}
                                />
                            </View>
                        </BottomSheetScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Button
                                title="Save Address"
                                onPress={handleSave}
                                fullWidth
                                loading={processing}
                            />
                        </View>
                    </View>
                </BottomSheetModal>

                {/* Map Picker Modal */}
                <MapPicker
                    visible={showMapPicker}
                    onClose={() => setShowMapPicker(false)}
                    onSelectLocation={handleLocationSelect}
                />
            </>
        )
    })

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: Colors.neutral.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    closeButton: {
        padding: 4,
    },
    form: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
    },
    section: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border.light,
        backgroundColor: Colors.neutral.white,
    },
    typeButtonActive: {
        borderColor: Colors.themes.customer.primary,
        backgroundColor: Colors.themes.customer.primary + '10',
    },
    typeButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.text.secondary,
    },
    typeButtonTextActive: {
        color: Colors.themes.customer.primary,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: Colors.text.primary,
        backgroundColor: Colors.neutral.gray[50],
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 2,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.themes.customer.primary,
        backgroundColor: Colors.themes.customer.primary + '10',
    },
    locationButtonDisabled: {
        opacity: 0.6,
    },
    locationButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.themes.customer.primary,
    },
    error: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.error,
    },
    cityInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: Colors.neutral.gray[50],
    },
    cityInput: {
        flex: 1,
        fontSize: 13,
        color: Colors.text.primary,
        padding: 0,
    },
    cityDropdown: {
        borderWidth: 1,
        borderColor: Colors.border.light,
        borderRadius: 8,
        backgroundColor: Colors.neutral.white,
        marginTop: 4,
        maxHeight: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    cityDropdownLoading: {
        padding: 16,
        alignItems: 'center',
    },
    cityDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    cityDropdownText: {
        fontSize: 13,
        color: Colors.text.primary,
    },
    cityDropdownEmpty: {
        padding: 16,
        alignItems: 'center',
    },
    cityDropdownEmptyText: {
        fontSize: 12,
        color: Colors.text.tertiary,
    },
})
