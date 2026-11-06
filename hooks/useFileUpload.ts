import {
  VENDOR_DELETE_WORK_ORDER_FILE_URL,
  VENDOR_STAFF_DELETE_WORK_ORDER_FILE_URL,
  VENDOR_FILE_TYPES_URL,
  VENDOR_UPLOAD_WORK_ORDER_FILE_URL,
  VENDOR_STAFF_UPLOAD_WORK_ORDER_FILE_URL,
} from "@/lib/api-endpoints";
import { useAuthStore } from "@/context/auth-store";
import axios from "@/lib/axios.config";
import { FileType } from "@/types/file-type";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage as professionalCompress } from "@/lib/image";
import Toast from "react-native-toast-message";
import { Platform } from "react-native";

interface UploadData {
  fileTypeId: number;
  imageUri: string;
}

let persistedUploadData: UploadData | null = null;

interface UseFileUploadReturn {
  fileTypes: FileType[];
  uploading: boolean;
  uploadingFileTypeId: number | null;
  processing: boolean;
  showFileTypeSheet: boolean;
  showSourceSheet: boolean;
  showPreviewModal: boolean;
  uploadData: UploadData | null;
  handleAddFile: () => void;
  handleSelectFileType: (fileTypeId: number) => void;
  handleSelectCamera: () => Promise<void>;
  handleSelectGallery: () => Promise<void>;
  handleConfirmUpload: () => Promise<void>;
  handleCancelPreview: () => void;
  handleFileDelete: (file: any) => Promise<void>;
  handleClearAll: (files: any[]) => Promise<void>;
  uploadDirectFile: (uri: string, fileTypeId: number) => Promise<void>;
  captureAndUploadForType: (fileTypeId: number, source: "camera" | "gallery") => Promise<void>;
  cancelFileTypeSheet: () => void;
  cancelSourceSheet: () => void;
}

interface UseFileUploadOptions {
  workOrderId: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onFilesChanged: () => void;
}

