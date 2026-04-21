import { User } from "./user";

export type MessageType = "text" | "image" | "video" | "audio" | "location" | "document";

export interface AppMessage {
  id: number;
  app_conversation_id: number;
  sender_id: number;
  sender_type: string;
  type: MessageType;
  content: string | null;
  media_path: string | null;
  media_url?: string | null;
  metadata: any | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: User;
}

export interface AppConversationParticipant {
  id: number;
  app_conversation_id: number;
  participant_id: number;
  participant_type: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  role: string;
}

export interface AppConversation {
  id: number;
  work_order_id: number | null;
  type: "order" | "support";
  status: "active" | "closed";
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  participants?: AppConversationParticipant[];
  work_order?: any;
}
