import { useState, useCallback, useEffect } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

const BIOMETRIC_ENABLED_KEY = "@biometric_enabled";
const BIOMETRIC_PROMPT_SHOWN_KEY = "@biometric_prompt_shown";

export type SupportedBiometryType =
  | "FINGERPRINT"
  | "FACIAL_RECOGNITION"
  | "IRIS"
  | "NONE";

interface UseBiometricResult {
  isAvailable: boolean;
  biometryType: SupportedBiometryType | null;
  isEnabled: boolean;
  authenticate: (reason?: string) => Promise<boolean>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  hasPrompted: boolean;
  setPrompted: () => Promise<void>;
}

export function useBiometric(): UseBiometricResult {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] =
    useState<SupportedBiometryType | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPrompted, setHasPromptedState] = useState(false);

  const checkBiometric = useCallback(async () => {
    try {
      const [enabled, prompted] = await Promise.all([
        AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(BIOMETRIC_PROMPT_SHOWN_KEY),
      ]);
      setIsEnabled(enabled === "true");
      setHasPromptedState(prompted === "true");

      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (available && enrolled) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        const type = types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
          ? "FACIAL_RECOGNITION"
          : types.includes(LocalAuthentication.AuthenticationType.IRIS)
            ? "IRIS"
          : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
            ? "FINGERPRINT"
            : "NONE";

        setIsAvailable(true);
        setBiometryType(type);
      } else {
        setIsAvailable(false);
        setBiometryType("NONE");
      }
    } catch (error) {
      console.error("[Biometric] Check failed:", error);
      setIsAvailable(false);
      setBiometryType("NONE");
    }
  }, []);

  // Check availability and saved state on mount
  useEffect(() => {
    checkBiometric();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkBiometric();
      }
    });

    return () => subscription.remove();
  }, [checkBiometric]);

  const authenticate = useCallback(async (reason = "Verify your identity"): Promise<boolean> => {
    if (!isAvailable) return false;
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: "Use passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      
      return result.success;
    } catch (error) {
      console.error("[Biometric] Authentication failed:", error);
      return false;
    }
  }, [isAvailable]);

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;
    
    // Require authentication to enable
    const authenticated = await authenticate("Enable biometric authentication");
    
    if (authenticated) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
      setIsEnabled(true);
      return true;
    }
    
    return false;
  }, [isAvailable, authenticate]);

  const disableBiometric = useCallback(async () => {
    // Require authentication to disable
    const authenticated = await authenticate("Disable biometric authentication");
    
    if (authenticated) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "false");
      setIsEnabled(false);
    }
  }, [authenticate]);

  const setPrompted = useCallback(async () => {
    await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, "true");
    setHasPromptedState(true);
  }, []);

  return {
    isAvailable,
    biometryType,
    isEnabled,
    authenticate,
    enableBiometric,
    disableBiometric,
    hasPrompted,
    setPrompted,
  };
}

// Hook to prompt for biometric on app launch
export function useBiometricPrompt() {
  const biometric = useBiometric();
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    if (biometric.isAvailable && biometric.isEnabled && !biometric.hasPrompted) {
      setShouldPrompt(true);
    }
  }, [biometric.isAvailable, biometric.isEnabled, biometric.hasPrompted]);

  const prompt = useCallback(async (): Promise<boolean> => {
    if (!shouldPrompt) return true;
    
    const result = await biometric.authenticate("Unlock Tasker");
    await biometric.setPrompted();
    setShouldPrompt(false);
    return result;
  }, [shouldPrompt, biometric]);

  return {
    ...biometric,
    shouldPrompt,
    prompt,
  };
}
