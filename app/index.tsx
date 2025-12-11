import CategoriesCards from '@/components/home/categories-cards'
import HomeHeader from '@/components/home/Header'
import IndustrialServicesCard from '@/components/home/industrial-servies-card'
import FreeInstallationCard from '@/components/home/free-installation-card'
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
                <CategoriesCards />
                <FreeInstallationCard />
                <IndustrialServicesCard />
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    content: {
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: "#000000",
        marginBottom: Spacing.md,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
    },
})
