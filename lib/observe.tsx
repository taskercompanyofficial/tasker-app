import React from "react";
import { NativeModules } from "react-native";

let Observe: any = {
  configure: () => {},
};
let ObserveRoot: any = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
let useObserve: any = () => ({ markInteractive: () => {} });

// Only require expo-observe if the native module is present (EAS build / Development build)
const hasNativeObserve = !!(
  NativeModules.ExpoAppMetrics || NativeModules.ExponentAppMetrics
);

if (hasNativeObserve) {
  try {
    const mod = require("expo-observe");
    if (mod) {
      Observe = mod.Observe;
      ObserveRoot = mod.ObserveRoot;
      useObserve = mod.useObserve;
    }
  } catch (e) {
    console.warn("[Observe] Failed to load native expo-observe:", e);
  }
}

export { Observe, ObserveRoot, useObserve };
