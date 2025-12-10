import Button from '@/components/Button'
import Input from '@/components/Input'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { useSession } from '@/context/ctx'
import useForm from '@/hooks/use-form'
import { OTP_URL, OTP_VERIFY_URL } from '@/lib/api-endpoints'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'
type Step = 'phone' | 'otp' | 'success'

export default function Signin() {
    const { signIn } = useSession()
    const [step, setStep] = useState<Step>('phone')
    const { data, setData, processing, errors, post } = useForm({
        phone: '',
        source: 'tasker-app',
        otp: ''
    })
    const handleSendOtp = () => {
        post(OTP_URL, {
            onSuccess: (response) => {
                setStep('otp')
                Toast.show({
                    type: 'success',
                    text1: response?.message || 'OTP sent successfully'
                })
            },
            onError: (error) => {
                Toast.show({
                    type: 'error',
                    text1: error.message
                })
            }
        })
    }

    const fadeAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start()
    }, [step])
    const handleVerifyOtp = async () => {
        post(OTP_VERIFY_URL, {
            onSuccess: (response: { message: string, token: string }) => {
                setStep('success')
                signIn(response.token)
            },
            onError: (error) => {
                Toast.show({
                    type: 'error',
                    text1: error?.message || 'Something went wrong'
                })
            }
        })
    }

    const handleGoogleSignIn = () => {
        console.log('Google sign in')
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="checkmark-circle" size={50} color={Colors.primary.main} />
                    </View>
                    <Text style={styles.title}>Welcome to Tasker</Text>
                    <Text style={styles.subtitle}>
                        {step === 'phone' && 'Enter your WhatsApp number to continue'}
                        {step === 'otp' && 'Enter the verification code'}
                        {step === 'success' && 'Welcome back!'}
                    </Text>
                </View>

                <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
                    {step === 'phone' && (
                        <View style={styles.stepContainer}>
                            <Input
                                label="WhatsApp Number"
                                placeholder="03XXXXXXXXX"
                                value={data.phone}
                                onChangeText={(text) => {
                                    setData({ ...data, phone: text })
                                }}
                                keyboardType="phone-pad"
                                error={errors.phone}
                                leftIcon={<Ionicons name="logo-whatsapp" size={18} color={Colors.primary.main} />}
                            />

                            <Button
                                title={processing ? "Sending OTP..." : "Continue"}
                                onPress={handleSendOtp}
                                fullWidth
                                loading={processing}
                            />

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>or</Text>
                                <View style={styles.divider} />
                            </View>

                            <Button
                                title="Continue with Google"
                                onPress={handleGoogleSignIn}
                                variant="outline"
                                fullWidth
                                icon={<Ionicons name="logo-google" size={18} color={Colors.social.google} />}
                            />
                        </View>
                    )}

                    {step === 'otp' && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.otpInfo}>
                                We've sent a 6-digit code to your WhatsApp.{' '}
                                <Text style={styles.changeNumber} onPress={() => setStep('phone')}>
                                    Change number
                                </Text>
                            </Text>

                            <Input
                                label="Enter OTP"
                                placeholder="000000"
                                value={data.otp}
                                onChangeText={(text) => {
                                    setData({ ...data, otp: text })
                                }}
                                keyboardType="number-pad"
                                maxLength={6}
                                error={errors.otp}
                                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.primary.main} />}
                            />

                            <Button
                                title={processing ? "Verifying..." : "Verify OTP"}
                                onPress={handleVerifyOtp}
                                fullWidth
                                loading={processing}
                            />

                            <TouchableOpacity onPress={handleSendOtp} style={styles.resendButton}>
                                <Text style={styles.resendText}>Resend OTP</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 'success' && (
                        <View style={styles.successContainer}>
                            <View style={styles.successIcon}>
                                <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
                            </View>
                            <Text style={styles.successTitle}>Welcome Back!</Text>
                            <Text style={styles.successText}>
                                Redirecting to your dashboard...
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.white,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: 60,
        paddingBottom: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    logoContainer: {
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    formContainer: {
        flex: 1,
    },
    stepContainer: {
        gap: Spacing.md,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.sm,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border.light,
    },
    dividerText: {
        marginHorizontal: Spacing.md,
        color: Colors.text.tertiary,
        fontSize: 12,
    },
    otpInfo: {
        fontSize: 13,
        color: Colors.text.secondary,
        lineHeight: 20,
        marginBottom: Spacing.sm,
    },
    changeNumber: {
        color: Colors.primary.main,
        fontWeight: '500',
    },
    resendButton: {
        alignSelf: 'center',
        paddingVertical: Spacing.sm,
    },
    resendText: {
        color: Colors.primary.main,
        fontSize: 14,
        fontWeight: '500',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    successIcon: {
        marginBottom: Spacing.lg,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    successText: {
        fontSize: 13,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
})