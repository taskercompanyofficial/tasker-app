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

// Helper to check if an existing message is the optimistic counterpart of an incoming server message
function isOptimisticMatch(m: AppMessage, incoming: AppMessage): boolean {
  // If client_message_id matches
  if (
    m.client_message_id &&
    incoming.client_message_id &&
    m.client_message_id === incoming.client_message_id
  ) {
    return true;
  }
  // If m is optimistic (id < 0) and matches sender & content
  if (
    m.id < 0 &&
    Number(m.sender_id) === Number(incoming.sender_id) &&
    m.sender_type === incoming.sender_type &&
    m.type === incoming.type &&
    (m.content || "").trim() === (incoming.content || "").trim()
  ) {
    return true;
  }
  return false;
}

// Helper to remove duplicate IDs
function deduplicateMessages(messages: AppMessage[]): AppMessage[] {
  const seenIds = new Set<number>();
  const result: AppMessage[] = [];
  for (const m of messages) {
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id);
      result.push(m);
    }
  }
  return result;
}

// Helper to sort messages descending for inverted FlatList:
// messages[0] is newest (bottom of screen), messages[N-1] is oldest (top of screen)
export function sortMessagesDescending(messages: AppMessage[]): AppMessage[] {
  return [...messages].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

    // If timestamps differ by more than 2 seconds, trust the timestamp
    if (Math.abs(timeB - timeA) > 2000) {
      return timeB - timeA;
    }

    // If both are saved server messages (id > 0), higher database ID is newer
    if (a.id > 0 && b.id > 0) {
      return b.id - a.id;
    }

    // If one is optimistic (id < 0) and the other is a server message (id > 0):
    // Server reply (b) to this optimistic message (a) is newer
    if (a.id < 0 && b.id > 0) {
      return 1;
    }
    if (a.id > 0 && b.id < 0) {
      return -1;
    }

    // If both are optimistic:
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return a.id - b.id;
  });
}

// Helper to upsert a message into an existing list without creating duplicates
function upsertMessage(
  list: AppMessage[],
  msg: AppMessage,
  optimisticTempId?: number
): AppMessage[] {
  const next = [...list];

  // 1. Check if msg already exists by server ID
  const idIndex = next.findIndex((m) => m.id === msg.id);
  if (idIndex !== -1) {
    next[idIndex] = { ...next[idIndex], ...msg };
    return next;
  }

  // 2. Check if it matches an optimistic message
  const optIndex = next.findIndex(
    (m) =>
      (optimisticTempId !== undefined && m.id === optimisticTempId) ||
      isOptimisticMatch(m, msg)
  );
  if (optIndex !== -1) {
    next[optIndex] = msg;
    return next;
  }

  // 3. Otherwise add new message
  next.push(msg);
  return next;
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
      const rawMessages: AppMessage[] = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
      setMessages(sortMessagesDescending(deduplicateMessages(rawMessages))); 
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
                const incoming = e?.message;
                if (!incoming || incoming.id === undefined) return;

                // If reply is received from partner or AI bot, dismiss typing indicator
                if (incoming.sender_type !== currentUserType) {
                  setSending(false);
                }

                setMessages((prev) => {
                  const updated = upsertMessage(prev, incoming);
                  return sortMessagesDescending(deduplicateMessages(updated));
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
  }, [workOrderId, initialConversationId, session.token, mode, fetchMessages, currentUserType]);

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
      client_message_id: clientMessageId,
      status: "sending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: session.user || undefined,
    };

    setMessages((prev) => sortMessagesDescending([optimisticMessage, ...prev]));
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
        let updated = [...prev];

        if (data?.message) {
          updated = upsertMessage(updated, data.message, tempId);
        }

        // Clean up tempId if still present
        updated = updated.filter((m) => m.id !== tempId);

        if (data?.reply) {
          updated = upsertMessage(updated, data.reply);
        }

        return sortMessagesDescending(deduplicateMessages(updated));
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
