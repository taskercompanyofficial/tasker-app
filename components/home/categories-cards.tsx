import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { BACKEND_URL, GET_CATEGORIES_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Category } from '@/types/category'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Loader from '../Loader'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width * 0.42

export default function CategoriesCards() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const fetchCategories = async () => {
        try {
            const res = await myAxios.get(GET_CATEGORIES_URL)
            const fetchedCategories: Category[] = res.data.data || []
            setCategories(fetchedCategories)
        } catch (error) {
            console.error("Failed to fetch categories:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])
    const renderCategoryCard = ({ item }: { item: Category }) => {
        const imageUrl = item.image ? `${BACKEND_URL}/storage/${item.image}` : null
        const tagCount = Array.isArray(item.tags) ? item.tags.length : 0

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/(tabs)/${item.slug}` as any)}
            >
                {/* Image */}
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={[styles.image, styles.placeholderImage]}>
                            <Ionicons name="image-outline" size={32} color={Colors.text.tertiary} />
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.categoryName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {item.description && (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.description.slice(0, 20).concat('...')}
                        </Text>
                    )}

                    {/* Tags Badge */}
                    {tagCount > 0 && (
                        <View style={styles.tagBadge}>
                            <Ionicons name="pricetag" size={10} color={Colors.primary.main} />
                            <Text style={styles.tagCount}>{tagCount} services</Text>
                        </View>
                    )}
                </View>

                {/* Status Indicator */}
                {item.status === 'active' && (
                    <View style={styles.activeIndicator} />
                )}
            </TouchableOpacity>
        )
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Loader fullScreen size='small' />
            </SafeAreaView>
        )
    }
    return (
        <View style={styles.container}>
            <FlatList
                data={categories}
                renderItem={renderCategoryCard}
                keyExtractor={(item) => item.id.toString()}
                horizontal={false}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={<View style={styles.emptyContainer}>
                    <Ionicons name="grid-outline" size={48} color={Colors.text.tertiary} />
                    <Text style={styles.emptyText}>No categories available</Text>
                </View>}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.md,
        flex: 1,
        height: '100%',
    },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: Colors.neutral.white,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    imageContainer: {
        width: '100%',
        height: 100,
        position: 'relative',
        backgroundColor: Colors.neutral.gray[100],
        borderRadius: 12,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    placeholderImage: {
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    content: {
        padding: 10,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    description: {
        fontSize: 11,
        color: Colors.text.tertiary,
        lineHeight: 15,
        marginBottom: 8,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary.main + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    tagCount: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.primary.main,
    },
    activeIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.neutral.white,
    },
    loadingContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 13,
        color: Colors.text.tertiary,
    },
    emptyContainer: {
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    emptyText: {
        fontSize: 13,
        color: Colors.text.tertiary,
        fontWeight: '500',
    },
})