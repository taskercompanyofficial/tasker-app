import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/context/language-context";
import type { ComponentProps } from "react";

type DirectionalIconProps = ComponentProps<typeof Ionicons>;

const rtlIconNames: Partial<Record<DirectionalIconProps["name"], DirectionalIconProps["name"]>> = {
  "arrow-back": "arrow-forward",
  "arrow-forward": "arrow-back",
  "chevron-back": "chevron-forward",
  "chevron-forward": "chevron-back",
};

/** Renders navigation/progression icons toward the correct inline direction. */
export default function DirectionalIcon(props: DirectionalIconProps) {
  const { isRTL } = useLanguage();
  const name = isRTL ? rtlIconNames[props.name] ?? props.name : props.name;

  return <Ionicons {...props} name={name} />;
}
