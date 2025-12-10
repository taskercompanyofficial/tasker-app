import AlertModal from '@/components/common/AlertModal'
import Loader from '@/components/Loader'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import { useForm } from '@/hooks/useForm'
import myAxios from '@/lib/axios.config'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function EditProfilePage() {
    const { session } = useSession()
    const [saving, setSaving] = useState(false)
    const [alertModal, setAlertModal] = useState({
        visible: false,
        type: 'success' as 'success' | 'error',
        title: '',
        message: '',
    })

    const { formData, handleChange, handleSubmit, loading } = useForm({
        initialValues: {
            name: session.user?.name || '',
            email: session.user?.email || '',
            phone: session.user?.phone || '',
        },
        onSubmit: async (values) => {
            setSaving(true)
            try {
                const response = await myAxios.post('/auth/update', values)

                if (response.data.status === 'success') {
                    setAlertModal({
                        visible: true,
                        type: 'success',
                        title: 'Success',
                        message: 'Profile updated successfully!',
                    })
                }
            } catch (error: any) {
                setAlertModal({
                    visible: true,
                    type: 'error',
                    title: 'Error',
                    message: error.response?.data?.message || 'Failed to update profile',
                })
            } finally {
                setSaving(false)
            }
        },
    })

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
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {formData.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.avatarEditButton}>
                            <Ionicons name="camera" size={16} color={Colors.neutral.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.avatarHint}>Tap to change photo</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={Colors.text.tertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor={Colors.text.tertiary}
                                value={formData.name}
                                onChangeText={(text) => handleChange('name', text)}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={Colors.text.tertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.text.tertiary}
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={Colors.text.tertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your phone"
                                placeholderTextColor={Colors.text.tertiary}
                                value={formData.phone}
                                onChangeText={(text) => handleChange('phone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={[styles.saveButton, (loading || saving) && styles.saveButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading || saving}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading || saving ? 'Saving...' : 'Save Changes'}
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
