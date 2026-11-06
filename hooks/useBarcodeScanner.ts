import { useCameraPermissions } from "expo-camera";
import { useCallback, useState } from "react";

export type ScanField = "indoor" | "outdoor" | "warranty" | null;

interface UseBarcodeScannerReturn {
  // Scanner state
  showScanner: boolean;
  scanningField: ScanField;

  // Actions
  openScanner: (field: "indoor" | "outdoor" | "warranty") => Promise<void>;
  closeScanner: () => void;
  onBarcodeScanned: (data: string, imageUri?: string) => void;

  // Permission
  hasPermission: boolean;
}

interface UseBarcodeScannerOptions {
  onIndoorScanned: (data: string, imageUri?: string) => void;
  onOutdoorScanned: (data: string, imageUri?: string) => void;
  onWarrantyScanned?: (data: string, imageUri?: string) => void;
  onError: (message: string) => void;
}

export function useBarcodeScanner({
  onIndoorScanned,
  onOutdoorScanned,
  onWarrantyScanned,
  onError,
}: UseBarcodeScannerOptions): UseBarcodeScannerReturn {
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanningField, setScanningField] = useState<ScanField>(null);

  const openScanner = useCallback(
    async (field: "indoor" | "outdoor" | "warranty") => {
      if (!permission?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          onError("Camera permission is required to scan barcodes");
          return;
        }
      }
      setScanningField(field);
      setShowScanner(true);
    },
    [permission, requestPermission, onError]
  );

  const closeScanner = useCallback(() => {
    setShowScanner(false);
    setScanningField(null);
  }, []);

  const onBarcodeScanned = useCallback(
    (data: string, imageUri?: string) => {
      if (scanningField === "indoor") {
        onIndoorScanned(data, imageUri);
      } else if (scanningField === "outdoor") {
        onOutdoorScanned(data, imageUri);
      } else if (scanningField === "warranty" && onWarrantyScanned) {
        onWarrantyScanned(data, imageUri);
      }
      setShowScanner(false);
      setScanningField(null);
    },
    [scanningField, onIndoorScanned, onOutdoorScanned, onWarrantyScanned]
  );

  return {
    showScanner,
    scanningField,
    openScanner,
    closeScanner,
    onBarcodeScanned,
    hasPermission: permission?.granted ?? false,
  };
}
