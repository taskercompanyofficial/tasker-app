import AppText from "@/components/common/AppText";
import Modal from "@/components/Modal";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface RequiredFile {
  id: number;
  file_type_id: number;
  file_type: { id: number; name: string };
}

interface JobGuideModalProps {
  visible: boolean;
  serviceName: string;
  requiredFiles: RequiredFile[];
  uploadedFiles: any[];
  indoorSerial: string;
  outdoorSerial: string;
  onClose: () => void;
}

export default function JobGuideModal({
  visible,
  serviceName,
  requiredFiles,
  uploadedFiles,
  indoorSerial,
  outdoorSerial,
  onClose,
}: JobGuideModalProps) {
  return (
    <Modal
      visible={visible}
      type="info"
      title="Job Requirements"
      message={`Requirements for ${serviceName}`}
      onClose={onClose}
    >
      <View style={styles.container}>
        <AppText style={styles.subTitle}>Required Photos</AppText>
        {requiredFiles?.length ? (
          requiredFiles.map((req) => {
            const isUploaded = uploadedFiles?.some(
              (f) => f.file_type.id === req.file_type_id,
            );
            return (
              <View key={req.id} style={styles.item}>
                <Ionicons
                  name={isUploaded ? "checkbox" : "square-outline"}
                  size={14}
                  color={
                    isUploaded ? Colors.themes.provider.primary : "#9CA3AF"
                  }
                />
                <AppText
                  style={[styles.itemText, isUploaded && styles.itemUploaded]}
                >
                  {req.file_type.name}
                </AppText>
              </View>
            );
          })
        ) : (
          <AppText style={styles.emptyText}>No specific requirements.</AppText>
        )}

        <View style={styles.divider} />

        <AppText style={styles.subTitle}>Product Info</AppText>
        <View style={styles.item}>
          <Ionicons
            name={indoorSerial ? "checkbox" : "square-outline"}
            size={14}
            color={indoorSerial ? Colors.themes.provider.primary : "#9CA3AF"}
          />
          <AppText style={[styles.itemText, indoorSerial && styles.itemUploaded]}>
            Indoor Serial
          </AppText>
        </View>
        <View style={styles.item}>
          <Ionicons
            name={outdoorSerial ? "checkbox" : "square-outline"}
            size={14}
            color={outdoorSerial ? Colors.themes.provider.primary : "#9CA3AF"}
          />
          <AppText style={[styles.itemText, outdoorSerial && styles.itemUploaded]}>
            Outdoor Serial
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: 2,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 10,
    color: "#1F2937",
  },
  itemUploaded: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  emptyText: {
    fontSize: 10,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
});
