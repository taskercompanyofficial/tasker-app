import React from "react";
import { Text as RNText, TextProps, StyleSheet, TextStyle } from "react-native";
import { useLanguage } from "@/context/language-context";
import { translateStaticCopy } from "@/lib/i18n/static-copy";

export interface AppTextProps extends TextProps {
  bold?: boolean;
  nastaliq?: boolean;
  textDirection?: "ltr" | "rtl" | "auto";
  children?: React.ReactNode;
}

export default function AppText({
  style,
  bold,
  nastaliq,
  textDirection,
  children,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: AppTextProps) {
  const { isRTL, language } = useLanguage();
  const localizedChildren = Array.isArray(children)
    ? children.map((child) =>
        typeof child === "string" ? translateStaticCopy(child, language) : child,
      )
    : typeof children === "string"
      ? translateStaticCopy(children, language)
      : children;

  const isUrdu = language === "ur";
  const flatStyle = (StyleSheet.flatten(style) || {}) as TextStyle;

  if (isUrdu) {
    const weight = flatStyle.fontWeight;
    const isBold = bold || weight === "bold" || (typeof weight === "string" && Number(weight) >= 600);

    const urduFontFamily = nastaliq
      ? isBold
        ? "NotoNastaliqUrdu-Bold"
        : "NotoNastaliqUrdu-Regular"
      : isBold
      ? "NotoNaskhArabic-Bold"
      : "NotoNaskhArabic-Regular";

    // Urdu glyphs need a taller line box; keep the requested font size intact
    // so text remains accessible and let layouts wrap or grow vertically.
    const targetLineHeight = flatStyle.lineHeight
      ? Math.max(flatStyle.lineHeight, (flatStyle.fontSize ?? 14) * 1.5)
      : (flatStyle.fontSize ?? 14) * 1.5;

    const direction = textDirection ?? (isRTL ? "rtl" : "ltr");
    // `left` and `right` in existing screen styles are physical alignments.
    // Normalize them to the active reading direction; keep centered labels centered.
    const textAlign = flatStyle.textAlign === "center"
      ? "center"
      : direction === "rtl"
        ? "right"
        : flatStyle.textAlign === "right"
          ? "right"
          : "left";

    const mergedStyle: TextStyle = {
      ...flatStyle,
      fontFamily: urduFontFamily,
      lineHeight: targetLineHeight,
      textAlign,
      writingDirection: direction,
    };

    return (
      <RNText
        style={mergedStyle}
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
        {...props}
      >
        {localizedChildren}
      </RNText>
    );
  }

  // Non-Urdu (English / Roman Urdu)
  const defaultAlign = flatStyle.textAlign || "left";
  return (
    <RNText
      style={[
        {
          writingDirection: textDirection ?? "ltr",
          textAlign: defaultAlign,
        },
        flatStyle,
      ]}
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
      {...props}
    >
      {localizedChildren}
    </RNText>
  );
}

