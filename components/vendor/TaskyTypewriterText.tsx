import Colors from "@/constants/Colors";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface TaskyTypewriterTextProps {
  text: string;
  speedMs?: number;
  style?: any;
  cursorColor?: string;
  onComplete?: () => void;
}

export default function TaskyTypewriterText({
  text,
  speedMs = 20,
  style,
  cursorColor = "#2563EB",
  onComplete,
}: TaskyTypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, speedMs, onComplete]);

  return (
    <Text style={[styles.text, style]}>
      {displayedText}
      {isTyping ? <Text style={{ color: cursorColor, fontWeight: "900" }}> ▌</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    fontWeight: "500",
  },
});
