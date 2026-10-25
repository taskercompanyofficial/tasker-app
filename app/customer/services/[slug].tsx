import AppTextInput from "@/components/common/AppTextInput";
import DirectionalIcon from "@/components/common/DirectionalIcon";
import AppText from "@/components/common/AppText";
import { useLanguage } from '@/context/language-context'
import CheckoutModal from '@/components/checkout/CheckoutModal'
import AlertModal from '@/components/common/AlertModal'
import Loader from '@/components/Loader'
import ParentServiceCard from '@/components/services/ParentServiceCard'
import Colors from '@/constants/Colors'
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/Styles'
import { GET_SERVICES_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { ParentService } from '@/types/parent-service'
import { Service } from '@/types/service'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ServiceDetail() {
    const { t } = useLanguage()
    const { slug } = useLocalSearchParams<{ slug: string }>()
    const [service, setService] = useState<Service | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedServices, setSelectedServices] = useState<{ [key: number]: number }>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [showInfoModal, setShowInfoModal] = useState(false)
    const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc' | 'popular'>('default')

    const checkoutModalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()

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
        checkoutModalRef.current?.present()
    }

    const filteredServices = (service?.parent_services || [])
        .filter(ps =>
            ps.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ps.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortOrder === 'price-asc') return a.price - b.price
            if (sortOrder === 'price-desc') return b.price - a.price
            if (sortOrder === 'popular') return (b.usage_count ?? b.rating ?? 0) - (a.usage_count ?? a.rating ?? 0)
            return 0
        })

    if (loading) {
        return <Loader size='medium' fullScreen />
    }

    if (!service) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <AppText style={styles.errorText}>{t.customer.services.serviceNotFound}</AppText>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.white} />

            {/* Custom Header */}
            <View style={[styles.customHeader, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <DirectionalIcon name="arrow-back" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                            <AppText style={styles.headerTitle}>{service.name}</AppText>
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel={t.common.moreInformation}
                                onPress={() => setShowInfoModal(true)}
                            >
                                <Ionicons name="information-circle-outline" size={18} color={Colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <AppText
                            style={styles.headerSubtitle}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {service.description}
                        </AppText>
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
                    <AppTextInput
                        style={styles.searchInput}
                        placeholder={t.customer.services.searchPlaceholder}
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
                        <AppText style={styles.filterTitle}>{t.customer.services.sortBy}</AppText>
                        <View style={styles.filterOptions}>
                            <TouchableOpacity style={styles.filterChip} onPress={() => setSortOrder('price-asc')}>
                                <AppText style={styles.filterChipText}>{t.customer.services.priceLowToHigh}</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterChip} onPress={() => setSortOrder('price-desc')}>
                                <AppText style={styles.filterChipText}>{t.customer.services.priceHighToLow}</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.filterChip} onPress={() => setSortOrder('popular')}>
                                <AppText style={styles.filterChipText}>{t.customer.services.mostPopular}</AppText>
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
                        <AppText style={styles.sectionTitle}>{t.customer.services.availableServices}</AppText>
                        <AppText style={styles.servicesCount}>
                            {filteredServices.length} {filteredServices.length === 1 ? t.customer.services.serviceCount : t.customer.services.servicesCount}
                        </AppText>
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
                            <AppText style={styles.noServicesText}>
                                {searchQuery ? t.customer.services.noMatchSearch : t.common.noServicesAvailable}
                            </AppText>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Checkout Bar */}
            {getTotalItems() > 0 && (
                <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 12) + Spacing.sm }]}>
                    <View style={styles.checkoutInfo}>
                        <View style={styles.itemsCount}>
                            <Ionicons name="cart" size={20} color={Colors.text.secondary} />
                            <AppText style={styles.itemsCountText}>{getTotalItems()} {t.common.items}</AppText>
                        </View>
                        <View style={styles.totalSection}>
                            <AppText style={styles.totalLabel}>{t.common.total}</AppText>
                            <AppText style={styles.totalPrice}>₨{Math.round(calculateTotal())}</AppText>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                        <AppText style={styles.checkoutButtonText}>{t.common.checkout}</AppText>
                        <DirectionalIcon name="arrow-forward" size={20} color={Colors.neutral.white} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Checkout Modal */}
            <CheckoutModal
                ref={checkoutModalRef}
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
        </View>
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
