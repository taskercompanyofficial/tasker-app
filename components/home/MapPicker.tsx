import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, Alert } from 'react-native'
import MapView, { Marker, Region } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import Button from '@/components/Button'

interface MapPickerProps {
    visible: boolean
    onClose: () => void
    onSelectLocation: (address: {
        latitude: number
        longitude: number
        street: string
        city: string
        state: string
        zip: string
        country: string
    }) => void
}

export default function MapPicker({ visible, onClose, onSelectLocation }: MapPickerProps) {
    const [region, setRegion] = useState<Region>({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    })
    const [markerPosition, setMarkerPosition] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
    })
    const [loading, setLoading] = useState(true)
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        if (visible) {
            getUserLocation()
        }
    }, [visible])

    const getUserLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                setLoading(false)
                return
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            })

            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }

            setRegion(newRegion)
            setMarkerPosition({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            })
        } catch (error) {
            console.error('Error getting location:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMapPress = (e: any) => {
        setMarkerPosition(e.nativeEvent.coordinate)
    }

    const handleConfirm = async () => {
        try {
            setConfirming(true)

            const address = await Location.reverseGeocodeAsync({
                latitude: markerPosition.latitude,
                longitude: markerPosition.longitude,
            })

            if (address && address.length > 0) {
                const addr = address[0]

                onSelectLocation({
                    latitude: markerPosition.latitude,
                    longitude: markerPosition.longitude,
                    street: `${addr.street || ''} ${addr.streetNumber || ''}`.trim() || 'Selected Location',
                    city: addr.city || addr.subregion || '',
                    state: addr.region || '',
                    zip: addr.postalCode || '',
                    country: addr.country || '',
                })
                onClose()
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to get address for this location')
            console.error('Geocoding error:', error)
        } finally {
            setConfirming(false)
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Select Location</Text>
                        <Text style={styles.subtitle}>Tap on map to select location</Text>
                    </View>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={Colors.text.primary} />
                    </Pressable>
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary.main} />
                            <Text style={styles.loadingText}>Loading map...</Text>
                        </View>
                    ) : (
                        <>
                            <MapView
                                style={styles.map}
                                region={region}
                                onPress={handleMapPress}
                                showsUserLocation
                                showsMyLocationButton
                            >
                                <Marker
                                    coordinate={markerPosition}
                                    draggable
                                    onDragEnd={(e) => setMarkerPosition(e.nativeEvent.coordinate)}
                                >
                                    <View style={styles.markerContainer}>
                                        <View style={styles.markerPin}>
                                            <Ionicons name="location" size={32} color={Colors.primary.main} />
                                        </View>
                                    </View>
                                </Marker>
                            </MapView>

                            {/* Center Location Button */}
                            <Pressable
                                style={styles.centerButton}
                                onPress={getUserLocation}
                            >
                                <Ionicons name="navigate" size={20} color={Colors.primary.main} />
                            </Pressable>
                        </>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.instructionCard}>
                        <Ionicons name="information-circle" size={16} color={Colors.primary.main} />
                        <Text style={styles.instructionText}>
                            Drag the marker or tap anywhere on the map to select your location
                        </Text>
                    </View>

                    <Button
                        title="Confirm Location"
                        onPress={handleConfirm}
                        fullWidth
                        loading={confirming}
                        icon={<Ionicons name="checkmark" size={20} color={Colors.neutral.white} />}
                    />
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
        paddingTop: 50,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.text.tertiary,
    },
    closeButton: {
        padding: 4,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
    markerContainer: {
        alignItems: 'center',
    },
    markerPin: {
        backgroundColor: Colors.neutral.white,
        padding: 4,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    centerButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        gap: Spacing.md,
    },
    instructionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: Colors.primary.main + '10',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary.main,
    },
    instructionText: {
        flex: 1,
        fontSize: 11,
        color: Colors.text.secondary,
        lineHeight: 16,
    },
})
