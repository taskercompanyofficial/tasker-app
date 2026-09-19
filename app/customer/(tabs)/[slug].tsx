import HomeHeader from '@/components/home/Header'
import PromotionalCarousel from '@/components/home/PromotionalCarousel'
import ServicesCard from '@/components/home/services-card'
import Loader from '@/components/Loader'
import TrendingServicesCarousel from '@/components/services/TrendingServicesCarousel'
import Colors from '@/constants/Colors'
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/Styles'
import { useFetchTrendingParentServices } from '@/hooks/useFetchTrendingParentServices'
import { GET_CATEGORIES_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Category } from '@/types/category'
import { FontAwesome, Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

let lastKnownSlug: string | null = null;

export default function Index() {
    const params = useLocalSearchParams<{ slug: string }>();
    const slug = params.slug || lastKnownSlug;

    useEffect(() => {
        if (params.slug) {
            lastKnownSlug = params.slug;
        }
    }, [params.slug]);

    useEffect(() => {
        if (!slug) {
            router.replace('/customer/index');
        }
    }, [slug]);

    const [category, setCategory] = useState<Category | null>(null)
    const [loading, setLoading] = useState(true)
    const { data: trending, loading: trendingLoading } = useFetchTrendingParentServices(10)

    const refresh = () => {
        setLoading(true)
        fetchCategory()
    }

    useEffect(() => {
        fetchCategory()
    }, [slug])

    const fetchCategory = async () => {
        try {
            const res = await myAxios.get(GET_CATEGORIES_URL + '/' + slug)
            const category: Category = res.data.data || null
            setCategory(category)
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

    const isComingSoon = category?.status === 'comming-soon'

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
                {!isComingSoon && <PromotionalCarousel />}

                {isComingSoon ? (
                    <View style={styles.comingSoonContainer}>
                        <View style={styles.comingSoonCard}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="rocket-outline" size={48} color={Colors.themes.customer.primary} />
                            </View>
                            <Text style={styles.comingSoonTitle}>Launching Soon!</Text>
                            <Text style={styles.comingSoonSubtitle}>
                                We are working hard to bring {category?.name || 'this category'} to your doorstep. Stay tuned for updates!
                            </Text>
                            <TouchableOpacity
                                style={styles.notifyButton}
                                onPress={() => router.push('/customer/(tabs)/services')}
                            >
                                <Text style={styles.notifyButtonText}>Explore Other Services</Text>
                                <Ionicons name="arrow-forward" size={16} color={Colors.neutral.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <ServicesCard data={category || undefined} />
                )}
                {!isComingSoon &&
                    <TrendingServicesCarousel
                        items={trending || []}
                        loading={trendingLoading}
                        onViewAll={() => router.push('/customer/(tabs)/services')}
                    />
                }
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    comingSoonContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xl,
    },
    comingSoonCard: {
        backgroundColor: Colors.background.secondary,
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        borderWidth: 0.4,
        borderColor: Colors.border.light,
        gap: Spacing.md,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.themes.customer.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    comingSoonTitle: {
        fontSize: Typography.sizes.xl,
        fontWeight: '800',
        color: Colors.text.primary,
        textAlign: 'center',
    },
    comingSoonSubtitle: {
        fontSize: Typography.sizes.sm,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: Spacing.md,
    },
    notifyButton: {
        backgroundColor: Colors.themes.customer.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.sm,
        gap: Spacing.xs,
    },
    notifyButtonText: {
        color: Colors.neutral.white,
        fontWeight: '700',
        fontSize: Typography.sizes.sm,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#25D366', // WhatsApp green
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
