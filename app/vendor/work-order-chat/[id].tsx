import React, { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ChatRoom } from "@/components/Chat/ChatRoom";
import { SafeAreaView } from "react-native-safe-area-context";
import myAxios from "@/lib/axios.config";
import { VENDOR_WORK_ORDER_URL } from "@/lib/api-endpoints";

export default function WorkOrderChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    myAxios
      .get(`${VENDOR_WORK_ORDER_URL}/${id}`)
      .then((res) => {
        if (!isMounted) return;
        const phone =
          res.data?.data?.customer?.phone ||
          res.data?.data?.customer?.whatsapp ||
          res.data?.data?.extra_number ||
          null;
        if (phone) setCustomerPhone(String(phone).trim());
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatRoom workOrderId={id} partnerPhone={customerPhone} />
    </SafeAreaView>
  );
}
