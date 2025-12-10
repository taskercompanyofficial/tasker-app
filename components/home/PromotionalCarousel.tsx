import React, { useRef, useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'

const { width } = Dimensions.get('window')
const CAROUSEL_WIDTH = width - (Spacing.md * 2)
const CAROUSEL_HEIGHT = 140

interface CarouselSlide {
    id: string
    title: string
    subtitle: string
    icon: string
    gradientColors: string[]
    accentColor: string
}

const slides: CarouselSlide[] = [
    {
        id: '1',
        title: 'Professional Services',
        subtitle: 'Expert technicians at your doorstep',
        icon: 'construct',
        gradientColors: ['#F43F5E', '#BE123C'],
        accentColor: '#FFF1F2',
    },
    {
        id: '2',
        title: 'AC Repair & Service',
        subtitle: 'Keep your home cool & comfortable',
        icon: 'snow',
        gradientColors: ['#3B82F6', '#1E40AF'],
        accentColor: '#EFF6FF',
    },
    {
        id: '3',
        title: 'Deep Cleaning',
        subtitle: 'Sparkling clean homes guaranteed',
        icon: 'sparkles',
        gradientColors: ['#10B981', '#047857'],
        accentColor: '#ECFDF5',
    },
    {
        id: '4',
        title: 'Electrical Solutions',
        subtitle: 'Safe & reliable electrical work',
        icon: 'flash',
        gradientColors: ['#F59E0B', '#D97706'],
        accentColor: '#FEF3C7',
    },
]

export default function PromotionalCarousel() {
    const [activeIndex, setActiveIndex] = useState(0)
    const flatListRef = useRef<FlatList>(null)

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
        <Pressable style={styles.slide}>
            <LinearGradient
                colors={item.gradientColors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Decorative circles */}
                <View style={[styles.circle, styles.circle1, { backgroundColor: item.accentColor + '20' }]} />
                <View style={[styles.circle, styles.circle2, { backgroundColor: item.accentColor + '15' }]} />
                <View style={[styles.circle, styles.circle3, { backgroundColor: item.accentColor + '10' }]} />

                <View style={styles.content}>
                    {/* Icon Container */}
                    <View style={[styles.iconContainer, { backgroundColor: item.accentColor }]}>
                        <Ionicons name={item.icon as any} size={40} color={item.gradientColors[0]} />
                    </View>

                    {/* Text Content */}
                    <View style={styles.textContent}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                    </View>

                    {/* CTA Button */}
                    <View style={[styles.ctaButton, { backgroundColor: item.accentColor }]}>
                        <Text style={[styles.ctaText, { color: item.gradientColors[1] }]}>Book Now</Text>
                        <Ionicons name="arrow-forward" size={16} color={item.gradientColors[1]} />
                    </View>
                </View>
            </LinearGradient>
        </Pressable>
    )

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CAROUSEL_WIDTH + Spacing.sm}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContent}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={(_, index) => ({
                    length: CAROUSEL_WIDTH + Spacing.sm,
                    offset: (CAROUSEL_WIDTH + Spacing.sm) * index,
                    index,
                })}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === activeIndex && styles.dotActive,
                        ]}
                    />
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    carouselContent: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    slide: {
        width: CAROUSEL_WIDTH,
        height: CAROUSEL_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    gradient: {
        flex: 1,
        position: 'relative',
    },
    circle: {
        position: 'absolute',
        borderRadius: 999,
    },
    circle1: {
        width: 120,
        height: 120,
        top: -40,
        right: -30,
    },
    circle2: {
        width: 80,
        height: 80,
        bottom: -20,
        left: -20,
    },
    circle3: {
        width: 60,
        height: 60,
        top: 60,
        right: 40,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
        marginVertical: Spacing.sm,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.neutral.white,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 13,
        color: Colors.neutral.white,
        opacity: 0.95,
        lineHeight: 18,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '700',
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
        backgroundColor: Colors.primary.main,
    },
})
