import CategoriesCards from '@/components/home/categories-cards'
import HomeHeader from '@/components/home/Header'
import PromotionalCarousel from '@/components/home/PromotionalCarousel'
import ServicesCard from '@/components/home/services-card'
import Loader from '@/components/Loader'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { GET_CATEGORIES_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Category } from '@/types/category'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

const quickActions = [
    { id: '1', name: 'Book Now', icon: 'calendar', color: Colors.primary.main },
    { id: '2', name: 'My Orders', icon: 'receipt', color: Colors.secondary.main },
    { id: '3', name: 'Support', icon: 'headset', color: '#10B981' },
    { id: '4', name: 'Offers', icon: 'pricetag', color: '#8B5CF6' },
]

export default function Index() {
    const { slug } = useLocalSearchParams<{ slug: string }>()
    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)
    const refresh = () => {
        setLoading(true)
        fetchCategory()
    }
    useEffect(() => {
        fetchCategory()
    }, [slug])

    const fetchCategory = async () => {
        try {
            const res = await myAxios.get(GET_CATEGORIES_URL)
            const categories: Category[] = res.data.data || []
            const foundCategory = categories.find(cat => cat.slug === slug)
            setCategory(foundCategory || null)
        } catch (error) {
            console.error('Failed to fetch category:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Loader size='medium' fullScreen />
        )
    }
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <HomeHeader />
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refresh}
                    />
                }
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <ServicesCard data={category || []} />
                {/* Promotional Carousel */}
                <PromotionalCarousel />
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Browse Categories</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                {/* Popular Services */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Popular Services</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.popularGrid}>
                        {[
                            { id: 1, name: 'AC Repair', icon: 'snow', price: '$50' },
                            { id: 2, name: 'Cleaning', icon: 'sparkles', price: '$80' },
                            { id: 3, name: 'Plumbing', icon: 'water', price: '$40' },
                            { id: 4, name: 'Electrical', icon: 'flash', price: '$45' },
                        ].map((service) => (
                            <TouchableOpacity key={service.id} style={styles.popularCard} activeOpacity={0.7}>
                                <View style={styles.popularIconContainer}>
                                    <Ionicons name={service.icon as any} size={22} color={Colors.primary.main} />
                                </View>
                                <View style={styles.popularInfo}>
                                    <Text style={styles.popularTitle}>{service.name}</Text>
                                    <View style={styles.popularFooter}>
                                        <View style={styles.ratingBadge}>
                                            <Ionicons name="star" size={10} color="#F59E0B" />
                                            <Text style={styles.ratingText}>4.8</Text>
                                        </View>
                                        <Text style={styles.popularPrice}>{service.price}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Why Choose Us */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why Choose Us</Text>
                    <View style={styles.featuresContainer}>
                        {[
                            { icon: 'shield-checkmark', title: 'Verified Professionals', color: '#10B981' },
                            { icon: 'time', title: 'On-Time Service', color: '#F59E0B' },
                            { icon: 'star', title: 'Top Rated', color: '#8B5CF6' },
                        ].map((feature, index) => (
                            <View key={index} style={styles.featureCard}>
                                <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                                    <Ionicons name={feature.icon as any} size={18} color={feature.color} />
                                </View>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.gray[50],
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
        paddingHorizontal: Spacing.md,
        paddingVertical: 11,
        borderRadius: 10,
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    searchPlaceholder: {
        fontSize: 13,
        color: Colors.text.tertiary,
    },
    filterButton: {
        width: 44,
        height: 44,
        backgroundColor: Colors.neutral.white,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    quickActionCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
        paddingVertical: Spacing.sm,
        borderRadius: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    quickActionIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    seeAllText: {
        fontSize: 12,
        color: Colors.primary.main,
        fontWeight: '600',
    },
    popularGrid: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    popularCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
        borderRadius: 10,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
        gap: Spacing.sm,
    },
    popularIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: Colors.primary.main + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popularInfo: {
        flex: 1,
    },
    popularTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    popularFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#92400E',
    },
    popularPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary.main,
    },
    featuresContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    featureCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
        paddingVertical: Spacing.md,
        borderRadius: 10,
        gap: Spacing.xs,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    featureIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.secondary,
        textAlign: 'center',
    },
})