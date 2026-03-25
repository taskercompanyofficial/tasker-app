import { useCameraPermissions } from "expo-camera";
import { useCallback, useState } from "react";

type ScanField = "indoor" | "outdoor" | null;

interface UseBarcodeScannerReturn {
  // Scanner state
  showScanner: boolean;
  scanningField: ScanField;

  // Actions
  openScanner: (field: "indoor" | "outdoor") => Promise<void>;
  closeScanner: () => void;
  onBarcodeScanned: (data: string) => void;

  // Permission
  hasPermission: boolean;
}

interface UseBarcodeScannerOptions {
  onIndoorScanned: (data: string) => void;
  onOutdoorScanned: (data: string) => void;
  onError: (message: string) => void;
}

export function useBarcodeScanner({
  onIndoorScanned,
  onOutdoorScanned,
  onError,
}: UseBarcodeScannerOptions): UseBarcodeScannerReturn {
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanningField, setScanningField] = useState<ScanField>(null);

  const openScanner = useCallback(
    async (field: "indoor" | "outdoor") => {
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
    (data: string) => {
      if (scanningField === "indoor") {
        onIndoorScanned(data);
      } else if (scanningField === "outdoor") {
        onOutdoorScanned(data);
      }
      setShowScanner(false);
      setScanningField(null);
    },
    [scanningField, onIndoorScanned, onOutdoorScanned]
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
