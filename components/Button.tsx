import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native'
import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'

interface ButtonProps {
    title: string
    onPress: () => void
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'small' | 'medium' | 'large'
    fullWidth?: boolean
    loading?: boolean
    disabled?: boolean
    icon?: React.ReactNode
}

export default function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    loading = false,
    disabled = false,
    icon,
}: ButtonProps) {
    const getButtonStyle = (): ViewStyle[] => {
        const baseStyle: ViewStyle[] = [styles.button, styles[`button_${size}`]]

        if (fullWidth) baseStyle.push(styles.fullWidth)
        if (disabled || loading) baseStyle.push(styles.disabled)

        switch (variant) {
            case 'primary':
                baseStyle.push(styles.primaryButton)
                break
            case 'secondary':
                baseStyle.push(styles.secondaryButton)
                break
            case 'outline':
                baseStyle.push(styles.outlineButton)
                break
            case 'ghost':
                baseStyle.push(styles.ghostButton)
                break
        }

        return baseStyle
    }

    const getTextStyle = (): TextStyle[] => {
        const baseStyle: TextStyle[] = [styles.text, styles[`text_${size}`]]

        switch (variant) {
            case 'primary':
                baseStyle.push(styles.primaryText)
                break
            case 'secondary':
                baseStyle.push(styles.secondaryText)
                break
            case 'outline':
                baseStyle.push(styles.outlineText)
                break
            case 'ghost':
                baseStyle.push(styles.ghostText)
                break
        }

        return baseStyle
    }

    return (
        <TouchableOpacity
            style={getButtonStyle()}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' || variant === 'secondary' ? Colors.neutral.white : Colors.primary.main}
                    size="small"
                />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.icon}>{icon}</View>}
                    <Text style={getTextStyle()}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: Spacing.xs,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },

    // Sizes
    button_small: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    button_medium: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    button_large: {
        paddingVertical: 14,
        paddingHorizontal: 20,
    },

    // Variants
    primaryButton: {
        backgroundColor: Colors.primary.main,
    },
    secondaryButton: {
        backgroundColor: Colors.secondary.main,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary.main,
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },

    // Text styles
    text: {
        fontWeight: '600',
    },
    text_small: {
        fontSize: 13,
    },
    text_medium: {
        fontSize: 14,
    },
    text_large: {
        fontSize: 15,
    },

    // Text colors
    primaryText: {
        color: Colors.neutral.white,
    },
    secondaryText: {
        color: Colors.neutral.white,
    },
    outlineText: {
        color: Colors.primary.main,
    },
    ghostText: {
        color: Colors.primary.main,
    },
})
