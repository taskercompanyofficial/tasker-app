import { useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetwork } from "./use-network";
import myAxios from "@/lib/axios.config";
import Toast from "react-native-toast-message";

const OFFLINE_QUEUE_KEY = "@offline_api_queue";

interface QueuedRequest {
  id: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: any;
  headers?: any;
  timestamp: number;
  retryCount: number;
}

export function useOfflineQueue() {
  const { isOffline } = useNetwork();
  const processingRef = useRef(false);

  // Add request to queue
  const queueRequest = useCallback(async (request: Omit<QueuedRequest, "id" | "timestamp" | "retryCount">) => {
    try {
      const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: QueuedRequest[] = existing ? JSON.parse(existing) : [];
      
      const newRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      queue.push(newRequest);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      
      Toast.show({
        type: "info",
        text1: "Action saved",
        text2: "Will sync when you're back online",
      });
      
      return true;
    } catch (error) {
      console.error("[OfflineQueue] Failed to queue request:", error);
      return false;
    }
  }, []);

  // Process queued requests
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!existing) return;

      const queue: QueuedRequest[] = JSON.parse(existing);
      if (queue.length === 0) return;

      Toast.show({
        type: "info",
        text1: `Syncing ${queue.length} pending actions...`,
      });

      const remaining: QueuedRequest[] = [];

      for (const request of queue) {
        try {
          await myAxios({
            url: request.url,
            method: request.method,
            data: request.data,
            headers: request.headers,
          });
          console.log("[OfflineQueue] Synced:", request.url);
        } catch (error) {
          if (request.retryCount < 3) {
            remaining.push({ ...request, retryCount: request.retryCount + 1 });
          } else {
            console.error("[OfflineQueue] Max retries exceeded:", request.url);
          }
        }
      }

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));

      if (remaining.length === 0) {
        Toast.show({
          type: "success",
          text1: "All actions synced!",
        });
      }
    } catch (error) {
      console.error("[OfflineQueue] Process error:", error);
    } finally {
      processingRef.current = false;
    }
  }, []);

  // Auto-process when back online
  useEffect(() => {
    if (!isOffline) {
      processQueue();
    }
  }, [isOffline, processQueue]);

  // Get queue length
  const getQueueLength = useCallback(async () => {
    const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!existing) return 0;
    return JSON.parse(existing).length;
  }, []);

  // Clear queue
  const clearQueue = useCallback(async () => {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  }, []);

  return {
    queueRequest,
    processQueue,
    getQueueLength,
    clearQueue,
  };
}

// Helper hook for components
export function useOfflineAction() {
  const { isOffline } = useNetwork();
  const { queueRequest } = useOfflineQueue();

  const executeOrQueue = useCallback(async (
    action: () => Promise<any>,
    queueData: Omit<QueuedRequest, "id" | "timestamp" | "retryCount">
  ) => {
    if (isOffline) {
      return queueRequest(queueData);
    }
    
    try {
      return await action();
    } catch (error: any) {
      // If network error, queue it
      if (!error.response && error.message?.includes("Network")) {
        return queueRequest(queueData);
      }
      throw error;
    }
  }, [isOffline, queueRequest]);

  return { executeOrQueue, isOffline };
}
