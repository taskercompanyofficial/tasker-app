import Toast, { ToastShowParams } from "react-native-toast-message";
import { getStaticCopyLanguage, translateStaticCopy } from "@/lib/i18n/static-copy";

/** Translate static toast copy through the app's shared source-string catalog. */
export function localizedToast(params: ToastShowParams) {
  const language = getStaticCopyLanguage();
  Toast.show({
    ...params,
    text1: params.text1 ? translateStaticCopy(params.text1, language) : params.text1,
    text2: params.text2 ? translateStaticCopy(params.text2, language) : params.text2,
  });
}