export function useFileUpload({
  workOrderId,
  onSuccess,
  onError,
  onFilesChanged,
}: UseFileUploadOptions): UseFileUploadReturn {
  const appMode = useAuthStore((s) => s.appMode);
  const isStaff = appMode === "vendor_staff";

  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingFileTypeId, setUploadingFileTypeId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showFileTypeSheet, setShowFileTypeSheet] = useState(false);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadData, setUploadData] = useState<UploadData | null>(null);

  const isPickerActive = useRef(false);

  const compressImage = async (uri: string) => {
    return await professionalCompress(uri, 1600, 0.75);
  };

  const processVideo = async (uri: string) => {
    return uri;
  };

  useEffect(() => {
    fetchFileTypes();
  }, []);

  useEffect(() => {
    if (persistedUploadData) {
      setUploadData(persistedUploadData);
    }
  }, []);

  const fetchFileTypes = async () => {
    try {
      const response = await axios.get(VENDOR_FILE_TYPES_URL);
      if (response.data?.data && Array.isArray(response.data.data)) {
        setFileTypes(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch file types:", error);
    }
  };

  const handleAddFile = useCallback(() => {
    setShowFileTypeSheet(true);
  }, []);

  const handleSelectFileType = useCallback((fileTypeId: number) => {
    const data = { fileTypeId, imageUri: "" };
    persistedUploadData = data;
    setUploadData(data);
    setShowFileTypeSheet(false);
    setTimeout(() => setShowSourceSheet(true), 150);
  }, []);

  const uploadImage = async (uri: string, fileTypeId: number) => {
    try {
      setUploading(true);
      setUploadingFileTypeId(fileTypeId);

      let processedUri = uri;
      if (uri.match(/\.(jpg|jpeg|png)$/i) || !uri.includes(".")) {
        processedUri = await compressImage(uri);
      }

      const uriParts = processedUri.split("/");
      const rawName = uriParts[uriParts.length - 1] || "photo.jpg";
      const actualFilename = rawName.includes(".") ? rawName : `${rawName}.jpg`;

      const fileExtension = actualFilename.split(".").pop()?.toLowerCase();
      let mimeType = "image/jpeg";
      if (fileExtension === "png") mimeType = "image/png";
      else if (fileExtension === "mp4") mimeType = "video/mp4";
      else if (fileExtension === "mov") mimeType = "video/quicktime";

      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "android" ? processedUri : processedUri.replace("file://", ""),
        name: actualFilename,
        type: mimeType,
      } as any);
      formData.append("file_type_id", fileTypeId.toString());
      formData.append("confirm_duplicate", "1");

      const uploadUrl = isStaff
        ? VENDOR_STAFF_UPLOAD_WORK_ORDER_FILE_URL(workOrderId)
        : VENDOR_UPLOAD_WORK_ORDER_FILE_URL(workOrderId);

      await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onSuccess("File uploaded successfully");
      onFilesChanged();
    } catch (error: any) {
      console.error("Upload error details:", error?.response?.data || error);
      const msg = error?.response?.data?.message || "Failed to upload file";
      onError(msg);
    } finally {
      setUploading(false);
      setUploadingFileTypeId(null);
    }
  };

  // Direct upload for scanned barcodes or background snapshots
  const uploadDirectFile = useCallback(
    async (uri: string, fileTypeId: number) => {
      await uploadImage(uri, fileTypeId);
    },
    [workOrderId]
  );

  // Direct 1-tap capture and upload for a known fileTypeId
  const captureAndUploadForType = useCallback(
    async (fileTypeId: number, source: "camera" | "gallery") => {
      if (isPickerActive.current) return;
      isPickerActive.current = true;

      try {
        if (source === "camera") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.status !== "granted") {
            onError("Camera permission is required");
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.5,
            allowsEditing: false,
          });

          if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri, fileTypeId);
          }
        } else {
          if (Platform.OS !== "android") {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.status !== "granted") {
              onError("Gallery permission is required");
              return;
            }
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.5,
            allowsMultipleSelection: false,
          });

          if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri, fileTypeId);
          }
        }
      } catch (err: any) {
        console.warn("Capture & upload error:", err);
        onError("Could not capture image");
      } finally {
        isPickerActive.current = false;
      }
    },
    [workOrderId]
  );

  const handleSelectCamera = useCallback(async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.status !== "granted") {
        onError("Permission to access camera is required");
        return;
      }

      setShowSourceSheet(false);

      setTimeout(async () => {
        if (!persistedUploadData) return;

        try {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.4,
            allowsEditing: false,
          });

          if (!result.canceled && result.assets[0]) {
            let uri = result.assets[0].uri;
            const newData = { ...persistedUploadData, imageUri: uri };
            persistedUploadData = newData;
            setUploadData(newData);
            setShowPreviewModal(true);
          }
        } catch {
          onError("Could not open camera");
        }
      }, 400);
    } catch {
      onError("Error requesting camera permissions");
    } finally {
      isPickerActive.current = false;
    }
  }, [onError]);

  const handleSelectGallery = useCallback(async () => {
    if (isPickerActive.current) return;
    isPickerActive.current = true;

    try {
      if (Platform.OS !== "android") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.status !== "granted") {
          onError("Permission to access gallery is required");
          return;
        }
      }

      setShowSourceSheet(false);

      setTimeout(async () => {
        if (!persistedUploadData) return;

        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: false,
            quality: 0.4,
          });

          if (!result.canceled && result.assets[0]) {
            let uri = result.assets[0].uri;
            const newData = { ...persistedUploadData, imageUri: uri };
            persistedUploadData = newData;
            setUploadData(newData);
            setShowPreviewModal(true);
          }
        } catch {
          onError("Could not open gallery");
        }
      }, 400);
    } catch {
      onError("Error requesting gallery permissions");
    } finally {
      isPickerActive.current = false;
    }
  }, [onError]);

  const handleConfirmUpload = useCallback(async () => {
    const data = persistedUploadData;
    if (!data || !data.imageUri || !data.fileTypeId) return;

    setShowPreviewModal(false);
    await uploadImage(data.imageUri, data.fileTypeId);
    persistedUploadData = null;
    setUploadData(null);
  }, []);

  const handleCancelPreview = useCallback(() => {
    setShowPreviewModal(false);
    persistedUploadData = null;
    setUploadData(null);
  }, []);

  const handleFileDelete = async (file: any) => {
    try {
      const deleteUrl = isStaff
        ? VENDOR_STAFF_DELETE_WORK_ORDER_FILE_URL(workOrderId, file.id)
        : VENDOR_DELETE_WORK_ORDER_FILE_URL(workOrderId, file.id);
      await axios.delete(deleteUrl);
      onSuccess("File deleted successfully");
      onFilesChanged();
    } catch (error: any) {
      onError(error.response?.data?.message || "Failed to delete file");
    }
  };

  const handleClearAll = async (files: any[]) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      for (const file of files) {
        const deleteUrl = isStaff
          ? VENDOR_STAFF_DELETE_WORK_ORDER_FILE_URL(workOrderId, file.id)
          : VENDOR_DELETE_WORK_ORDER_FILE_URL(workOrderId, file.id);
        await axios.delete(deleteUrl);
      }
      onSuccess("All files deleted successfully");
      onFilesChanged();
    } catch {
      onError("Failed to delete some files");
    } finally {
      setUploading(false);
      setUploadingFileTypeId(null);
    }
  };

  const cancelFileTypeSheet = useCallback(() => {
    setShowFileTypeSheet(false);
  }, []);

  const cancelSourceSheet = useCallback(() => {
    setShowSourceSheet(false);
  }, []);

  return {
    fileTypes,
    uploading,
    uploadingFileTypeId,
    processing,
    showFileTypeSheet,
    showSourceSheet,
    showPreviewModal,
    uploadData,
    handleAddFile,
    handleSelectFileType,
    handleSelectCamera,
    handleSelectGallery,
    handleConfirmUpload,
    handleCancelPreview,
    handleFileDelete,
    handleClearAll,
    uploadDirectFile,
    captureAndUploadForType,
    cancelFileTypeSheet,
    cancelSourceSheet,
  };
}
