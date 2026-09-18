import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/context/ctx";
import { createEcho } from "@/lib/echo";
import myAxios from "@/lib/axios.config";
import {
  CHAT_INITIATE_SUPPORT_URL,
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
      setMessages(data.data || []); 
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load message history.");
    }
  }, [mode]);

  useEffect(() => {
    if (!session.token) return;

    let isMounted = true;

    const initChat = async () => {
      setLoading(true);
      setError(null);
      try {
        const isNumericId =
          initialConversationId !== undefined &&
          initialConversationId !== null &&
          !isNaN(Number(initialConversationId)) &&
          String(initialConversationId).trim() !== "";

        let convId: number | string | undefined = isNumericId
          ? initialConversationId
          : undefined;

        // If workOrderId is provided, initiate order chat
        if (!convId && workOrderId) {
          const { data } = await myAxios.post(CHAT_INITIATE_ORDER_URL(mode, workOrderId));
          if (isMounted && data.conversation) {
            setConversation(data.conversation);
            convId = data.conversation.id;
          }
        } 
        // If neither valid conversationId nor workOrderId is provided, initiate Support Chat
        else if (!convId) {
          const { data } = await myAxios.post(CHAT_INITIATE_SUPPORT_URL(mode));
          if (isMounted && data.conversation) {
            setConversation(data.conversation);
            convId = data.conversation.id;
          }
        }

        if (convId && isMounted) {
          await fetchMessages(convId);

          // Setup Echo
          try {
            const echo = createEcho(session.token!);
            echoRef.current = echo;

            echo.private(`app-chat.${convId}`)
              .listen(".message.sent", (e: { message: AppMessage }) => {
                if (!isMounted) return;
                setMessages((prev) => {
                  if (prev.some((m) => m.id === e.message.id)) {
                    return prev;
                  }
                  return [e.message, ...prev];
                });
              });
          } catch (echoErr) {
            console.warn("WebSocket subscription optional warning:", echoErr);
          }
        }
      } catch (err: any) {
        console.error("Chat Init Error:", err);
        if (isMounted) {
          setError(err?.response?.data?.message || "Could not connect to chat.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initChat();

    return () => {
      isMounted = false;
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

    const tempId = -Date.now();
    const clientMessageId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Optimistic UI update - show message in UI instantly
    const optimisticMessage: AppMessage = {
      id: tempId,
      app_conversation_id: conversation.id,
      sender_id: session.user?.id || 0,
      sender_type: currentUserType,
      type,
      content: content || "",
      media_path: mediaFile?.uri || null,
      metadata: metadata || null,
      is_read: false,
      status: "sending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: session.user || undefined,
    };

    setMessages((prev) => [optimisticMessage, ...prev]);
    setSending(true);
    setError(null);

    try {
      let requestPayload: any;
      let headers: any = {};

      if (mediaFile) {
        const formData = new FormData();
        formData.append("type", type);
        if (content) formData.append("content", content);
        formData.append("client_message_id", clientMessageId);
        formData.append("media", {
          uri: mediaFile.uri,
          type: mediaFile.mimeType || "application/octet-stream",
          name: mediaFile.fileName || "upload_media",
        } as any);
        if (metadata) formData.append("metadata", typeof metadata === "string" ? metadata : JSON.stringify(metadata));
        requestPayload = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        requestPayload = {
          type,
          content: content || "",
          client_message_id: clientMessageId,
          metadata: metadata || null,
        };
      }

      const { data } = await myAxios.post(
        CHAT_SEND_MESSAGE_URL(mode, conversation.id),
        requestPayload,
        { headers }
      );

      setMessages((prev) => {
        // Remove temporary optimistic message and deduplicate server message
        let updated = prev.filter((m) => m.id !== tempId && m.id !== data.message.id);
        updated = [data.message, ...updated];

        // If backend support bot generated a reply
        if (data.reply && !updated.some((m) => m.id === data.reply.id)) {
          updated = [data.reply, ...updated];
        }

        return updated;
      });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to send message.";
      console.error("Send Error:", errorMsg, err?.response?.data);
      setError(errorMsg);
      // Remove failed optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
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
