import { Alert, AlertButton, AlertOptions } from "react-native";
import { getStaticCopyLanguage, translateStaticCopy } from "@/lib/i18n/static-copy";

/** Translate static alert copy through the same catalog used by AppText. */
export function localizedAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) {
  const language = getStaticCopyLanguage();
  Alert.alert(
    translateStaticCopy(title, language),
    message ? translateStaticCopy(message, language) : message,
    buttons?.map((button) => ({
      ...button,
      text: button.text ? translateStaticCopy(button.text, language) : button.text,
    })),
    options,
  );
}
