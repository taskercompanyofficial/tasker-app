import AlertModal from '@/components/common/AlertModal'
import Input from '@/components/Input'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import useForm from '@/hooks/use-form'
import { COMMERCIAL_QUOTE_URL } from '@/lib/api-endpoints'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

const CAROUSEL_IMAGES = [
    { uri: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80' }, // Factory
    { uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' }, // Office
    { uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80' }, // Warehouse
]

const BUSINESS_TYPES = [
    'Factory/Manufacturing',
    'Office Building',
    'Warehouse',
    'Retail Store',
    'Restaurant/Cafe',
    'Hotel/Hospitality',
    'Healthcare Facility',
    'Educational Institution',
    'Other',
]

const SERVICE_CATEGORIES = [
    'HVAC Services',
    'Electrical Services',
    'Maintenance Services',
    'Other',
]

interface CommercialQuoteForm {
    organizationName: string
    contactPerson: string
    email: string
    phone: string
    address: string
    facilitySize: string
    description: string
    business_type: string
    services: string[]
}

export default function CommercialQuotePage() {
    const { session } = useSession()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const carouselRef = useRef<ScrollView>(null)
    const [alertModal, setAlertModal] = useState({
        visible: false,
        type: 'success' as 'success' | 'error',
        title: '',
        message: '',
    })
    const { data, setData, errors, processing, reset, post } = useForm<CommercialQuoteForm>({
        organizationName: '',
        contactPerson: session.user?.name || '',
        email: session.user?.email || '',
        phone: session.user?.phone || '',
        address: '',
        facilitySize: '',
        description: '',
        business_type: '',
        services: [],
    })

    const toggleService = (service: string) => {
        setData((prev) => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service]
        }))
    }

    const handleCarouselScroll = (event: any) => {
        const slideSize = width - (Spacing.md * 2)
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize)
        setCurrentImageIndex(index)
    }

    const handleSubmit = () => {
        post(COMMERCIAL_QUOTE_URL, {
            onSuccess: (response) => {
                reset()
                setAlertModal({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: response.message || 'Quote request submitted successfully',
                })
            },
            onError: (error) => {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Error',
                    message: error.message,
                })
            }
        })
    }
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Request Quote</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero Section with Carousel */}
                <View style={styles.heroSection}>
                    <ScrollView
                        ref={carouselRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleCarouselScroll}
                        scrollEventThrottle={16}
                        style={styles.carousel}
                    >
                        {CAROUSEL_IMAGES.map((image, index) => (
                            <View key={index} style={styles.carouselSlide}>
                                <Image source={image} style={styles.carouselImage} resizeMode="cover" />
                            </View>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.carouselPagination}>
                        {CAROUSEL_IMAGES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.carouselDot,
                                    currentImageIndex === index && styles.carouselDotActive
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Commercial & Industrial Services</Text>
                        <Text style={styles.heroSubtitle}>
                            Fill out the form below and our team will provide you with a custom quotation
                        </Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.formSection}>
                    {/* Organization Details */}
                    <Text style={styles.sectionTitle}>Organization Details</Text>

                    <Input
                        label="Organization Name *"
                        placeholder="Enter organization name"
                        value={data.organizationName}
                        onChangeText={(text) => setData('organizationName', text)}
                        error={errors.organizationName}
                        leftIcon={<Ionicons name="business-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Business Type *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                            {BUSINESS_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.chip,
                                        data.business_type === type && styles.chipSelected
                                    ]}
                                    onPress={() => setData('business_type', type)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        data.business_type === type && styles.chipTextSelected
                                    ]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        {errors.business_type && <Text style={styles.error}>{errors.business_type}</Text>}
                    </View>

                    {/* Contact Information */}
                    <Text style={styles.sectionTitle}>Contact Information</Text>

                    <Input
                        label="Contact Person *"
                        placeholder="Enter contact person name"
                        value={data.contactPerson}
                        onChangeText={(text) => setData('contactPerson', text)}
                        error={errors.contactPerson}
                        leftIcon={<Ionicons name="person-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    <Input
                        label="Email *"
                        placeholder="Enter email address"
                        value={data.email}
                        onChangeText={(text) => setData('email', text)}
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    <Input
                        label="Phone Number *"
                        placeholder="Enter phone number"
                        value={data.phone}
                        onChangeText={(text) => setData('phone', text)}
                        error={errors.phone}
                        keyboardType="phone-pad"
                        leftIcon={<Ionicons name="call-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    {/* Facility Details */}
                    <Text style={styles.sectionTitle}>Facility Details</Text>

                    <Input
                        label="Facility Address *"
                        placeholder="Enter facility address"
                        value={data.address}
                        onChangeText={(text) => setData('address', text)}
                        error={errors.address}
                        multiline
                        leftIcon={<Ionicons name="location-outline" size={20} color={Colors.text.tertiary} />}
                    />
                    <Input
                        label="Facility Size (sq ft) or quantity of units"
                        placeholder="Enter facility size or quantity of units"
                        value={data.facilitySize}
                        onChangeText={(text) => setData('facilitySize', text)}
                        error={errors.facilitySize}
                        keyboardType="numeric"
                        leftIcon={<Ionicons name="resize-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    {/* Services Required */}
                    <Text style={styles.sectionTitle}>Services Required *</Text>
                    <View style={styles.servicesGrid}>
                        {SERVICE_CATEGORIES.map((service) => (
                            <TouchableOpacity
                                key={service}
                                style={[
                                    styles.serviceCard,
                                    data.services.includes(service) && styles.serviceCardSelected
                                ]}
                                onPress={() => toggleService(service)}
                            >
                                <Ionicons
                                    name={data.services.includes(service) ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={24}
                                    color={data.services.includes(service) ? Colors.primary.main : Colors.text.tertiary}
                                />
                                <Text style={[
                                    styles.serviceText,
                                    data.services.includes(service) && styles.serviceTextSelected
                                ]}>
                                    {service}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {errors.services && <Text style={styles.error}>{errors.services}</Text>}
                    </View>

                    {/* Additional Details */}
                    <Input
                        label="Additional Details"
                        placeholder="Describe your requirements in detail..."
                        value={data.description}
                        onChangeText={(text) => setData('description', text)}
                        error={errors.description}
                        multiline
                        numberOfLines={4}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, processing && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={processing}
                    >
                        <Ionicons name="send" size={20} color={Colors.neutral.white} />
                        <Text style={styles.submitButtonText}>
                            {processing ? 'Submitting...' : 'Submit Quote Request'}
                        </Text>
                    </TouchableOpacity>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={24} color={Colors.primary.main} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>What happens next?</Text>
                            <Text style={styles.infoText}>
                                Our team will review your request and contact you within 24 hours with a detailed quotation tailored to your needs.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Alert Modal */}
            <AlertModal
                visible={alertModal.visible}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => {
                    setAlertModal({ ...alertModal, visible: false })
                    if (alertModal.type === 'success') {
                        router.back()
                    }
                }}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.neutral.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.neutral.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    heroSection: {
        backgroundColor: Colors.neutral.white,
        marginBottom: Spacing.md,
    },
    carousel: {
        height: 180,
    },
    carouselSlide: {
        width: width,
        height: 180,
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    carouselPagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.sm,
    },
    carouselDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.neutral.gray[300],
    },
    carouselDotActive: {
        backgroundColor: Colors.primary.main,
        width: 20,
    },
    heroContent: {
        padding: Spacing.lg,
        paddingTop: Spacing.sm,
        alignItems: 'center',
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 13,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 19,
    },
    formSection: {
        backgroundColor: Colors.neutral.white,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[50],
        borderRadius: 10,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.text.primary,
    },
    textAreaContainer: {
        alignItems: 'flex-start',
        minHeight: 100,
    },
    textArea: {
        minHeight: 80,
    },
    chipContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
        backgroundColor: Colors.neutral.gray[100],
        borderWidth: 1,
        borderColor: Colors.border.light,
        marginRight: Spacing.sm,
    },
    chipSelected: {
        backgroundColor: Colors.primary.main + '15',
        borderColor: Colors.primary.main,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    chipTextSelected: {
        color: Colors.primary.main,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 10,
        backgroundColor: Colors.neutral.gray[50],
        borderWidth: 1,
        borderColor: Colors.border.light,
        width: '48%',
    },
    serviceCardSelected: {
        backgroundColor: Colors.primary.main + '10',
        borderColor: Colors.primary.main,
    },
    serviceText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
        flex: 1,
    },
    serviceTextSelected: {
        color: Colors.primary.main,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary.main,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: Spacing.lg,
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: Colors.neutral.white,
        fontSize: 16,
        fontWeight: '700',
    },
    infoCard: {
        flexDirection: 'row',
        gap: Spacing.sm,
        backgroundColor: Colors.primary.main + '10',
        padding: Spacing.md,
        borderRadius: 12,
        marginTop: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.primary.main + '30',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: Colors.text.secondary,
        lineHeight: 18,
    },
    error: {
        color: Colors.error,
        fontSize: 12,
        marginTop: Spacing.sm,
    },
})
