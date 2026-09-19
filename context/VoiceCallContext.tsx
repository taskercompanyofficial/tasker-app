import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Room, RoomEvent, Track } from "livekit-client";
import { useAuthStore } from "@/context/auth-store";
import { useEcho } from "@/context/EchoProvider";
import myAxios from "@/lib/axios.config";
import {
  VOICE_INITIATE_CALL_URL,
  VOICE_ANSWER_CALL_URL,
  VOICE_REJECT_CALL_URL,
  VOICE_END_CALL_URL,
} from "@/lib/api-endpoints";
import IncomingCallModal from "@/components/voice/IncomingCallModal";
import ActiveCallModal from "@/components/voice/ActiveCallModal";

// ─── LiveKit React Native Initialization ─────────────────────────────────────
let AudioSession: any = null;
if (Platform.OS !== "web") {
  try {
    const livekitRN = require("@livekit/react-native");
    if (livekitRN.registerGlobals) {
      livekitRN.registerGlobals();
    }
    AudioSession = livekitRN.AudioSession;
  } catch (err) {
    console.warn("[VoiceCallContext] LiveKit React Native native bridge not loaded:", err);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ActiveCallData {
  id: number;
  room_name: string;
  token?: string;
  server_url?: string;
  participant_name: string;
  participant_avatar?: string | null;
  work_order_id: number;
  work_order_number?: string | null;
  is_caller: boolean;
  status: "ringing" | "connected" | "ended";
}

export interface IncomingCallData {
  call_id: number;
  room_name: string;
  caller_name: string;
  caller_avatar?: string | null;
  caller_type?: string;
  work_order_id: number;
  work_order_number?: string | null;
}

export interface InitiateCallParams {
  workOrderId: number;
  receiverName?: string;
  receiverAvatar?: string | null;
  workOrderNumber?: string | null;
}

interface VoiceCallContextType {
  activeCall: ActiveCallData | null;
  incomingCall: IncomingCallData | null;
  isCallActive: boolean;
  isIncoming: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  initiateCall: (params: InitiateCallParams) => Promise<boolean>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
}

const VoiceCallContext = createContext<VoiceCallContextType>({
  activeCall: null,
  incomingCall: null,
  isCallActive: false,
  isIncoming: false,
  isMuted: false,
  isSpeakerOn: true,
  initiateCall: async () => false,
  answerCall: async () => {},
  rejectCall: async () => {},
  endCall: async () => {},
  toggleMute: () => {},
  toggleSpeaker: () => {},
});

export function useVoiceCall(): VoiceCallContextType {
  return useContext(VoiceCallContext);
}

// ─── LiveKit Server URL Helper ────────────────────────────────────────────────
function resolveLiveKitUrl(backendServerUrl?: string): string {
  const envUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL;
  let targetUrl = backendServerUrl || envUrl || "ws://127.0.0.1:7880";

  // For Android Emulator, rewrite localhost/127.0.0.1 to 10.0.2.2
  if (Platform.OS === "android") {
    if (targetUrl.includes("127.0.0.1")) {
      targetUrl = targetUrl.replace("127.0.0.1", "10.0.2.2");
    } else if (targetUrl.includes("localhost")) {
      targetUrl = targetUrl.replace("localhost", "10.0.2.2");
    }
  }

  return targetUrl;
}

// ─── Provider Component ───────────────────────────────────────────────────────
export function VoiceCallProvider({ children }: PropsWithChildren) {
  const appMode = useAuthStore((state) => state.appMode);
  const token = useAuthStore((state) => state.token);
  const { onVoiceIncomingCall, onVoiceStatusUpdated } = useEcho();

  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);

  const roomRef = useRef<Room | null>(null);
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normalize appMode to the parameter expected by URL helpers
  const currentMode =
    appMode === "vendor"
      ? "vendor"
      : appMode === "vendor_staff"
        ? "vendor-staff"
        : "customer";

  // ── Disconnect & Cleanup Room ───────────────────────────────────────────────
  const cleanupRoom = useCallback(async () => {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    if (roomRef.current) {
      try {
        await roomRef.current.disconnect();
      } catch (e) {
        console.warn("[VoiceCall] Error disconnecting LiveKit room:", e);
      }
      roomRef.current = null;
    }

    if (AudioSession?.stopAudioSession) {
      try {
        await AudioSession.stopAudioSession();
      } catch (_) {}
    }

    setIsMuted(false);
    setIsSpeakerOn(true);
  }, []);

  // ── Connect to LiveKit Room ─────────────────────────────────────────────────
  const connectToRoom = useCallback(
    async (rawServerUrl: string, liveKitToken: string) => {
      const serverUrl = resolveLiveKitUrl(rawServerUrl);
      console.log(`[VoiceCall] Connecting to LiveKit at ${serverUrl}...`);

      try {
        const room = new Room({
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
          adaptiveStream: false,
          dynacast: false,
        });

        roomRef.current = room;

        // Remote audio track playback
        room.on(RoomEvent.TrackSubscribed, (track: Track) => {
          console.log(`[VoiceCall] 🔊 Subscribed to track kind: ${track.kind}`);
          if (track.kind === Track.Kind.Audio) {
            try {
              track.attach();
            } catch (err) {
              console.warn("[VoiceCall] track.attach error:", err);
            }
          }
        });

        // Remote participant connected
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log(`[VoiceCall] 👤 Participant connected: ${participant.identity}`);
          setActiveCall((prev) => (prev ? { ...prev, status: "connected" } : null));
          if (ringingTimeoutRef.current) {
            clearTimeout(ringingTimeoutRef.current);
            ringingTimeoutRef.current = null;
          }
        });

        // Remote participant disconnected
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log(`[VoiceCall] 👤 Participant left: ${participant.identity}`);
          Toast.show({
            type: "info",
            text1: "Call Ended",
            text2: "The other participant has left the call.",
          });
          cleanupRoom();
          setActiveCall(null);
        });

        // Room disconnected
        room.on(RoomEvent.Disconnected, () => {
          console.log("[VoiceCall] LiveKit room disconnected");
        });

        await room.connect(serverUrl, liveKitToken);

        // Start native audio session
        if (AudioSession?.startAudioSession) {
          try {
            await AudioSession.startAudioSession();
          } catch (err) {
            console.warn("[VoiceCall] AudioSession.startAudioSession error:", err);
          }
        }

        // Publish local microphone
        await room.localParticipant.setMicrophoneEnabled(true);
        console.log("[VoiceCall] Microphone enabled & connected to room");
      } catch (error) {
        console.error("[VoiceCall] LiveKit connection failed:", error);
        Toast.show({
          type: "error",
          text1: "Connection Error",
          text2: "Could not establish media connection to voice server.",
        });
        await cleanupRoom();
        setActiveCall(null);
      }
    },
    [cleanupRoom]
  );

  // ── Initiate Call (Caller Side) ─────────────────────────────────────────────
  const initiateCall = useCallback(
    async ({
      workOrderId,
      receiverName = "Service Provider",
      receiverAvatar = null,
      workOrderNumber = null,
    }: InitiateCallParams): Promise<boolean> => {
      if (activeCall || incomingCall) {
        Toast.show({
          type: "info",
          text1: "Call in Progress",
          text2: "You are already in a call or receiving one.",
        });
        return false;
      }

      // Optimistically display active modal in 'ringing' status
      setActiveCall({
        id: 0,
        room_name: "",
        participant_name: receiverName,
        participant_avatar: receiverAvatar,
        work_order_id: workOrderId,
        work_order_number: workOrderNumber,
        is_caller: true,
        status: "ringing",
      });

      try {
        const response = await myAxios.post(VOICE_INITIATE_CALL_URL(currentMode), {
          work_order_id: workOrderId,
        });

        if (response.data?.status === "success") {
          const { call_session, token: liveKitToken, server_url } = response.data.data;

          setActiveCall({
            id: call_session.id,
            room_name: call_session.room_name,
            token: liveKitToken,
            server_url: server_url,
            participant_name: receiverName,
            participant_avatar: receiverAvatar,
            work_order_id: workOrderId,
            work_order_number: workOrderNumber,
            is_caller: true,
            status: "ringing",
          });

          // Connect to LiveKit room immediately so caller is ready to talk
          await connectToRoom(server_url, liveKitToken);

          // 45s Ringing Timeout (auto cancel if no answer)
          ringingTimeoutRef.current = setTimeout(async () => {
            console.log("[VoiceCall] Ringing timed out - no answer");
            Toast.show({
              type: "info",
              text1: "No Answer",
              text2: "The recipient did not answer the call.",
            });
            try {
              await myAxios.post(VOICE_END_CALL_URL(call_session.id, currentMode));
            } catch (_) {}
            await cleanupRoom();
            setActiveCall(null);
          }, 45000);

          return true;
        } else {
          throw new Error(response.data?.message || "Failed to initiate call");
        }
      } catch (error: any) {
        console.error("[VoiceCall] initiateCall error:", error);
        const errorMsg =
          error?.response?.data?.message || error?.message || "Could not start voice call.";
        Toast.show({
          type: "error",
          text1: "Call Failed",
          text2: errorMsg,
        });
        await cleanupRoom();
        setActiveCall(null);
        return false;
      }
    },
    [activeCall, incomingCall, currentMode, connectToRoom, cleanupRoom]
  );

  // ── Answer Call (Receiver Side) ─────────────────────────────────────────────
  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    const callId = incomingCall.call_id;
    const callerName = incomingCall.caller_name;
    const callerAvatar = incomingCall.caller_avatar;
    const workOrderId = incomingCall.work_order_id;
    const workOrderNumber = incomingCall.work_order_number;

    // Dismiss incoming ringing modal
    setIncomingCall(null);

    // Set active call modal
    setActiveCall({
      id: callId,
      room_name: incomingCall.room_name,
      participant_name: callerName,
      participant_avatar: callerAvatar,
      work_order_id: workOrderId,
      work_order_number: workOrderNumber,
      is_caller: false,
      status: "connected",
    });

    try {
      const response = await myAxios.post(VOICE_ANSWER_CALL_URL(callId, currentMode));
      if (response.data?.status === "success") {
        const { token: liveKitToken, server_url } = response.data.data;
        await connectToRoom(server_url, liveKitToken);
      } else {
        throw new Error(response.data?.message || "Failed to connect to call");
      }
    } catch (error: any) {
      console.error("[VoiceCall] answerCall error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Answer",
        text2: error?.response?.data?.message || "Could not connect call.",
      });
      await cleanupRoom();
      setActiveCall(null);
    }
  }, [incomingCall, currentMode, connectToRoom, cleanupRoom]);

  // ── Reject Call (Receiver Side) ─────────────────────────────────────────────
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    const callId = incomingCall.call_id;
    setIncomingCall(null);

    try {
      await myAxios.post(VOICE_REJECT_CALL_URL(callId, currentMode));
    } catch (err) {
      console.warn("[VoiceCall] rejectCall API error:", err);
    }
  }, [incomingCall, currentMode]);

  // ── End Call ────────────────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    const callId = activeCall?.id;
    await cleanupRoom();
    setActiveCall(null);

    if (callId) {
      try {
        await myAxios.post(VOICE_END_CALL_URL(callId, currentMode));
      } catch (err) {
        console.warn("[VoiceCall] endCall API error:", err);
      }
    }
  }, [activeCall, currentMode, cleanupRoom]);

  // ── Toggle Mute ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (roomRef.current?.localParticipant) {
      roomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
    }
  }, [isMuted]);

  // ── Toggle Speaker ──────────────────────────────────────────────────────────
  const toggleSpeaker = useCallback(() => {
    const nextSpeaker = !isSpeakerOn;
    setIsSpeakerOn(nextSpeaker);

    if (AudioSession?.setSpeakerphoneOn) {
      try {
        AudioSession.setSpeakerphoneOn(nextSpeaker);
      } catch (e) {
        console.warn("[VoiceCall] AudioSession.setSpeakerphoneOn error:", e);
      }
    }
  }, [isSpeakerOn]);

  // ── Listen to Echo Events ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // Incoming Call listener
    const unbindIncoming = onVoiceIncomingCall((event) => {
      console.log("[VoiceCall] Received incoming call event:", event);

      // If user is already on a call, ignore or auto reject
      if (activeCall) {
        console.log("[VoiceCall] User is busy, ignoring call");
        return;
      }

      setIncomingCall({
        call_id: event.call_id,
        room_name: event.room_name,
        caller_name: event.caller_name,
        caller_avatar: event.caller_avatar,
        caller_type: event.caller_type,
        work_order_id: event.work_order_id,
        work_order_number: event.work_order_number,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (_) {}
    });

    // Call Status listener
    const unbindStatus = onVoiceStatusUpdated((event) => {
      console.log(`[VoiceCall] Status update event: ${event.status} for call #${event.call_id}`);

      if (event.status === "accepted") {
        setActiveCall((prev) => {
          if (prev && prev.id === event.call_id) {
            if (ringingTimeoutRef.current) {
              clearTimeout(ringingTimeoutRef.current);
              ringingTimeoutRef.current = null;
            }
            return { ...prev, status: "connected" };
          }
          return prev;
        });
      } else if (
        event.status === "ended" ||
        event.status === "rejected" ||
        event.status === "missed"
      ) {
        if (incomingCall && incomingCall.call_id === event.call_id) {
          setIncomingCall(null);
        }

        if (activeCall && (activeCall.id === event.call_id || activeCall.id === 0)) {
          cleanupRoom();
          setActiveCall(null);
          Toast.show({
            type: "info",
            text1: event.status === "rejected" ? "Call Declined" : "Call Ended",
            text2:
              event.status === "rejected"
                ? "The other party declined the call."
                : "The voice call has ended.",
          });
        }
      }
    });

    return () => {
      unbindIncoming();
      unbindStatus();
    };
  }, [token, activeCall, incomingCall, onVoiceIncomingCall, onVoiceStatusUpdated, cleanupRoom]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupRoom();
    };
  }, [cleanupRoom]);

  const contextValue: VoiceCallContextType = {
    activeCall,
    incomingCall,
    isCallActive: !!activeCall,
    isIncoming: !!incomingCall,
    isMuted,
    isSpeakerOn,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  };

  return (
    <VoiceCallContext.Provider value={contextValue}>
      {children}

      {/* Global Incoming Call Ringing Modal */}
      {incomingCall && (
        <IncomingCallModal
          visible={!!incomingCall}
          callerName={incomingCall.caller_name}
          callerAvatar={incomingCall.caller_avatar}
          workOrderNumber={incomingCall.work_order_number}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* Global Connected/Active Call Modal */}
      {activeCall && (
        <ActiveCallModal
          visible={!!activeCall}
          participantName={activeCall.participant_name}
          participantAvatar={activeCall.participant_avatar}
          workOrderNumber={activeCall.work_order_number}
          statusText={activeCall.status === "ringing" ? "Ringing..." : null}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onEndCall={endCall}
        />
      )}
    </VoiceCallContext.Provider>
  );
}
