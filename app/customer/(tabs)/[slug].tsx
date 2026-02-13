import HomeHeader from '@/components/home/Header'
import PromotionalCarousel from '@/components/home/PromotionalCarousel'
import ServicesCard from '@/components/home/services-card'
import Loader from '@/components/Loader'
import TrendingServicesCarousel from '@/components/services/TrendingServicesCarousel'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useFetchTrendingParentServices } from '@/hooks/useFetchTrendingParentServices'
import { GET_CATEGORIES_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Category } from '@/types/category'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
    const { slug } = useLocalSearchParams<{ slug: string }>()
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
            const category: Category = res.data.data || []
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
                <PromotionalCarousel />

                <ServicesCard data={category || undefined} />

                <TrendingServicesCarousel
                    items={trending || []}
                    loading={trendingLoading}
                    onViewAll={() => router.push('/customer/(tabs)/services')}
                />
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
})
