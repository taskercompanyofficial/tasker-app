import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Text,
  Platform,
  Linking,
  Animated,
  Easing,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { MessageType } from "@/types/chat";
import Colors from "@/constants/Colors";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

interface ChatInputProps {
  onSendMessage: (type: MessageType, content?: string, file?: any, metadata?: any) => Promise<void>;
  sending: boolean;
  onQuickAction?: (actionId: string, label: string) => void;
  showSuggestions?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  { id: "orders", label: "📋 My Active Bookings", prompt: "Can you show me my active bookings and their status?" },
  { id: "book", label: "🛠️ Available Services", prompt: "What home repair and maintenance services do you offer?" },
  { id: "pricing", label: "💰 Rates & Pricing", prompt: "What are your visit charges and service rates?" },
  { id: "wallet", label: "💳 Wallet Balance", prompt: "How does the Tasker wallet and cashback work?" },
  { id: "helpline", label: "📞 0304-111-2717", action: "call_helpline" },
  { id: "whatsapp", label: "💬 WhatsApp Support", action: "open_whatsapp" },
];

export function ChatInput({ onSendMessage, sending, onQuickAction, showSuggestions = true }: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animations
  const recordPulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.8)).current;
  const waveAnim3 = useRef(new Animated.Value(0.4)).current;
  const waveAnim4 = useRef(new Animated.Value(0.9)).current;
  const waveAnim5 = useRef(new Animated.Value(0.5)).current;
  const timerIntervalRef = useRef<any>(null);

  // Voice Recording Pulsing & Waveform Animation
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let waveLoop: Animated.CompositeAnimation | null = null;

    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulseAnim, {
            toValue: 1.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      const animateWave = (anim: Animated.Value, dur: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: dur,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.2,
              duration: dur,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );

      waveLoop = Animated.parallel([
        animateWave(waveAnim1, 350),
        animateWave(waveAnim2, 450),
        animateWave(waveAnim3, 280),
        animateWave(waveAnim4, 520),
        animateWave(waveAnim5, 380),
      ]);
      waveLoop.start();
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      recordPulseAnim.setValue(1);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pulseLoop) pulseLoop.stop();
      if (waveLoop) waveLoop.stop();
    };
  }, [isRecording]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const handleSendText = () => {
    if (!text.trim() || sending) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSendMessage("text", text.trim());
    setText("");
    setShowAttachMenu(false);
  };

  const handleSuggestionPress = (sug: typeof DEFAULT_SUGGESTIONS[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (sug.action === "call_helpline") {
      Linking.openURL("tel:03041112717").catch(() => {});
      return;
    }
    if (sug.action === "open_whatsapp") {
      Linking.openURL("https://wa.me/923041112717").catch(() => {});
      return;
    }
    const messageToSend = (sug as any).prompt || sug.label;
    onSendMessage("text", messageToSend);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const type: MessageType = asset.type === "video" ? "video" : "image";
      onSendMessage(type, "", asset);
      setShowAttachMenu(false);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled) {
      const asset = result.assets[0];
      onSendMessage("document", "", asset, { file_name: asset.name, file_size: asset.size });
      setShowAttachMenu(false);
    }
  };

  const shareLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    onSendMessage("location", "", undefined, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setShowAttachMenu(false);
  };

  const startRecording = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        alert("Microphone permission is required to record voice notes.");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(true);
      const anyRecorder = recorder as any;
      if (typeof anyRecorder.prepareToRecordAsync === "function") {
        await anyRecorder.prepareToRecordAsync();
      }
      if (typeof anyRecorder.recordAsync === "function") {
        await anyRecorder.recordAsync();
      } else if (typeof anyRecorder.record === "function") {
        await anyRecorder.record();
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setIsRecording(false);
      const anyRecorder = recorder as any;
      if (typeof anyRecorder.stopAsync === "function") {
        await anyRecorder.stopAsync();
      } else if (typeof anyRecorder.stop === "function") {
        await anyRecorder.stop();
      }
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to cancel recording", err);
    }
  };

  const finishAndSendRecording = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsRecording(false);
      const anyRecorder = recorder as any;
      if (typeof anyRecorder.stopAsync === "function") {
        await anyRecorder.stopAsync();
      } else if (typeof anyRecorder.stop === "function") {
        await anyRecorder.stop();
      }
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => {});
      const uri = recorder.uri;
      if (uri) {
        onSendMessage("audio", "", { uri, mimeType: "audio/m4a", fileName: "voice_note.m4a" });
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const isTyping = text.length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: isKeyboardOpen
            ? 4
            : Math.max(insets.bottom, 8),
        },
      ]}
    >
      {/* Quick Suggestions Strip (Only when not typing or recording) */}
      {showSuggestions && !isTyping && !isRecording && (
        <View style={styles.suggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContent}
          >
            {DEFAULT_SUGGESTIONS.map((sug) => (
              <TouchableOpacity
                key={sug.id}
                style={styles.suggestionPill}
                onPress={() => handleSuggestionPress(sug)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{sug.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main Input Row */}
      <View style={styles.inputRow}>
        {/* If Recording Voice Note: Animated Voice Bar */}
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <View style={styles.recordingLeft}>
              <Animated.View
                style={[
                  styles.redRecordingDot,
                  { transform: [{ scale: recordPulseAnim }] },
                ]}
              />
              <Text style={styles.recordingTimer}>{formatTimer(recordingSeconds)}</Text>
            </View>

            {/* Audio Waveform Animation Bars */}
            <View style={styles.waveformContainer}>
              {[waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5].map((anim, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.waveBar,
                    { transform: [{ scaleY: anim }] },
                  ]}
                />
              ))}
            </View>

            {/* Cancel & Send Actions */}
            <View style={styles.recordingActions}>
              <TouchableOpacity
                style={styles.cancelRecBtn}
                onPress={cancelRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendRecBtn}
                onPress={finishAndSendRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Action Buttons: Only show when not typing or when toggle expanded */}
            {!isTyping || showAttachMenu ? (
              <View style={styles.actionsLeft}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={pickDocument}
                  activeOpacity={0.7}
                >
                  <Ionicons name="attach-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={shareLocation}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.expandAttachBtn}
                onPress={() => setShowAttachMenu(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={24} color="#64748B" />
              </TouchableOpacity>
            )}

            {/* Expanded Text Input Bar */}
            <TextInput
              style={[
                styles.input,
                isTyping && !showAttachMenu && styles.expandedInput,
              ]}
              placeholder="Type your message here..."
              placeholderTextColor="#94A3B8"
              value={text}
              onChangeText={(val) => {
                setText(val);
                if (val.length === 0) setShowAttachMenu(false);
              }}
              multiline
              editable={!sending}
            />

            {/* Send or Voice Record Button */}
            {isTyping ? (
              <TouchableOpacity
                style={[styles.sendButton, sending && styles.disabledButton]}
                onPress={handleSendText}
                disabled={sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.micButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Bottom Remarks / AI Accuracy Disclaimer */}
      {showSuggestions && !isRecording && (
        <View style={styles.bottomDisclaimerRow}>
          <Text style={styles.bottomDisclaimerText}>
            Tasky AI can make mistakes. Verify important details with live support.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingBottom: Platform.OS === "ios" ? 4 : 4,
  },
  suggestionsContainer: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  suggestionsContent: {
    paddingHorizontal: 10,
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 6,
    gap: 6,
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 3,
  },
  expandAttachBtn: {
    padding: 6,
    marginBottom: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 90,
    fontSize: 14,
    color: "#0F172A",
  },
  expandedInput: {
    backgroundColor: "#F1F5F9",
  },
  sendButton: {
    backgroundColor: Colors.themes.customer.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  micButton: {
    backgroundColor: Colors.themes.customer.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Voice Recording Bar Styles
  recordingContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  recordingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  redRecordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  recordingTimer: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B91C1C",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 24,
  },
  waveBar: {
    width: 3.5,
    height: 20,
    borderRadius: 2,
    backgroundColor: "#EF4444",
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cancelRecBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  sendRecBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.themes.customer.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  bottomDisclaimerRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  bottomDisclaimerText: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "400",
  },
});


