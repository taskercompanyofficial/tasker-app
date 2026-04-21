import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import { useAudioRecorder, RecordingPresets } from "expo-audio";
import { MessageType } from "@/types/chat";
import Colors from "@/constants/Colors";

interface ChatInputProps {
  onSendMessage: (type: MessageType, content?: string, file?: any, metadata?: any) => Promise<void>;
  sending: boolean;
}

export function ChatInput({ onSendMessage, sending }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const handleSendText = () => {
    if (!text.trim() || sending) return;
    onSendMessage("text", text.trim());
    setText("");
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const type: MessageType = asset.type === 'video' ? 'video' : 'image';
      onSendMessage(type, "", asset);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled) {
      const asset = result.assets[0];
      onSendMessage("document", "", asset, { file_name: asset.name, file_size: asset.size });
    }
  };

  const shareLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const location = await Location.getCurrentPositionAsync({});
    onSendMessage("location", "", undefined, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });
  };

  const startRecording = async () => {
    try {
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

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      const anyRecorder = recorder as any;
      if (typeof anyRecorder.stopAsync === "function") {
        await anyRecorder.stopAsync();
      } else if (typeof anyRecorder.stop === "function") {
        await anyRecorder.stop();
      }
      const uri = recorder.uri;
      if (uri) {
        onSendMessage("audio", "", { uri, mimeType: 'audio/m4a', fileName: 'voice_note.m4a' });
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={19} color={Colors.text.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton} onPress={pickDocument}>
          <Ionicons name="attach-outline" size={19} color={Colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={shareLocation}>
          <Ionicons name="location-outline" size={19} color={Colors.text.secondary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder={isRecording ? "Recording..." : "Type a message..."}
          value={text}
          onChangeText={setText}
          multiline
          editable={!isRecording && !sending}
        />

        {text.length > 0 ? (
          <TouchableOpacity 
            style={[styles.sendButton, sending && styles.disabledButton]} 
            onPress={handleSendText}
            disabled={sending}
          >
            {sending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={18} color="white" />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.micButton, isRecording && styles.recordingMic]} 
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Ionicons name={isRecording ? "mic" : "mic-outline"} size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxHeight: 88,
    marginHorizontal: 2,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: Colors.themes.customer.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    backgroundColor: "#6B7280",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingMic: {
    backgroundColor: Colors.error,
    transform: [{ scale: 1.08 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
});
