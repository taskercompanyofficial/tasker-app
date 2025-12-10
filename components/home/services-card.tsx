import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import getImageUrl from '@/lib/utils'
import { Category } from '@/types/category'
import { EvilIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React from 'react'
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const { width } = Dimensions.get('window')
const SERVICES_PER_ROW = 3
const CARD_SPACING = Spacing.sm
const CARD_WIDTH = (width - (Spacing.md * 2) - (CARD_SPACING * (SERVICES_PER_ROW - 1))) / SERVICES_PER_ROW

export default function ServicesCard({ data }: { data?: Category }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{data?.name}</Text>
            <Text style={styles.description}>{data?.description}</Text>
            {data?.services && data.services.length > 0 ? (
                <View style={styles.imageContainer}>
                    {data?.services?.map((service) => (
                        <TouchableOpacity key={service.slug} style={styles.serviceCard} onPress={() => { router.push(`/services/${service.slug}`) }}>
                            <Image
                                source={{ uri: getImageUrl(service.image) }}
                                style={styles.image}
                                contentFit="contain"
                            />
                            <Text style={styles.imageText} numberOfLines={2}>
                                {service.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.noServicesContainer}>
                    <Text style={styles.noServicesText}>No services available</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    description: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginBottom: Spacing.md,
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_SPACING,
    },
    serviceCard: {
        width: CARD_WIDTH,
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
        borderRadius: 12,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    image: {
        width: 48,
        height: 48,
        marginBottom: Spacing.xs,
    },
    imageText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.primary,
        textAlign: 'center',
        lineHeight: 13,
    },
    noServicesText: {
        fontSize: 13,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    noServicesContainer: {
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
    },
})
