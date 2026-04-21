import Loader from '@/components/Loader'
import ParentServiceCard from '@/components/services/ParentServiceCard'
import CheckoutModal from '@/components/checkout/CheckoutModal'
import AlertModal from '@/components/common/AlertModal'
import Colors from '@/constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/Styles'
import { GET_SERVICES_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { ParentService } from '@/types/parent-service'
import { Service } from '@/types/service'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ServiceDetail() {
    const { slug } = useLocalSearchParams<{ slug: string }>()
    const [service, setService] = useState<Service | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedServices, setSelectedServices] = useState<{ [key: number]: number }>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [showCheckoutModal, setShowCheckoutModal] = useState(false)
    const [showInfoModal, setShowInfoModal] = useState(false)

    const refresh = () => {
        setLoading(true)
        fetchService()
    }

    useEffect(() => {
        fetchService()
    }, [slug])

    const fetchService = async () => {
        try {
            const res = await myAxios.get(GET_SERVICES_URL + '/' + slug)
            const service: Service = res.data.data || null
            setService(service)
        } catch (error) {
            console.error('Failed to fetch service:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateQuantity = (serviceId: number, change: number) => {
        setSelectedServices(prev => {
            const current = prev[serviceId] || 0
            const newValue = Math.max(0, current + change)
            if (newValue === 0) {
                const { [serviceId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [serviceId]: newValue }
        })
    }

    const calculateTotal = () => {
        if (!service?.parent_services) return 0
        return Object.entries(selectedServices).reduce((total, [id, quantity]) => {
            const parentService = service.parent_services.find(ps => ps.id === parseInt(id))
            if (!parentService) return total
            const price = parentService.price
            const discount = parentService.discount || 0
            const discountedPrice = parentService.discount_type === 'percentage'
                ? price * (1 - discount / 100)
                : price - discount
            return total + (discountedPrice * quantity)
        }, 0)
    }

    const getTotalItems = () => {
        return Object.values(selectedServices).reduce((sum, qty) => sum + qty, 0)
    }

    const getCheckoutItems = () => {
        return Object.entries(selectedServices).map(([id, quantity]) => {
            const parentService = service?.parent_services.find(ps => ps.id === parseInt(id))
            return {
                serviceId: parseInt(id),
                serviceName: parentService?.name || '',
                quantity,
                price: parentService?.price || 0,
                discount: parentService?.discount || 0,
                discountType: parentService?.discount_type || 'percentage'
            }
        })
    }

    const handleCheckout = () => {
        setShowCheckoutModal(true)
    }

    const filteredServices = service?.parent_services?.filter(ps =>
        ps.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ps.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    if (loading) {
        return <Loader size='medium' fullScreen />
    }

    if (!service) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Service not found</Text>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.white} />

            {/* Custom Header */}
            <View style={styles.customHeader}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                            <Text style={styles.headerTitle}>{service.name}</Text>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="More information"
                                onPress={() => setShowInfoModal(true)}
                            >
                                <Ionicons name="information-circle-outline" size={18} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <Text
                            style={styles.headerSubtitle}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {service.description}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Ionicons
                            name={showFilters ? "close" : "options"}
                            size={22}
                            color={Colors.text.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={Colors.text.tertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search services..."
                        placeholderTextColor={Colors.text.tertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Options */}
                {showFilters && (
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterTitle}>Sort by:</Text>
                        <View style={styles.filterOptions}>
                            <TouchableOpacity style={styles.filterChip}>
                                <Text style={styles.filterChipText}>Price: Low to High</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterChip}>
                                <Text style={styles.filterChipText}>Price: High to Low</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterChip}>
                                <Text style={styles.filterChipText}>Most Popular</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refresh} />
                }
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Parent Services */}
                <View style={styles.servicesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Services</Text>
                        <Text style={styles.servicesCount}>
                            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                        </Text>
                    </View>
                    {filteredServices.length > 0 ? (
                        filteredServices.map((parentService: ParentService) => (
                            <ParentServiceCard
                                key={parentService.id}
                                service={parentService}
                                quantity={selectedServices[parentService.id] || 0}
                                onUpdateQuantity={(change) => updateQuantity(parentService.id, change)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={Colors.text.tertiary} />
                            <Text style={styles.noServicesText}>
                                {searchQuery ? 'No services match your search' : 'No services available'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Checkout Bar */}
            {getTotalItems() > 0 && (
                <View style={styles.checkoutBar}>
                    <View style={styles.checkoutInfo}>
                        <View style={styles.itemsCount}>
                            <Ionicons name="cart" size={20} color={Colors.text.secondary} />
                            <Text style={styles.itemsCountText}>{getTotalItems()} item(s)</Text>
                        </View>
                        <View style={styles.totalSection}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalPrice}>₨{Math.round(calculateTotal())}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                        <Text style={styles.checkoutButtonText}>Checkout</Text>
                        <Ionicons name="arrow-forward" size={20} color={Colors.neutral.white} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Checkout Modal */}
            <CheckoutModal
                visible={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                items={getCheckoutItems()}
                totalAmount={calculateTotal()}
            />
            {/* Info Modal */}
            <AlertModal
                visible={showInfoModal}
                type="info"
                title={service.name}
                message={service.description || ''}
                onClose={() => setShowInfoModal(false)}
                primaryButton={{
                    text: 'Close',
                    onPress: () => setShowInfoModal(false),
                }}
            />
            {/* Floating Support Button */}
            <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => router.push('/customer/support-chat')}
            >
                <Ionicons name="chatbubbles" size={24} color={Colors.neutral.white} />
                <View style={styles.unreadDot} />
            </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.gray[50],
    },
    customHeader: {
        backgroundColor: Colors.neutral.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
        paddingBottom: Spacing.sm,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        gap: Spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: Typography.sizes.xs,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    headerSubtitle: {
        fontSize: Typography.sizes.xs,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[100],
        marginHorizontal: Spacing.md,
        marginTop: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.sizes.sm,
        color: Colors.text.primary,
        padding: 4,
    },
    filterContainer: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xs,
    },
    filterTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    filterChip: {
        backgroundColor: Colors.neutral.gray[100],
        paddingHorizontal: Spacing.xs,
        paddingVertical: 4,
        borderRadius: 6,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: Spacing.xs,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    servicesSection: {
        padding: Spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    servicesCount: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl * 2,
    },
    noServicesText: {
        fontSize: 14,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    checkoutBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.neutral.white,
        padding: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        paddingBottom: Spacing.xxl,
        paddingHorizontal: Spacing.md,
    },
    checkoutInfo: {
        marginBottom: Spacing.sm,
    },
    itemsCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    itemsCountText: {
        fontSize: 13,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.themes.customer.primary,
        paddingVertical: 10,
        borderRadius: BorderRadius.sm,
        gap: 8,
    },
    checkoutButtonText: {
        color: Colors.neutral.white,
        fontSize: 16,
        fontWeight: '700',
    },
    errorText: {
        fontSize: 16,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginTop: Spacing.xl,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 100, // Above the checkout bar if visible
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
        elevation: 5,
    },
    unreadDot: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.error,
        borderWidth: 2,
        borderColor: Colors.neutral.white,
    },
})
