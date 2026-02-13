import Colors from '@/constants/Colors'
import { Spacing } from '@/constants/Styles'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SelectOption {
    label: string
    value: string
}

interface SelectProps {
    label?: string
    placeholder?: string
    value: string
    options: SelectOption[]
    onSelect: (value: string) => void
    error?: string
    leftIcon?: React.ReactNode
}

export default function Select({
    label,
    placeholder = 'Select an option',
    value,
    options,
    onSelect,
    error,
    leftIcon,
}: SelectProps) {
    const [modalVisible, setModalVisible] = useState(false)

    const selectedOption = options.find(opt => opt.value === value)

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={[styles.selectButton, error && styles.selectButtonError]}
                onPress={() => setModalVisible(true)}
            >
                {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

                <Text style={[
                    styles.selectText,
                    !selectedOption && styles.placeholderText
                ]}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>

                <Ionicons
                    name="chevron-down"
                    size={20}
                    color={Colors.text.tertiary}
                />
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Select'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionItem,
                                        value === option.value && styles.optionItemSelected
                                    ]}
                                    onPress={() => {
                                        onSelect(option.value)
                                        setModalVisible(false)
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        value === option.value && styles.optionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {value === option.value && (
                                        <Ionicons name="checkmark" size={20} color={Colors.themes.customer.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    selectButton: {
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
    selectButtonError: {
        borderColor: Colors.error,
    },
    leftIconContainer: {
        marginRight: Spacing.xs,
    },
    selectText: {
        flex: 1,
        fontSize: 14,
        color: Colors.text.primary,
    },
    placeholderText: {
        color: Colors.text.tertiary,
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.neutral.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    optionsList: {
        padding: Spacing.sm,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: 8,
        marginBottom: 4,
    },
    optionItemSelected: {
        backgroundColor: Colors.themes.customer.primaryLight,
    },
    optionText: {
        fontSize: 15,
        color: Colors.text.primary,
    },
    optionTextSelected: {
        fontWeight: '600',
        color: Colors.themes.customer.primary,
    },
})
