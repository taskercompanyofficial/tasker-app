import { StyleSheet, TextInput, TextInputProps, TextStyle } from "react-native";
import { useLanguage } from "@/context/language-context";
import { translateStaticCopy } from "@/lib/i18n/static-copy";

export interface AppTextInputProps extends TextInputProps {
  textDirection?: "ltr" | "rtl" | "auto";
}

export default function AppTextInput({
  placeholder,
  accessibilityLabel,
  accessibilityHint,
  textDirection,
  style,
  keyboardType,
  autoComplete,
  textContentType,
  ...props
}: AppTextInputProps) {
  const { language, isRTL } = useLanguage();
  const usesLtrData = ["email-address", "phone-pad", "number-pad", "decimal-pad", "numeric"].includes(keyboardType ?? "")
    || autoComplete === "email"
    || autoComplete === "tel"
    || textContentType === "emailAddress"
    || textContentType === "telephoneNumber";
  const direction = textDirection ?? (isRTL && !usesLtrData ? "rtl" : "ltr");
  const flatStyle = StyleSheet.flatten(style) as TextStyle | undefined;

  return (
    <TextInput
      {...props}
      keyboardType={keyboardType}
      autoComplete={autoComplete}
      textContentType={textContentType}
      style={[style, {
        writingDirection: direction,
        textAlign: flatStyle?.textAlign === "center" ? "center" : direction === "rtl" ? "right" : (flatStyle?.textAlign ?? "left"),
      }]}
      placeholder={
        placeholder ? translateStaticCopy(placeholder, language) : placeholder
      }
      accessibilityLabel={
        accessibilityLabel
          ? translateStaticCopy(accessibilityLabel, language)
          : accessibilityLabel
      }
      accessibilityHint={
        accessibilityHint
          ? translateStaticCopy(accessibilityHint, language)
          : accessibilityHint
      }
    />
  );
}
