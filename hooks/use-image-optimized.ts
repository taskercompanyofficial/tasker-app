import { useState, useCallback, useEffect } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const CACHE_DIR = FileSystem.cacheDirectory + "images/";

interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number;
}

interface UseImageOptimizedOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  enableCache?: boolean;
}

export function useImageOptimized(options: UseImageOptimizedOptions = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    enableCache = true,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure cache directory exists
  useEffect(() => {
    if (enableCache) {
      FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true }).catch(
        () => {}
      );
    }
  }, [enableCache]);

  const getCachedPath = useCallback((uri: string) => {
    const hash = uri.split("/").pop() || Date.now().toString();
    return `${CACHE_DIR}${hash}`;
  }, []);

  const optimizeImage = useCallback(
    async (uri: string): Promise<OptimizedImageResult | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        // Check cache first
        if (enableCache) {
          const cachedPath = getCachedPath(uri);
          const cached = await FileSystem.getInfoAsync(cachedPath);
          if (cached.exists) {
            setIsProcessing(false);
            return {
              uri: cachedPath,
              width: 0,
              height: 0,
              size: cached.size || 0,
            };
          }
        }

        // Get original image info
        const originalInfo = await FileSystem.getInfoAsync(uri);
        
        // Compress and resize
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [
            {
              resize: {
                width: maxWidth,
                height: maxHeight,
              },
            },
          ],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        // Cache the result
        if (enableCache) {
          const cachedPath = getCachedPath(uri);
          await FileSystem.copyAsync({
            from: manipResult.uri,
            to: cachedPath,
          });
        }

        // Get optimized file info
        const optimizedInfo = await FileSystem.getInfoAsync(manipResult.uri);

        setIsProcessing(false);
        return {
          uri: enableCache ? getCachedPath(uri) : manipResult.uri,
          width: manipResult.width,
          height: manipResult.height,
          size: optimizedInfo.exists && "size" in optimizedInfo ? (optimizedInfo.size ?? 0) : 0,
        };
      } catch (err: any) {
        console.error("[ImageOptimize] Failed:", err);
        setError(err.message || "Failed to optimize image");
        setIsProcessing(false);
        return null;
      }
    },
    [maxWidth, maxHeight, quality, enableCache, getCachedPath]
  );

  const clearCache = useCallback(async () => {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    } catch (err) {
      console.error("[ImageOptimize] Clear cache failed:", err);
    }
  }, []);

  const getCacheSize = useCallback(async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      let totalSize = 0;
      for (const file of files) {
        const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
        if (info.exists) {
          totalSize += info.size || 0;
        }
      }
      return totalSize;
    } catch {
      return 0;
    }
  }, []);

  return {
    optimizeImage,
    isProcessing,
    error,
    clearCache,
    getCacheSize,
  };
}

// Hook for progressive image loading
export function useProgressiveImage(uri?: string) {
  const [loadedUri, setLoadedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!uri) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    // For remote images, we can't pre-load, but for local/cache we can
    if (uri.startsWith("file://") || uri.startsWith(FileSystem.cacheDirectory || "")) {
      FileSystem.getInfoAsync(uri)
        .then((info) => {
          if (info.exists) {
            setLoadedUri(uri);
          } else {
            setError(true);
          }
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    } else {
      // For remote URLs, just set it directly and let Image component handle loading
      setLoadedUri(uri);
      setLoading(false);
    }
  }, [uri]);

  return { uri: loadedUri, loading, error };
}
