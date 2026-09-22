import {
  VENDOR_DELETE_WORK_ORDER_FILE_URL,
  VENDOR_FILE_TYPES_URL,
  VENDOR_UPLOAD_WORK_ORDER_FILE_URL,
} from "@/lib/api-endpoints";
import axios from "@/lib/axios.config";
import { FileType } from "@/types/file-type";
import { getInfoAsync } from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage as professionalCompress } from "@/lib/image";
import Toast from "react-native-toast-message";
import { Platform } from "react-native";

interface UploadData {
  fileTypeId: number;
  imageUri: string;
}

// Module-level storage to persist across component remounts
let persistedUploadData: UploadData | null = null;

interface UseFileUploadReturn {
  // File types
  fileTypes: FileType[];

  // Upload state
  uploading: boolean;
  processing: boolean;
  showFileTypeSheet: boolean;
  showSourceSheet: boolean;
  showPreviewModal: boolean;
  uploadData: UploadData | null;

  // Actions
  handleAddFile: () => void;
  handleSelectFileType: (fileTypeId: number) => void;
  handleSelectCamera: () => Promise<void>;
  handleSelectGallery: () => Promise<void>;
  handleConfirmUpload: () => Promise<void>;
  handleCancelPreview: () => void;
  handleFileDelete: (file: any) => Promise<void>;
  handleClearAll: (files: any[]) => Promise<void>;
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
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFileTypeSheet, setShowFileTypeSheet] = useState(false);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadData, setUploadData] = useState<UploadData | null>(null);
  
  // Guard to prevent multiple parallel ImagePicker calls
  const isPickerActive = useRef(false);

  // Helper to get file size for logging
  const getFileSize = async (uri: string) => {
    try {
      const info = await getInfoAsync(uri);
      return info.exists ? info.size : 0;
    } catch {
      return 0;
    }
  };

// Helper to compress images (WhatsApp-like)
const compressImage = async (uri: string) => {
  return await professionalCompress(uri, 1600, 0.75);
};

  // Helper for video (rely on ImagePicker quality: Low in Expo Go)
  const processVideo = async (uri: string) => {
    return uri;
  };

  useEffect(() => {
    fetchFileTypes();
  }, []);

  // Sync local state with persisted data on mount
  useEffect(() => {
    if (persistedUploadData) {
      setUploadData(persistedUploadData);
    }
  }, []);

  const fetchFileTypes = async () => {
    try {
      const response = await axios.get(VENDOR_FILE_TYPES_URL);
      setFileTypes(response.data.data);
    } catch (error) {
      console.error("Failed to fetch file types:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load file types. Please try again.",
      });
    }
  };

  // Step 1: User clicks + to add file
  const handleAddFile = useCallback(() => {
    setShowFileTypeSheet(true);
  }, []);

  // Step 2: User selects file type - store it and open source sheet
  const handleSelectFileType = useCallback((fileTypeId: number) => {
    const data = { fileTypeId, imageUri: "" };
    persistedUploadData = data; // Store in module-level variable
    setUploadData(data);
    setShowFileTypeSheet(false);
    setTimeout(() => setShowSourceSheet(true), 150);
  }, []);

  // Step 3a: User selects camera
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

      // Wait for modal to finish closing animation
      setTimeout(async () => {
        if (!persistedUploadData) {
          return;
        }

        try {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'], 
            quality: 0.3, 
            allowsEditing: false,
            videoMaxDuration: 60,
            videoQuality: ImagePicker.UIImagePickerControllerQualityType.Low,
          });
          
          if (!result.canceled && result.assets[0]) {
            let uri = result.assets[0].uri;
            const assetType = result.assets[0].type;
            
            if (assetType === 'image' || uri.match(/\.(jpg|jpeg|png)$/i)) {
              uri = await compressImage(uri);
            } else if (assetType === 'video' || uri.match(/\.(mp4|mov|m4v|3gp)$/i)) {
              uri = await processVideo(uri);
            }

            const newData = { ...persistedUploadData, imageUri: uri };
            persistedUploadData = newData;
            setUploadData(newData);
            setShowPreviewModal(true);
          }
        } catch (err) {
          onError("Could not open camera");
        }
      }, 400);
    } catch (permErr) {
      onError("Error requesting camera permissions");
    } finally {
      isPickerActive.current = false;
    }
  }, [onError]);

  // Step 3b: User selects gallery
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

      // Wait for modal to finish closing animation
      setTimeout(async () => {
        if (!persistedUploadData) {
          return;
        }

        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'], 
            allowsMultipleSelection: false,
            quality: 0.3, 
            videoQuality: ImagePicker.UIImagePickerControllerQualityType.Low,
          });
          
          if (!result.canceled && result.assets[0]) {
            let uri = result.assets[0].uri;
            const assetType = result.assets[0].type;
            
            if (assetType === 'image' || uri.match(/\.(jpg|jpeg|png)$/i)) {
              uri = await compressImage(uri);
            } else if (assetType === 'video' || uri.match(/\.(mp4|mov|m4v|3gp)$/i)) {
              uri = await processVideo(uri);
            }

            const newData = { ...persistedUploadData, imageUri: uri };
            persistedUploadData = newData;
            setUploadData(newData);
            setShowPreviewModal(true);
          }
        } catch (err) {
          onError("Could not open gallery");
        }
      }, 400);
    } catch (permErr) {
      onError("Error requesting gallery permissions");
    } finally {
      isPickerActive.current = false;
    }
  }, [onError]);

  // Step 4: User confirms upload from preview modal
  const handleConfirmUpload = useCallback(async () => {
    const data = persistedUploadData;
    if (!data || !data.imageUri || !data.fileTypeId) {
      return;
    }

    setShowPreviewModal(false);
    await uploadImage(data.imageUri, data.fileTypeId);

    // Reset state
    persistedUploadData = null;
    setUploadData(null);
  }, []);

  // User cancels from preview modal
  const handleCancelPreview = useCallback(() => {
    setShowPreviewModal(false);
    persistedUploadData = null;
    setUploadData(null);
  }, []);

  const uploadImage = async (uri: string, fileTypeId: number) => {
    try {
      setUploading(true);

      const uriParts = uri.split("/");
      const actualFilename = uriParts[uriParts.length - 1];

      // Determine file type from extension
      const fileExtension = actualFilename.split(".").pop()?.toLowerCase();
      let mimeType = "image/jpeg"; // default
      if (fileExtension === "png") mimeType = "image/png";
      else if (fileExtension === "jpg" || fileExtension === "jpeg")
        mimeType = "image/jpeg";
      else if (fileExtension === "mp4") mimeType = "video/mp4";
      else if (fileExtension === "mov") mimeType = "video/quicktime";

      const formData = new FormData();
      formData.append("file", {
        uri,
        name: actualFilename,
        type: mimeType,
      } as any);
      formData.append("file_type_id", fileTypeId.toString());
      await axios.post(VENDOR_UPLOAD_WORK_ORDER_FILE_URL(workOrderId), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onSuccess("File uploaded successfully");
      onFilesChanged();
    } catch (error: any) {
      onError(error.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (file: any) => {
    try {
      await axios.delete(VENDOR_DELETE_WORK_ORDER_FILE_URL(workOrderId, file.id));
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
        await axios.delete(VENDOR_DELETE_WORK_ORDER_FILE_URL(workOrderId, file.id));
      }
      onSuccess("All files deleted successfully");
      onFilesChanged();
    } catch (error: any) {
      onError("Failed to delete some files");
    } finally {
      setUploading(false);
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
    cancelFileTypeSheet,
    cancelSourceSheet,
  };
}
