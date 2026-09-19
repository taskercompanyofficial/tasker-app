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
  Modal,
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
import { useSession } from "@/context/ctx";

interface ChatInputProps {
  onSendMessage: (type: MessageType, content?: string, file?: any, metadata?: any) => Promise<void>;
  sending: boolean;
  onQuickAction?: (actionId: string, label: string) => void;
  showSuggestions?: boolean;
  suggestions?: Array<{ id: string; label: string; prompt?: string; action?: string }>;
}

const DEFAULT_SUGGESTIONS = [
  { id: "orders", label: "📋 My Active Bookings", prompt: "Can you show me my active bookings and their status?" },
  { id: "book", label: "🛠️ Available Services", prompt: "What home repair and maintenance services do you offer?" },
  { id: "pricing", label: "💰 Rates & Pricing", prompt: "What are your visit charges and service rates?" },
  { id: "wallet", label: "💳 Wallet Balance", prompt: "How does the Tasker wallet and cashback work?" },
  { id: "helpline", label: "📞 0304-111-2717", action: "call_helpline" },
  { id: "whatsapp", label: "💬 WhatsApp Support", action: "open_whatsapp" },
];

const VENDOR_SUGGESTIONS = [
  { id: "vendor_jobs", label: "📋 My Assigned Jobs", prompt: "Show my assigned complaints and active jobs status" },
  { id: "vendor_rates", label: "💰 Commission & Payouts", prompt: "How do vendor commission, payouts, and ledger work?" },
  { id: "vendor_workflow", label: "⚙️ Job Completion Guide", prompt: "What are the rules and steps to complete a service order?" },
  { id: "vendor_staff", label: "👥 Technician Assignment", prompt: "How do I assign my staff technicians to complaints?" },
  { id: "helpline", label: "📞 0304-111-2717", action: "call_helpline" },
  { id: "whatsapp", label: "💬 Vendor Support", action: "open_whatsapp" },
];

export function ChatInput({
  onSendMessage,
  sending,
  onQuickAction,
  showSuggestions = true,
  suggestions: propSuggestions,
}: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const isVendor = session.appMode === "vendor" || session.appMode === "vendor_staff";
  const activeSuggestions = propSuggestions || (isVendor ? VENDOR_SUGGESTIONS : DEFAULT_SUGGESTIONS);

  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showAttachModal, setShowAttachModal] = useState(false);
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
    setShowAttachModal(false);
  };

  const handleSuggestionPress = (sug: { id: string; label: string; prompt?: string; action?: string }) => {
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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const type: MessageType = asset.type === "video" ? "video" : "image";
        onSendMessage(type, "", asset);
        setShowAttachModal(false);
      }
    } catch (e) {
      console.warn("Pick image error:", e);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission is required to take photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        onSendMessage("image", "", asset);
        setShowAttachModal(false);
      }
    } catch (e) {
      console.warn("Take photo error:", e);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled) {
        const asset = result.assets[0];
        onSendMessage("document", "", asset, { file_name: asset.name, file_size: asset.size });
        setShowAttachModal(false);
      }
    } catch (e) {
      console.warn("Pick document error:", e);
    }
  };

  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission is required to share your current location.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      onSendMessage("location", "", undefined, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setShowAttachModal(false);
    } catch (e) {
      console.warn("Share location error:", e);
    }
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
            {activeSuggestions.map((sug) => (
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
            {/* Single Attach Trigger Button */}
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowAttachModal(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#64748B" />
            </TouchableOpacity>

            {/* Clean, Uniform Text Input Bar */}
            <TextInput
              style={styles.input}
              placeholder="Type your message here..."
              placeholderTextColor="#94A3B8"
              value={text}
              onChangeText={setText}
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

      {/* Attachment Action Sheet Modal */}
      <Modal
        visible={showAttachModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachModal(false)}
      >
        <TouchableOpacity
          style={styles.attachModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachModal(false)}
        >
          <View style={styles.attachSheet}>
            <View style={styles.attachSheetHandle} />
            <Text style={styles.attachSheetTitle}>Share & Attach</Text>

            <View style={styles.attachGrid}>
              {/* 1. Camera */}
              <TouchableOpacity
                style={styles.attachGridItem}
                onPress={() => {
                  setShowAttachModal(false);
                  takePhoto();
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: "#EFF6FF" }]}>
                  <Ionicons name="camera" size={24} color="#2563EB" />
                </View>
                <Text style={styles.attachGridLabel}>Camera</Text>
              </TouchableOpacity>

              {/* 2. Photo / Video Gallery */}
              <TouchableOpacity
                style={styles.attachGridItem}
                onPress={() => {
                  setShowAttachModal(false);
                  pickImage();
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: "#FDF2F8" }]}>
                  <Ionicons name="images" size={24} color="#DB2777" />
                </View>
                <Text style={styles.attachGridLabel}>Gallery</Text>
              </TouchableOpacity>

              {/* 3. Document */}
              <TouchableOpacity
                style={styles.attachGridItem}
                onPress={() => {
                  setShowAttachModal(false);
                  pickDocument();
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: "#F5F3FF" }]}>
                  <Ionicons name="document-text" size={24} color="#7C3AED" />
                </View>
                <Text style={styles.attachGridLabel}>Document</Text>
              </TouchableOpacity>

              {/* 4. Location */}
              <TouchableOpacity
                style={styles.attachGridItem}
                onPress={() => {
                  setShowAttachModal(false);
                  shareLocation();
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconCircle, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons name="location" size={24} color="#059669" />
                </View>
                <Text style={styles.attachGridLabel}>Location</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.attachCancelBtn}
              onPress={() => setShowAttachModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.attachCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Remarks / AI Accuracy Disclaimer */}
      {showSuggestions && !isRecording && !isKeyboardOpen && (
        <View style={styles.bottomDisclaimerRow}>
          <Text style={styles.bottomDisclaimerText}>
            {isVendor
              ? "Tasker AI Helpdesk can make mistakes. Verify contract and settlement details with operations support."
              : "Tasky AI can make mistakes. Verify important details with live support."}
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
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    minHeight: 40,
    maxHeight: 110,
    fontSize: 15,
    color: "#0F172A",
  },
  sendButton: {
    backgroundColor: Colors.themes.customer.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  micButton: {
    backgroundColor: Colors.themes.customer.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.themes.customer.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Attachment Action Sheet Modal Styles
  attachModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  attachSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  attachSheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  attachSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 18,
    textAlign: "center",
  },
  attachGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
  },
  attachGridItem: {
    alignItems: "center",
    gap: 8,
    width: 76,
  },
  attachIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  attachGridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  attachCancelBtn: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  attachCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
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


