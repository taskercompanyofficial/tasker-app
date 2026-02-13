import React, { useRef, useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import Colors from '@/constants/Colors'
import { BorderRadius, Spacing } from '@/constants/Styles'

const { width } = Dimensions.get('window')
const CAROUSEL_WIDTH = width
const CAROUSEL_HEIGHT = 160

interface CarouselSlide {
    id: string
    title: string
    subtitle: string
    icon: string
    gradientColors?: string[]
    accentColor: string
    bgImage?: string
}

const slides: CarouselSlide[] = [
    {
        id: '1',
        title: 'Professional Services',
        subtitle: 'Expert technicians at your doorstep',
        icon: 'construct',
        accentColor: Colors.background.secondary,
        bgImage: 'https://hadielectronics.com.pk/wp-content/uploads/2026/01/wa-cover.jpg'
    },
    {
        id: '2',
        title: 'AC Repair & Service',
        subtitle: 'Keep your home cool & comfortable',
        icon: 'snow',
        accentColor: Colors.themes.provider.background,
        bgImage: 'https://aws-obg-image-lb-3.tcl.com/content/dam/brandsite/global/homepage/banner/team-tcl-pc-4.jpg?t=1761819109917&w=2560&webp=true&dpr=1.5&rendition=2400'
    },
    {
        id: '3',
        title: 'Deep Cleaning',
        subtitle: 'Sparkling clean homes guaranteed',
        icon: 'sparkles',
        accentColor: Colors.themes.customer.background,
        bgImage: 'https://global.gree.com/upload/images/2026/1/2c29924cc12b966d.jpg'
    },
    {
        id: '4',
        title: 'Electrical Solutions',
        subtitle: 'Safe & reliable electrical work',
        icon: 'flash',
        accentColor: Colors.background.tertiary,
        bgImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80'
    },
]

export default function PromotionalCarousel() {
    const [activeIndex, setActiveIndex] = useState(0)
    const flatListRef = useRef<FlatList>(null)
    const bgImages = (() => {
        const raw = process.env.EXPO_PUBLIC_PROMO_BG_IMAGES?.trim()
        if (!raw) return [] as string[]
        try {
            const arr = JSON.parse(raw)
            if (Array.isArray(arr)) return arr.filter((x) => typeof x === 'string')
        } catch { }
        return raw.split(',').map((s) => s.trim()).filter(Boolean)
    })()
    const slidesWithBg: CarouselSlide[] = slides.map((s, i) => ({
        ...s,
        bgImage: bgImages[i] || s.bgImage,
    }))

    // Auto-scroll carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => {
                const nextIndex = (current + 1) % slides.length
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                })
                return nextIndex
            })
        }, 4000)

        return () => clearInterval(interval)
    }, [])

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0)
        }
    }).current

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current

    const renderSlide = ({ item }: { item: CarouselSlide }) => (
        <Pressable style={styles.slide} onPress={() => router.push('/customer/(tabs)/services')}>
            <View style={styles.card}>
                <View style={[styles.leftBand, { backgroundColor: item.accentColor + '20' }]} />
                {item.bgImage && (
                    <Image
                        source={{ uri: item.bgImage }}
                        style={styles.bgImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="disk"
                        placeholder={require('@/assets/images/banner-1.png')}
                        onError={() => {
                            // fallback to local banner if remote host blocks hotlinking or fails
                        }}
                    />
                )}
                {/* <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: item.accentColor + '15' }]}>
                        <Ionicons name={item.icon as any} size={28} color={Colors.neutral.white} />
                    </View>
                    <View style={styles.textContent}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.ctaButton}>
                        <Text style={styles.ctaText}>Book Now</Text>
                        <Ionicons name="arrow-forward" size={12} color={Colors.neutral.white} />
                    </View>
                </View> */}
            </View>
        </Pressable>
    )

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={slidesWithBg}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CAROUSEL_WIDTH}
                decelerationRate="fast"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(_, index) => ({
                    length: CAROUSEL_WIDTH,
                    offset: CAROUSEL_WIDTH * index,
                    index,
                })}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    slide: {
        width: CAROUSEL_WIDTH,
        height: CAROUSEL_HEIGHT,
        overflow: 'hidden',
    },
    card: {
        flex: 1,
        backgroundColor: Colors.neutral.gray[200],
        borderWidth: 1,
        borderColor: Colors.border.light,
        position: 'relative',
    },
    bgImage: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    bgOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: Colors.neutral.black,
        opacity: 0.35,
    },
    leftBand: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[100],
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.neutral.white,
        marginBottom: 2,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 11,
        color: Colors.neutral.white,
        lineHeight: 15,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.sm,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        gap: 4,
    },
    ctaText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.neutral.white,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.sm,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.neutral.gray[300],
    },
    dotActive: {
        width: 24,
        backgroundColor: Colors.themes.customer.primary,
    },
})
