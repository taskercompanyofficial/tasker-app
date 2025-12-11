import AlertModal from '@/components/common/AlertModal'
import AddressSelector from '@/components/AddressSelector'
import Input from '@/components/Input'
import Select from '@/components/Select'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import useForm from '@/hooks/use-form'
import { FREE_INSTALLATION_URL, GET_AUTHORIZED_BRANDS_URL } from '@/lib/api-endpoints'
import myAxios from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
    Dimensions,
    Image,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

const CAROUSEL_IMAGES = [
    { uri: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80' }, // Factory
    { uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' }, // Office
    { uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80' }, // Warehouse
]

const PRODUCT_TYPES = [
    { value: 'washing_machine', label: 'Washing Machine', icon: 'water' },
    { value: 'air_conditioner', label: 'Air Conditioner', icon: 'snow' },
]

interface FreeInstallationForm {
    contact_person: string
    phone: string
    product_type: string
    brand_id: string
    product_model: string
    purchase_date: string
    invoice_image: File | null
    warranty_image: File | null
    is_delivered: number
    is_wiring_done: number
    outdoor_bracket_needed: number
    extra_pipes: number
    extra_holes: number
    city: string
    address_id: string
}

interface Brand {
    id: number
    name: string
    has_free_installation_service: boolean
}

interface Address {
    id: number
    address_type: string
    address_line_1: string
    address_line_2: string | null
    city: string
    state: string
}

export default function FreeInstallationPage() {
    const { session } = useSession()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [brands, setBrands] = useState<Brand[]>([])
    const [selectedAddress, setSelectedAddress] = useState<number | null>(null)
    const [invoiceUri, setInvoiceUri] = useState<string | null>(null)
    const [warrantyUri, setWarrantyUri] = useState<string | null>(null)
    const [showCamera, setShowCamera] = useState(false)
    const [cameraType, setCameraType] = useState<'invoice' | 'warranty'>('invoice')
    const [permission, requestPermission] = useCameraPermissions()
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [purchaseDate, setPurchaseDate] = useState(new Date())
    const cameraRef = useRef<any>(null)
    const [alertModal, setAlertModal] = useState({
        visible: false,
        type: 'success' as 'success' | 'error',
        title: '',
        message: '',
    })

    const { data, setData, errors, processing, post } = useForm<FreeInstallationForm>({
        contact_person: session.user?.name || '',
        phone: session.user?.phone || '',
        product_type: '',
        brand_id: '',
        product_model: '',
        purchase_date: '',
        invoice_image: null,
        warranty_image: null,
        is_delivered: 0,
        is_wiring_done: 0,
        outdoor_bracket_needed: 0,
        extra_pipes: 0,
        extra_holes: 0,
        city: '',
        address_id: '',
    })

    useEffect(() => {
        fetchBrands()
    }, [])

    const fetchBrands = async () => {
        try {
            const response = await myAxios.get(GET_AUTHORIZED_BRANDS_URL)
            const allBrands = response.data.data || []
            const freeBrands = allBrands.filter((brand: Brand) => brand.has_free_installation_service)
            setBrands(freeBrands)
        } catch (error) {
            console.error('Error fetching brands:', error)
        }
    }


    const pickImage = async (type: 'invoice' | 'warranty') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (status !== 'granted') {
            setAlertModal({
                visible: true,
                type: 'error',
                title: 'Permission Denied',
                message: 'Camera roll permissions are required.',
            })
            return
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri
            const filename = uri.split('/').pop() || `${type}.jpg`
            const match = /\.(\w+)$/.exec(filename)
            const fileType = match ? `image/${match[1]}` : 'image/jpeg'

            const file = {
                uri,
                name: filename,
                type: fileType,
            } as any

            if (type === 'invoice') {
                setInvoiceUri(uri)
                setData('invoice_image', file)
            } else {
                setWarrantyUri(uri)
                setData('warranty_image', file)
            }
        }
    }

    const openCamera = async (type: 'invoice' | 'warranty') => {
        if (!permission?.granted) {
            const result = await requestPermission()
            if (!result.granted) {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Permission Denied',
                    message: 'Camera permissions are required.',
                })
                return
            }
        }
        setCameraType(type)
        setShowCamera(true)
    }

    const handleTakePhoto = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync()
            const uri = photo.uri
            const filename = `${cameraType}_${Date.now()}.jpg`

            const file = {
                uri,
                name: filename,
                type: 'image/jpeg',
            } as any

            if (cameraType === 'invoice') {
                setInvoiceUri(uri)
                setData('invoice_image', file)
            } else {
                setWarrantyUri(uri)
                setData('warranty_image', file)
            }
            setShowCamera(false)
        }
    }

    const handleCarouselScroll = (event: any) => {
        const slideSize = width - (Spacing.md * 2)
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize)
        setCurrentImageIndex(index)
    }

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios')
        if (selectedDate) {
            setPurchaseDate(selectedDate)
            const formattedDate = selectedDate.toISOString().split('T')[0]
            setData('purchase_date', formattedDate)
        }
    }

    const handleSubmit = () => {
        post(FREE_INSTALLATION_URL, {
            onSuccess: (response) => {
                setAlertModal({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: response.message || 'Application submitted successfully!',
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
                <Text style={styles.headerTitle}>Free Installation</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={processing}
                        onRefresh={() => {
                            fetchBrands()
                        }}
                    />
                }
            >
                {/* Hero Carousel */}
                <View style={styles.heroSection}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleCarouselScroll}
                        scrollEventThrottle={16}
                        style={styles.carousel}
                    >
                        {CAROUSEL_IMAGES.map((image, index) => (
                            <View key={index} style={[styles.carouselSlide, { width: width - (Spacing.md * 2) }]}>
                                <Image source={image} style={styles.carouselImage} resizeMode="cover" />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                                    style={styles.carouselGradient}
                                />
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.paginationDots}>
                        {CAROUSEL_IMAGES.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    currentImageIndex === index && styles.activeDot
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={20} color="#10B981" />
                    <Text style={styles.infoBannerText}>
                        First installation only • Available in 4 major cities
                    </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>

                    <Input
                        label="Contact Person"
                        placeholder="Enter your name"
                        value={data.contact_person}
                        onChangeText={(text) => setData('contact_person', text)}
                        error={errors.contact_person}
                        leftIcon={<Ionicons name="person-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    <Input
                        label="Phone Number"
                        placeholder="Enter phone number"
                        value={data.phone}
                        onChangeText={(text) => setData('phone', text)}
                        error={errors.phone}
                        keyboardType="phone-pad"
                        leftIcon={<Ionicons name="call-outline" size={20} color={Colors.text.tertiary} />}
                    />
                </View>

                {/* Address Selection */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Installation Address</Text>
                    <AddressSelector
                        selectedAddressId={selectedAddress}
                        onSelectAddress={(addressId, address) => {
                            setSelectedAddress(addressId)
                            setData('address_id', addressId.toString())
                            setData('city', address.city)
                        }}
                        error={errors.address_id}
                    />
                </View>

                {/* Product Information */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Product Information</Text>

                    {/* Product Type */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Product Type</Text>
                        <View style={styles.productTypeGrid}>
                            {PRODUCT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.productTypeCard,
                                        data.product_type === type.value && styles.productTypeCardActive
                                    ]}
                                    onPress={() => setData('product_type', type.value)}
                                >
                                    <Ionicons
                                        name={type.icon as any}
                                        size={32}
                                        color={data.product_type === type.value ? Colors.primary.main : Colors.text.tertiary}
                                    />
                                    <Text style={[
                                        styles.productTypeText,
                                        data.product_type === type.value && styles.productTypeTextActive
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.product_type && <Text style={styles.error}>{errors.product_type}</Text>}
                    </View>

                    {/* Brand Selection */}
                    <Select
                        label="Brand"
                        placeholder="Select brand"
                        value={data.brand_id}
                        options={brands.map(brand => ({ label: brand.name, value: brand.id.toString() }))}
                        onSelect={(value) => setData('brand_id', value)}
                        error={errors.brand_id}
                        leftIcon={<Ionicons name="pricetag-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    <Input
                        label="Product Model"
                        placeholder="e.g., ABC-123"
                        value={data.product_model}
                        onChangeText={(text) => setData('product_model', text)}
                        error={errors.product_model}
                        leftIcon={<Ionicons name="cube-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    {/* Date Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Purchase</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={Colors.text.tertiary} />
                            <Text style={styles.dateText}>
                                {data.purchase_date || 'Select purchase date'}
                            </Text>
                        </TouchableOpacity>
                        {errors.purchase_date && <Text style={styles.error}>{errors.purchase_date}</Text>}
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={purchaseDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                {/* Document Uploads */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Documents</Text>

                    {/* Invoice Upload */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Invoice Image</Text>
                        {invoiceUri ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: invoiceUri }} style={styles.uploadedImage} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => {
                                        setInvoiceUri(null)
                                        setData('invoice_image', null)
                                    }}
                                >
                                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadOptions}>
                                <TouchableOpacity
                                    style={styles.uploadOptionButton}
                                    onPress={() => openCamera('invoice')}
                                >
                                    <Ionicons name="camera" size={24} color={Colors.primary.main} />
                                    <Text style={styles.uploadOptionText}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.uploadOptionButton}
                                    onPress={() => pickImage('invoice')}
                                >
                                    <Ionicons name="images" size={24} color={Colors.primary.main} />
                                    <Text style={styles.uploadOptionText}>Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {errors.invoice_image && <Text style={styles.error}>{errors.invoice_image}</Text>}
                    </View>

                    {/* Warranty Upload */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Warranty Card Image</Text>
                        {warrantyUri ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: warrantyUri }} style={styles.uploadedImage} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => {
                                        setWarrantyUri(null)
                                        setData('warranty_image', null)
                                    }}
                                >
                                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadOptions}>
                                <TouchableOpacity
                                    style={styles.uploadOptionButton}
                                    onPress={() => openCamera('warranty')}
                                >
                                    <Ionicons name="camera" size={24} color={Colors.primary.main} />
                                    <Text style={styles.uploadOptionText}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.uploadOptionButton}
                                    onPress={() => pickImage('warranty')}
                                >
                                    <Ionicons name="images" size={24} color={Colors.primary.main} />
                                    <Text style={styles.uploadOptionText}>Gallery</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {errors.warranty_image && <Text style={styles.error}>{errors.warranty_image}</Text>}
                    </View>
                </View>

                {/* Installation Status */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Installation Status</Text>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setData('is_delivered', data.is_delivered ? 0 : 1)}
                    >
                        <View style={[styles.checkbox, data.is_delivered === 1 && styles.checkboxActive]}>
                            {data.is_delivered === 1 && <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />}
                        </View>
                        <Text style={styles.checkboxLabel}>Product is delivered</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setData('is_wiring_done', data.is_wiring_done ? 0 : 1)}
                    >
                        <View style={[styles.checkbox, data.is_wiring_done === 1 && styles.checkboxActive]}>
                            {data.is_wiring_done === 1 && <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />}
                        </View>
                        <Text style={styles.checkboxLabel}>Wiring is done</Text>
                    </TouchableOpacity>
                </View>

                {/* Additional Requirements */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Additional Requirements</Text>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setData('outdoor_bracket_needed', data.outdoor_bracket_needed ? 0 : 1)}
                    >
                        <View style={[styles.checkbox, data.outdoor_bracket_needed === 1 && styles.checkboxActive]}>
                            {data.outdoor_bracket_needed === 1 && <Ionicons name="checkmark" size={16} color={Colors.neutral.white} />}
                        </View>
                        <Text style={styles.checkboxLabel}>Outdoor bracket needed</Text>
                    </TouchableOpacity>

                    <Input
                        label="Extra Pipes Needed"
                        placeholder="0"
                        value={data.extra_pipes.toString()}
                        onChangeText={(text) => setData('extra_pipes', parseInt(text) || 0)}
                        keyboardType="number-pad"
                        leftIcon={<Ionicons name="git-branch-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    <Input
                        label="Extra Wall Holes Needed"
                        placeholder="0"
                        value={data.extra_holes.toString()}
                        onChangeText={(text) => setData('extra_holes', parseInt(text) || 0)}
                        keyboardType="number-pad"
                        leftIcon={<Ionicons name="ellipse-outline" size={20} color={Colors.text.tertiary} />}
                    />
                </View>

                {/* What's Included */}
                <View style={styles.inclusionsSection}>
                    <Text style={styles.sectionTitle}>What's Included (Free)</Text>
                    <View style={styles.inclusionsList}>
                        <View style={styles.inclusionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.inclusionText}>One wall hole</Text>
                        </View>
                        <View style={styles.inclusionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.inclusionText}>10 feet pipe</Text>
                        </View>
                        <View style={styles.inclusionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.inclusionText}>Indoor installation</Text>
                        </View>
                        <View style={styles.inclusionItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={styles.inclusionText}>Outdoor installation</Text>
                        </View>
                    </View>
                </View>

                {/* Submit Button */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={[styles.submitButton, processing && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={processing}
                    >
                        <Text style={styles.submitButtonText}>
                            {processing ? 'Submitting...' : 'Submit Application'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Camera Modal */}
            <Modal visible={showCamera} animationType="slide">
                <View style={styles.cameraContainer}>
                    <CameraView style={styles.camera} ref={cameraRef} facing="back">
                        <View style={styles.cameraControls}>
                            <TouchableOpacity
                                style={styles.cameraButton}
                                onPress={() => setShowCamera(false)}
                            >
                                <Ionicons name="close" size={32} color={Colors.neutral.white} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.captureButton}
                                onPress={handleTakePhoto}
                            >
                                <View style={styles.captureButtonInner} />
                            </TouchableOpacity>
                            <View style={styles.cameraButton} />
                        </View>
                    </CameraView>
                </View>
            </Modal>

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
        </SafeAreaView >
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
        height: 180,
        position: 'relative',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    carouselGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.neutral.gray[300],
    },
    activeDot: {
        width: 20,
        backgroundColor: Colors.primary.main,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: '#ECFDF5',
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#047857',
    },
    formSection: {
        backgroundColor: Colors.neutral.white,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border.light,
        backgroundColor: Colors.neutral.white,
        gap: Spacing.sm,
    },
    dateText: {
        flex: 1,
        fontSize: 14,
        color: Colors.text.primary,
    },
    productTypeGrid: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    productTypeCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border.light,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    productTypeCardActive: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.primary.light,
    },
    productTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    productTypeTextActive: {
        color: Colors.primary.main,
    },
    uploadOptions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    uploadOptionButton: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border.light,
        borderStyle: 'dashed',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.neutral.gray[50],
    },
    uploadOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    imagePreviewContainer: {
        position: 'relative',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Colors.neutral.white,
        borderRadius: 12,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border.light,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: Colors.primary.main,
        borderColor: Colors.primary.main,
    },
    checkboxLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text.primary,
    },
    inclusionsSection: {
        backgroundColor: '#ECFDF5',
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    inclusionsList: {
        gap: Spacing.sm,
    },
    inclusionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    inclusionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#047857',
    },
    buttonSection: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    submitButton: {
        backgroundColor: Colors.primary.main,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.neutral.white,
    },
    error: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    cameraButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary.main,
    },
})
