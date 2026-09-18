import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  headers: any;
  timestamp: number;
}

interface OfflineState {
  queue: QueuedRequest[];
  
  // Actions
  enqueueAction: (request: Omit<QueuedRequest, "id" | "timestamp">) => void;
  dequeueAction: (id: string) => void;
  clearQueue: () => void;
}

type StoreListener = () => void;

const STORAGE_KEY = "offline-storage-queue";

const initialDataState: Pick<OfflineState, "queue"> = {
  queue: [],
};

const listeners = new Set<StoreListener>();

let state: OfflineState = {
  ...initialDataState,
  enqueueAction: () => {},
  dequeueAction: () => {},
  clearQueue: () => {},
};

const notify = () => {
  listeners.forEach((listener) => listener());
};

const persistState = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.queue));
  } catch (error) {
    console.warn("[OfflineStore] Failed to persist queue", error);
  }
};

const setState = (
  updater: Partial<OfflineState> | ((prev: OfflineState) => Partial<OfflineState> | OfflineState)
) => {
  const nextPatch = typeof updater === "function" ? updater(state) : updater;
  const nextState = { ...state, ...nextPatch };

  if (nextState === state) return;

  state = nextState;
  void persistState();
  notify();
};

const getState = () => state;

const actions: Omit<OfflineState, "queue"> = {
  enqueueAction: (request) => {
    const newRequest: QueuedRequest = {
      ...request,
      id: Math.random().toString(36).substring(7) + Date.now().toString(36),
      timestamp: Date.now(),
    };
    setState((prev) => ({
      queue: [...prev.queue, newRequest],
    }));
  },
  
  dequeueAction: (id) => {
    setState((prev) => ({
      queue: prev.queue.filter((req) => req.id !== id),
    }));
  },

  clearQueue: () => {
    setState({ queue: [] });
  }
};

state = { ...state, ...actions };

const hydrateFromStorage = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsedQueue = JSON.parse(raw) as QueuedRequest[];
      if (Array.isArray(parsedQueue)) {
        state = {
          ...state,
          queue: parsedQueue,
        };
      }
    }
  } catch (error) {
    console.warn("[OfflineStore] Failed to hydrate queue", error);
  } finally {
    notify();
  }
};

void hydrateFromStorage();

const identitySelector = (value: OfflineState) => value;
type Selector<T> = (state: OfflineState) => T;

export const useOfflineStore = ((selector?: Selector<unknown>) => {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => (selector ?? identitySelector)(state),
    () => (selector ?? identitySelector)(state)
  );
}) as {
  (): OfflineState;
  <T>(selector: Selector<T>): T;
  getState: () => OfflineState;
  setState: typeof setState;
};

useOfflineStore.getState = getState;
useOfflineStore.setState = setState;
