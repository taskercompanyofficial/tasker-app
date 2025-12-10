import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '@/constants/Colors'

interface LoaderProps {
    size?: 'small' | 'medium' | 'large'
    fullScreen?: boolean
}

export default function Loader({ size = 'medium', fullScreen = false }: LoaderProps) {
    const spinValue = useRef(new Animated.Value(0)).current
    const scaleValue1 = useRef(new Animated.Value(1)).current
    const scaleValue2 = useRef(new Animated.Value(1)).current
    const scaleValue3 = useRef(new Animated.Value(1)).current
    const fadeValue = useRef(new Animated.Value(0)).current
    const breatheValue = useRef(new Animated.Value(1)).current
    const glowValue = useRef(new Animated.Value(0.3)).current

    useEffect(() => {
        // Fade in animation on mount
        Animated.timing(fadeValue, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
        }).start()

        // Spin animation
        const spinAnimation = Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        )

        // Breathing animation for center icon
        const breatheAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(breatheValue, {
                    toValue: 1.15,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(breatheValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        )

        // Glow pulse animation
        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(glowValue, {
                    toValue: 0.3,
                    duration: 1500,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ])
        )

        // Pulse animation for dots
        const pulseAnimation = (scaleValue: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(scaleValue, {
                        toValue: 1.3,
                        duration: 400,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1,
                        duration: 400,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            )

        spinAnimation.start()
        breatheAnimation.start()
        glowAnimation.start()
        pulseAnimation(scaleValue1, 0).start()
        pulseAnimation(scaleValue2, 200).start()
        pulseAnimation(scaleValue3, 400).start()

        return () => {
            spinAnimation.stop()
            breatheAnimation.stop()
            glowAnimation.stop()
        }
    }, [])

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    })

    const getSizes = () => {
        switch (size) {
            case 'small':
                return { icon: 24, dot: 6, container: 60 }
            case 'large':
                return { icon: 48, dot: 10, container: 120 }
            default:
                return { icon: 36, dot: 8, container: 90 }
        }
    }

    const sizes = getSizes()

    const loaderContent = (
        <Animated.View
            style={[
                styles.loaderContainer,
                {
                    width: sizes.container,
                    height: sizes.container,
                    opacity: fadeValue,
                }
            ]}
        >
            {/* Spinning outer circle with glow */}
            <Animated.View
                style={[
                    styles.outerCircle,
                    {
                        width: sizes.container,
                        height: sizes.container,
                        borderRadius: sizes.container / 2,
                        transform: [{ rotate: spin }],
                        opacity: glowValue,
                    },
                ]}
            >
                <View style={styles.circleSegment} />
            </Animated.View>

            {/* Center icon with breathing effect */}
            <Animated.View
                style={[
                    styles.centerIcon,
                    {
                        transform: [{ scale: breatheValue }],
                    }
                ]}
            >
                <Ionicons name="snow" size={sizes.icon} color={Colors.primary.main} />
            </Animated.View>

            {/* Pulsing dots at bottom */}
            <View style={styles.dotsContainer}>
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            width: sizes.dot,
                            height: sizes.dot,
                            borderRadius: sizes.dot / 2,
                            transform: [{ scale: scaleValue1 }],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            width: sizes.dot,
                            height: sizes.dot,
                            borderRadius: sizes.dot / 2,
                            transform: [{ scale: scaleValue2 }],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            width: sizes.dot,
                            height: sizes.dot,
                            borderRadius: sizes.dot / 2,
                            transform: [{ scale: scaleValue3 }],
                        },
                    ]}
                />
            </View>
        </Animated.View>
    )

    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                {loaderContent}
            </View>
        )
    }

    return loaderContent
}

const styles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
    },
    loaderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    outerCircle: {
        position: 'absolute',
        borderWidth: 3,
        borderColor: 'transparent',
        borderTopColor: Colors.primary.main,
        borderRightColor: Colors.primary.light,
    },
    circleSegment: {
        width: '100%',
        height: '100%',
    },
    centerIcon: {
        zIndex: 1,
    },
    dotsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: -20,
        gap: 6,
    },
    dot: {
        backgroundColor: Colors.primary.main,
    },
})
