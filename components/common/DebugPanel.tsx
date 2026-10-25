import AppText from "@/components/common/AppText";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addDebugLog,
  clearDebugLogs,
  DebugLogItem,
  isDebugMonitorEnabled,
  subscribeDebugLogs,
} from "@/lib/debug-monitor";

function safeSerialize(payload?: Record<string, unknown>) {
  if (!payload) return "";
  try {
    return JSON.stringify(payload);
  } catch {
    return "[unserializable payload]";
  }
}

export default function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<DebugLogItem[]>([]);

  useEffect(() => {
    if (!isDebugMonitorEnabled) return;
    const unsubscribe = subscribeDebugLogs(setLogs);
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isDebugMonitorEnabled) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => {
          addDebugLog("debug_panel_opened");
          setVisible(true);
        }}
      >
        <AppText style={styles.fabText}>DBG</AppText>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.container}>
          <View style={styles.header}>
            <AppText style={styles.title}>Debug Monitor ({logs.length})</AppText>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  clearDebugLogs();
                  addDebugLog("debug_logs_cleared");
                }}
                style={[styles.actionBtn, styles.clearBtn]}
              >
                <AppText style={styles.actionText}>Clear</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={[styles.actionBtn, styles.closeBtn]}
              >
                <AppText style={styles.actionText}>Close</AppText>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {logs.length === 0 ? (
              <AppText style={styles.empty}>No logs yet</AppText>
            ) : (
              logs.map((item) => (
                <View key={item.id} style={styles.logItem}>
                  <AppText style={styles.event}>{item.event}</AppText>
                  <AppText style={styles.ts}>{item.ts}</AppText>
                  {!!item.payload && (
                    <AppText style={styles.payload}>{safeSerialize(item.payload)}</AppText>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 14,
    bottom: 90,
    zIndex: 9999,
    backgroundColor: "#111827",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "#0B1020",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
    gap: 8,
  },
  title: {
    color: "#F9FAFB",
    fontWeight: "700",
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearBtn: {
    backgroundColor: "#7F1D1D",
  },
  closeBtn: {
    backgroundColor: "#1F2937",
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 14,
    gap: 10,
  },
  empty: {
    color: "#9CA3AF",
  },
  logItem: {
    borderWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  event: {
    color: "#F3F4F6",
    fontWeight: "700",
    fontSize: 12,
  },
  ts: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  payload: {
    color: "#D1D5DB",
    fontSize: 11,
  },
});
