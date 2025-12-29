import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Styles';
import React from 'react';
import {
    Modal as RNModal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from './Button';

type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface ModalAction {
    text: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

interface ModalProps {
    visible: boolean;
    type?: ModalType;
    title: string;
    message: string;
    actions?: ModalAction[];
    onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({
    visible,
    type = 'info',
    title,
    message,
    actions,
    onClose,
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠';
            case 'confirm':
                return '?';
            default:
                return 'ℹ';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success':
                return Colors.success;
            case 'error':
                return Colors.error;
            case 'warning':
                return Colors.warning;
            default:
                return Colors.primary;
        }
    };

    const defaultActions: ModalAction[] = actions || [
        {
            text: 'OK',
            onPress: onClose || (() => { }),
            variant: 'primary',
        },
    ];

    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: getIconColor() + '20' },
                        ]}
                    >
                        <Text style={[styles.icon, { backgroundColor: getIconColor() + '20' }]}>
                            {getIcon()}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        {defaultActions.map((action, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.actionButton,
                                    defaultActions.length === 1 && styles.actionButtonFull,
                                ]}
                            >
                                <Button
                                    title={action.text}
                                    onPress={action.onPress}
                                    variant={action.variant || 'primary'}
                                    size="medium"
                                    fullWidth
                                />
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    container: {
        backgroundColor: Colors.neutral.white,
        borderRadius: 16,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    icon: {
        fontSize: 32,
        fontWeight: '700',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.lg,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        width: '100%',
    },
    actionButton: {
        flex: 1,
    },
    actionButtonFull: {
        flex: 1,
    },
});

export default Modal;
