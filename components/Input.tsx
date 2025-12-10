import React, { useState } from 'react'
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInputProps,
    ViewStyle,
} from 'react-native'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'

interface InputProps extends TextInputProps {
    label?: string
    error?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    onRightIconPress?: () => void
    containerStyle?: ViewStyle
}

export default function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    ...textInputProps
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false)

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.neutral.gray[400]}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...textInputProps}
                />
                {rightIcon && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        style={styles.rightIcon}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.gray[50],
        borderRadius: 10,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    inputContainerFocused: {
        borderColor: Colors.primary.main,
        backgroundColor: Colors.neutral.white,
    },
    inputContainerError: {
        borderColor: Colors.error,
        backgroundColor: Colors.neutral.white,
    },
    leftIcon: {
        marginRight: Spacing.sm,
    },
    rightIcon: {
        marginLeft: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.text.primary,
        paddingVertical: 0,
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
        marginLeft: 2,
    },
})
