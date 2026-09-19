import React from "react";
import CustomerSupportChatHub from "@/app/customer/support-chat";

/**
 * OrderChatScreen delegates directly to the unified CustomerSupportChatHub
 * so order-level technician chats share the exact same rich, real-time
 * support interface, header actions, and quick-switch capabilities.
 */
export default function OrderChatScreen() {
  return <CustomerSupportChatHub />;
}
