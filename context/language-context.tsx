import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Platform } from "react-native";
import * as Updates from "expo-updates";
import { translations, LanguageCode, Translations } from "@/lib/i18n/translations";
import { setStaticCopyLanguage } from "@/lib/i18n/static-copy";

export const LANGUAGE_STORAGE_KEY = "@tasker_language";

const isLanguageCode = (value: string | null): value is LanguageCode =>
  value === "en" || value === "ur-Latn" || value === "ur";

async function applyDirection(isRTL: boolean) {
  if (Platform.OS === "web") {
    if (typeof document !== "undefined") {
      document.documentElement.dir = isRTL ? "rtl" : "ltr";
      document.documentElement.lang = isRTL ? "ur" : "en";
    }
    return;
  }

  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    // React Native applies forceRTL on the next app launch. Reload now so the
    // selected language and layout direction cannot remain out of sync.
    try {
      await Updates.reloadAsync();
    } catch (error) {
      // In development clients reloadAsync may be unavailable. The preference
      // is already persisted and the direction will be applied on next launch.
      console.warn("[LanguageProvider] RTL change will apply on next launch:", error);
    }
  }
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: Translations;
  isRTL: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<LanguageCode>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const savedLanguage = isLanguageCode(saved) ? saved : "en";
        setLangState(savedLanguage);
        setStaticCopyLanguage(savedLanguage);
        await applyDirection(savedLanguage === "ur");
        if (Platform.OS === "web" && typeof document !== "undefined") {
          document.documentElement.lang = savedLanguage;
        }
      } catch (err) {
        console.warn("[LanguageProvider] Failed to load language preference:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: LanguageCode) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    setLangState(newLang);
    setStaticCopyLanguage(newLang);
    await applyDirection(newLang === "ur");
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.lang = newLang;
    }
  };

  const currentTranslations = translations[language] || translations.en;
  const isRTL = language === "ur";

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: currentTranslations,
        isRTL,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
