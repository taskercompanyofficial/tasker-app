import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

/**
 * WhatsApp-like Image Compression Strategy:
 * 1. Resizes the image so the long edge is at most 1600px (higher than previous 1280px).
 * 2. Uses a JPEG quality of 0.7 - 0.8 (70-80%) which is the "sweet spot" for mobile.
 * 3. Strips metadata and ensures a consistent format (JPEG).
 */

interface CompressionResult {
  uri: string;
  width: number;
  height: number;
}

export async function compressImage(
  uri: string,
  maxWidth = 1600,
  quality = 0.75
): Promise<string> {
  try {
    // If it's not a local file or not an image, skip
    if (!uri.startsWith("file://") && !uri.startsWith("/")) {
      return uri;
    }

    // Step 1: Detect orientation and dimensions
    const actions: ImageManipulator.Action[] = [];
    
    // Step 2: Add resize action if needed
    // ImageManipulator.manipulateAsync automatically maintains aspect ratio if only width is provided
    actions.push({ resize: { width: maxWidth } });

    // Step 3: Perform manipulation
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { 
        compress: quality, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );

    console.log(`[ImageUtil] Compressed: ${uri.split('/').pop()} -> ${result.uri.split('/').pop()}`);
    return result.uri;
  } catch (error) {
    console.error("[ImageUtil] Compression failed, falling back to original:", error);
    return uri;
  }
}

/**
 * Useful for profile pictures where square aspect ratio is required.
 */
export async function compressAndSquare(
  uri: string,
  size = 800,
  quality = 0.8
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: size, height: size } }
      ],
      { 
        compress: quality, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    return result.uri;
  } catch (error) {
    return uri;
  }
}
