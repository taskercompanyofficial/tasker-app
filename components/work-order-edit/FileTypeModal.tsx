import AppText from "@/components/common/AppText";
import Button from "@/components/Button";
import Colors from "@/constants/Colors";
import { FileType } from "@/types/file-type";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface FileTypeModalProps {
  visible: boolean;
  fileTypes: FileType[];
  selectedFileType: number | null;
  onSelectFileType: (id: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function FileTypeModal({
  visible,
  fileTypes,
  selectedFileType,
  onSelectFileType,
  onConfirm,
  onCancel,
}: FileTypeModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <AppText style={styles.title}>Select File Type</AppText>
        <AppText style={styles.message}>Choose the type of file</AppText>

        <ScrollView style={styles.fileTypeList}>
          {fileTypes.map((fileType) => (
            <TouchableOpacity
              key={fileType.id}
              style={[
                styles.fileTypeItem,
                selectedFileType === fileType.id && styles.fileTypeItemSelected,
              ]}
              onPress={() => onSelectFileType(fileType.id)}
            >
              <View style={styles.radio}>
                {selectedFileType === fileType.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <AppText
                style={[
                  styles.fileTypeText,
                  selectedFileType === fileType.id &&
                    styles.fileTypeTextSelected,
                ]}
              >
                {fileType.name}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              size="small"
              fullWidth
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Upload"
              onPress={onConfirm}
              variant="primary"
              size="small"
              fullWidth
              disabled={!selectedFileType}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  container: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 12,
    width: "85%",
    maxHeight: "70%",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  message: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 10,
  },
  fileTypeList: {
    maxHeight: 220,
    marginBottom: 10,
  },
  fileTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 4,
  },
  fileTypeItemSelected: {
    borderColor: Colors.themes.provider.primary,
    backgroundColor: "rgba(30, 64, 175, 0.08)",
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.themes.provider.primary,
  },
  fileTypeText: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  fileTypeTextSelected: {
    color: Colors.themes.provider.primary,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  buttonContainer: {
    flex: 1,
  },
});
