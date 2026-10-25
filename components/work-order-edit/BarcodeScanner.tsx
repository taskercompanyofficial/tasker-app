import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface BarcodeScannerProps {
  visible: boolean;
  scanningField: "indoor" | "outdoor" | null;
  onBarcodeScanned: (result: { type: string; data: string }) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  visible,
  scanningField,
  onBarcodeScanned,
  onClose,
}: BarcodeScannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.scannerContainer}>
        <View style={styles.header}>
          <AppText style={styles.title}>
            Scan {scanningField === "indoor" ? "Indoor" : "Outdoor"} Serial
          </AppText>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={onBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              "qr",
              "ean13",
              "ean8",
              "code128",
              "code39",
              "code93",
              "upc_a",
              "upc_e",
            ],
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <AppText style={styles.hint}>Position barcode in frame</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 1000,
  },
  scannerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingTop: 45,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: Colors.themes.provider.primary,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  hint: {
    marginTop: 12,
    fontSize: 10,
    color: "#FFF",
    opacity: 0.8,
  },
});
