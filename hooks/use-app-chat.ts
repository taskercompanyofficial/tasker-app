import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/context/ctx";
import { createEcho } from "@/lib/echo";
import myAxios from "@/lib/axios.config";
import {
  CHAT_INITIATE_ORDER_URL,
  CHAT_MESSAGES_URL,
  CHAT_SEND_MESSAGE_URL,
} from "@/lib/api-endpoints";
import { AppMessage, AppConversation, AppConversationParticipant, MessageType } from "@/types/chat";
import Echo from "laravel-echo";

interface UseAppChatProps {
  workOrderId?: number | string;
  conversationId?: number | string;
}

export function useAppChat({ workOrderId, conversationId: initialConversationId }: UseAppChatProps) {
  const { session } = useSession();
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [conversation, setConversation] = useState<AppConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePartner, setActivePartner] = useState<AppConversationParticipant | null>(null);
  const echoRef = useRef<Echo<"reverb"> | null>(null);

  const currentUserType = session.appMode === 'vendor' 
    ? 'App\\Models\\Vendor' 
    : session.appMode === 'vendor_staff' 
      ? 'App\\Models\\VendorStaff' 
      : 'App\\Models\\Customer';

  const mode = (session.appMode?.replace("_", "-") || "customer") as
    | "customer"
    | "vendor"
    | "vendor-staff";

  useEffect(() => {
    if (conversation?.participants) {
      const partner = conversation.participants.find(p => 
        !(p.participant_id === session.user?.id && p.participant_type === currentUserType)
      );
      setActivePartner(partner || null);
    }
  }, [conversation, session.user?.id, currentUserType]);

  const fetchMessages = useCallback(async (convId: number | string) => {
    try {
      const { data } = await myAxios.get(CHAT_MESSAGES_URL(mode, convId));
      // Laravel returns response.data for paginated results
      setMessages(data.data); 
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load message history.");
    }
  }, [mode]);

  useEffect(() => {
    if (!session.token) return;

    const initChat = async () => {
      setLoading(true);
      try {
        let convId = initialConversationId;

        // If we only have workOrderId, initiate first
        if (!convId && workOrderId) {
          const { data } = await myAxios.post(CHAT_INITIATE_ORDER_URL(mode, workOrderId));
          setConversation(data.conversation);
          convId = data.conversation.id;
        }

        if (convId) {
          await fetchMessages(convId);

          // Setup Echo
          const echo = createEcho(session.token!);
          echoRef.current = echo;

          echo.private(`app-chat.${convId}`)
            .listen(".message.sent", (e: { message: AppMessage }) => {
              setMessages((prev) => [e.message, ...prev]);
            });
        }
      } catch (err) {
        console.error("Chat Init Error:", err);
        setError("Could not connect to chat.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (echoRef.current) {
        echoRef.current.disconnect();
      }
    };
  }, [workOrderId, initialConversationId, session.token, mode, fetchMessages]);

  const sendMessage = async (
    type: MessageType = "text",
    content?: string,
    mediaFile?: any,
    metadata?: any
  ) => {
    if (!conversation) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      if (content) formData.append("content", content);
      if (mediaFile) {
        // Handle physical file for upload
        formData.append("media", {
          uri: mediaFile.uri,
          type: mediaFile.mimeType || "application/octet-stream",
          name: mediaFile.fileName || "upload_media",
        } as any);
      }
      if (metadata) formData.append("metadata", JSON.stringify(metadata));

      const { data } = await myAxios.post(
        CHAT_SEND_MESSAGE_URL(mode, conversation.id),
        formData,
        { headers: { "Content-Type": "multipart-form-data" } }
      );

      setMessages((prev) => [data.message, ...prev]);
    } catch (err) {
      console.error("Send Error:", err);
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    conversation,
    loading,
    sending,
    error,
    activePartner,
    sendMessage,
    refreshMessages: () => conversation && fetchMessages(conversation.id)
  };
}
