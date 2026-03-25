import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface SheetSelectOption {
  value: number;
  label: string;
  description?: string | null;
  badge?: string | null;
  isDone?: boolean;
  isRequired?: boolean;
}

interface SheetSelectProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SheetSelectOption[];
  selectedValue?: number | null;
  onSelect: (value: number) => void;
  loading?: boolean;
  emptyText?: string;
}

export default function SheetSelect({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  loading = false,
  emptyText = "No options available",
}: SheetSelectProps) {
  const renderItem = ({ item }: { item: SheetSelectOption }) => {
    const isSelected = selectedValue === item.value;
    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => {
          onSelect(item.value);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            <Text
              style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}
              numberOfLines={1}
            >
              {item.label}
              {item.isRequired && (
                <Text style={styles.requiredMark}> (Required)</Text>
              )}
            </Text>
          </View>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <View style={styles.rightContent}>
          {item.isDone ? (
            <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
          ) : item.isRequired ? (
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
          ) : null}
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={Colors.themes.provider.primary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap outside to close */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Sheet */}
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator
                size="small"
                color={Colors.themes.provider.primary}
              />
              <Text style={styles.stateText}>Loading...</Text>
            </View>
          ) : options.length === 0 ? (
            <View style={styles.stateContainer}>
              <Ionicons name="alert-circle-outline" size={28} color="#9CA3AF" />
              <Text style={styles.stateText}>{emptyText}</Text>
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.value.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              style={styles.list}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.6,
    paddingBottom: 32,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  itemSelected: {
    backgroundColor: "rgba(30, 64, 175, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(30, 64, 175, 0.2)",
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    backgroundColor: Colors.themes.provider.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  itemLabel: {
    fontSize: 11,
    color: "#374151",
    flex: 1,
  },
  itemLabelSelected: {
    color: Colors.themes.provider.primary,
    fontWeight: "600",
  },
  itemDescription: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 2,
  },
  stateContainer: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  stateText: {
    fontSize: 10,
    color: "#6B7280",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  requiredMark: {
    fontSize: 9,
    color: "#DC2626",
    fontWeight: "600",
  },
});
