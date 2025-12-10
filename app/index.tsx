import CategoriesCards from '@/components/home/categories-cards'
import HomeHeader from '@/components/home/Header'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function LandingPage() {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <HomeHeader />
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome to Tasker Company</Text>
                    <Text style={styles.subtitle}>Choose a service to get started</Text>
                </View>

                {/* Categories Grid */}
                <CategoriesCards />
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
    content: {
        marginHorizontal: Spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
})
