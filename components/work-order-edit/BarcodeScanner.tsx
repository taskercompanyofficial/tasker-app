import AppText from "@/components/common/AppText";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React, { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

interface BarcodeScannerProps {
  visible: boolean;
  scanningField: "indoor" | "outdoor" | "warranty" | null;
  onBarcodeScanned: (result: { data: string; imageUri?: string }) => void;
  onClose: () => void;
}

export default function BarcodeScanner({
  visible,
  scanningField,
  onBarcodeScanned,
  onClose,
}: BarcodeScannerProps) {
  const cameraRef = useRef<any>(null);
  const isCapturingRef = useRef(false);
  const [capturing, setCapturing] = useState(false);

  if (!visible) return null;

  const handleBarcodeDetection = async (result: any) => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    setCapturing(true);

    let photoUri: string | undefined;
    try {
      if (cameraRef.current && cameraRef.current.takePictureAsync) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          skipProcessing: true,
        });
        photoUri = photo?.uri;
      }
    } catch (e) {
      console.warn("Could not capture barcode photo snapshot:", e);
    }

    onBarcodeScanned({ data: result.data || "", imageUri: photoUri });
    isCapturingRef.current = false;
    setCapturing(false);
  };

  const getTitle = () => {
    switch (scanningField) {
      case "indoor":
        return "Scan Indoor Serial Barcode";
      case "outdoor":
        return "Scan Outdoor Serial Barcode";
      case "warranty":
        return "Scan Warranty Card / Invoice Barcode";
      default:
        return "Scan Barcode";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.scannerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title}>{getTitle()}</AppText>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeDetection}
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

        {/* Frame Overlay */}
        <View style={styles.overlay}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <AppText style={styles.hint}>
            Align barcode inside frame — photo will attach automatically
          </AppText>
          {capturing && (
            <View style={styles.capturingBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <AppText style={styles.capturingText}>Capturing photo & barcode...</AppText>
            </View>
          )}
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
    zIndex: 2000,
  },
  scannerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  closeBtn: {
    padding: 4,
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
    width: 250,
    height: 180,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#FFFFFF",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  hint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  capturingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
  },
  capturingText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
