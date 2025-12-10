import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '@/constants/Colors'

const { width, height } = Dimensions.get('window')

export default function Splash() {
    const fadeAnim = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(0.8)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start()
    }, [])

    return (
        <View style={styles.container}>
            {/* Background Decoration */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo Icon - HVAC Theme */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        {/* AC/Snowflake icon representing cooling services */}
                        <Ionicons name="snow" size={64} color={Colors.neutral.white} />
                        <View style={styles.toolIcon}>
                            {/* Water drop for appliances like washing machine, geyser */}
                            <Ionicons name="water" size={28} color={Colors.neutral.white} />
                        </View>
                    </View>
                </View>

                {/* App Name */}
                <Text style={styles.appName}>Tasker Company</Text>
                <Text style={styles.tagline}>HVAC & Home Appliance Experts</Text>

                {/* Loading Indicator */}
                <View style={styles.loadingContainer}>
                    <Animated.View
                        style={[
                            styles.loadingDot,
                            {
                                opacity: fadeAnim,
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.loadingDot,
                            {
                                opacity: fadeAnim,
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.loadingDot,
                            {
                                opacity: fadeAnim,
                            },
                        ]}
                    />
                </View>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by Tasker Company</Text>
                <Text style={styles.version}>Version 1.0.0</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.primary.main + '10',
        top: -100,
        right: -100,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.secondary.main + '08',
        bottom: -50,
        left: -50,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: Colors.primary.light + '15',
        top: height / 2,
        right: -50,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 32,
    },
    logoCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        position: 'relative',
    },
    toolIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: Colors.secondary.main,
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.neutral.white,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginBottom: 48,
        fontWeight: '400',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary.main,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: Colors.text.tertiary,
        marginBottom: 4,
    },
    version: {
        fontSize: 11,
        color: Colors.text.tertiary,
    },
})
