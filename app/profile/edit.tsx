import AlertModal from '@/components/common/AlertModal'
import Input from '@/components/Input'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import useForm from '@/hooks/use-form'
import { APP_URL } from '@/lib/api-endpoints'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ProfileForm {
    name: string
    email: string
    avatar?: File | null
}

export default function EditProfilePage() {
    const { session, refetchUser } = useSession()
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
    const [alertModal, setAlertModal] = useState({
        visible: false,
        type: 'success' as 'success' | 'error',
        title: '',
        message: '',
    })

    const { data, setData, errors, processing, post } = useForm<ProfileForm>({
        name: session.user?.name || '',
        email: session.user?.email || '',
        avatar: null,
    })

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (status !== 'granted') {
            setAlertModal({
                visible: true,
                type: 'error',
                title: 'Permission Denied',
                message: 'Sorry, we need camera roll permissions to change your profile picture.',
            })
            return
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        })

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0]
            const uri = asset.uri
            setSelectedImageUri(uri)

            // Create file object for upload - React Native style
            const filename = uri.split('/').pop() || 'avatar.jpg'
            const match = /\.(\w+)$/.exec(filename)
            const type = match ? `image/${match[1]}` : 'image/jpeg'

            const file = {
                uri,
                name: filename,
                type,
            } as any

            setData('avatar', file)
        }
    }

    const handleSubmit = () => {
        post(`${APP_URL}/auth/update`, {
            onSuccess: async (response) => {
                // Refetch user data to update context
                await refetchUser()

                setAlertModal({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: response.message || 'Profile updated successfully!',
                })
                // Reset selected image after successful upload
                setSelectedImageUri(null)
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

    const displayImage = selectedImageUri || (session.user?.avatar_url)

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {displayImage ? (
                            <Image source={{ uri: displayImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {data.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}

                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.avatarEditButton} onPress={pickImage}>
                            <Ionicons name="camera" size={16} color={Colors.neutral.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.avatarHint}>Tap to change photo</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <Input
                        label="Full Name"
                        placeholder="Enter your name"
                        value={data.name}
                        onChangeText={(text) => setData('name', text)}
                        error={errors.name}
                        leftIcon={<Ionicons name="person-outline" size={20} color={Colors.text.tertiary} />}
                    />

                    <Input
                        label="Email Address"
                        placeholder="Enter your email"
                        value={data.email}
                        onChangeText={(text) => setData('email', text)}
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.text.tertiary} />}
                    />
                </View>

                {/* Save Button */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={[styles.saveButton, processing && styles.saveButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={processing}
                    >
                        <Text style={styles.saveButtonText}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>
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
    avatarSection: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        backgroundColor: Colors.neutral.white,
        marginBottom: Spacing.md,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.sm,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.neutral.white,
    },
    avatarEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.neutral.white,
    },
    avatarHint: {
        fontSize: 13,
        color: Colors.text.secondary,
    },
    formSection: {
        backgroundColor: Colors.neutral.white,
        padding: Spacing.md,
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
    buttonSection: {
        padding: Spacing.md,
    },
    saveButton: {
        backgroundColor: Colors.primary.main,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: Colors.neutral.white,
        fontSize: 16,
        fontWeight: '700',
    },
})
