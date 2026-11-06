import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkOrder } from "@/types/work-order";
import { useAuthStore } from "@/context/auth-store";

interface WorkOrderActivityTabProps {
  workOrder: WorkOrder;
}

interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  user?: string;
  time: string;
  date: string;
  timestamp: number;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  dotBg: string;
}

export default function WorkOrderActivityTab({
  workOrder,
}: WorkOrderActivityTabProps) {
  const { user } = useAuthStore();

  // Filter and show ONLY activity done by the current user
  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    const currentUserId = user?.id ? Number(user.id) : null;
    const currentUserName = (user?.name || "").toLowerCase().trim();

    // 1. From database histories relation
    if (workOrder.histories && Array.isArray(workOrder.histories)) {
      workOrder.histories.forEach((h: any, idx: number) => {
        const hUserId = h.user_id ? Number(h.user_id) : null;
        const hUserName = (h.user_name || "").toLowerCase().trim();
        const action = (h.action_type || "").toLowerCase();

        // Never show System, Admin, or Dispatcher activities
        if (
          hUserName === "system" ||
          hUserName.includes("admin") ||
          hUserName.includes("dispatcher")
        ) {
          return;
        }

        // Check if this action strictly belongs to the current user
        let isMine = false;
        if (
          currentUserId &&
          (hUserId === currentUserId ||
            h.metadata?.user_id === currentUserId ||
            h.metadata?.vendor_id === currentUserId)
        ) {
          isMine = true;
        } else if (
          currentUserName &&
          hUserName &&
          (hUserName === currentUserName ||
            hUserName.includes(currentUserName) ||
            currentUserName.includes(hUserName))
        ) {
          isMine = true;
        }

        if (!isMine) return;

        let iconName: keyof typeof Ionicons.glyphMap = "time-outline";
        let iconColor = "#475569";
        let dotBg = "#F1F5F9";

        if (action.includes("start") || action.includes("progress")) {
          iconName = "construct";
          iconColor = "#D97706";
          dotBg = "#FEF3C7";
        } else if (
          action.includes("file") ||
          action.includes("photo") ||
          action.includes("upload")
        ) {
          iconName = "camera";
          iconColor = "#7C3AED";
          dotBg = "#EDE9FE";
        } else if (action.includes("arrived")) {
          iconName = "location";
          iconColor = "#0284C7";
          dotBg = "#E0F2FE";
        } else if (action.includes("on_the_way")) {
          iconName = "navigate";
          iconColor = "#0284C7";
          dotBg = "#E0F2FE";
        } else if (action.includes("completed")) {
          iconName = "checkmark-circle";
          iconColor = "#059669";
          dotBg = "#D1FAE5";
        }

        const d = new Date(h.created_at || Date.now());
        const timeStr = d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dateStr = d.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        items.push({
          id: h.id || `hist-${idx}`,
          title: h.description || formatActionTitle(h.action_type),
          description:
            h.metadata?.notes || (h.field_name ? `Field: ${h.field_name}` : undefined),
          user: user?.name || h.user_name || "You",
          time: timeStr,
          date: dateStr,
          timestamp: d.getTime(),
          iconName,
          iconColor,
          dotBg,
        });
      });
    }

    // 2. Also incorporate files uploaded on this work order by user
    if (workOrder.files && Array.isArray(workOrder.files)) {
      workOrder.files.forEach((f: any, idx: number) => {
        const uploaderId = f.uploaded_by_id ? Number(f.uploaded_by_id) : null;
        const uploaderName = (f.uploaded_by?.name || f.uploader_name || "").toLowerCase().trim();

        let isMyFile = false;
        if (currentUserId && uploaderId === currentUserId) {
          isMyFile = true;
        } else if (
          currentUserName &&
          uploaderName &&
          (uploaderName.includes(currentUserName) || currentUserName.includes(uploaderName))
        ) {
          isMyFile = true;
        } else if (!uploaderId && !uploaderName) {
          // Fallback if work order is assigned to current technician
          if (
            workOrder.assigned_vendor_id === currentUserId ||
            workOrder.vendor_id === currentUserId
          ) {
            isMyFile = true;
          }
        }

        if (!isMyFile) return;

        // Avoid duplicate if already in histories
        const isAlreadyInHistory = items.some(
          (it) => it.description?.includes(f.file_name) || it.title?.includes(f.file_type?.name)
        );
        if (isAlreadyInHistory) return;

        const d = new Date(f.uploaded_at || f.created_at || Date.now());
        const fileTypeName = f.file_type?.name || "Attachment";

        items.push({
          id: `file-${f.id || idx}`,
          title: `Uploaded ${fileTypeName}`,
          description: f.file_name ? `File: ${f.file_name}` : undefined,
          user: user?.name || "You",
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: d.toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          timestamp: d.getTime(),
          iconName: "camera",
          iconColor: "#7C3AED",
          dotBg: "#EDE9FE",
        });
      });
    }

    // 3. If service is in progress and technician started it, include start milestone
    const isAssignedToMe =
      workOrder.assigned_vendor_id === currentUserId ||
      workOrder.vendor_id === currentUserId;
    if (
      isAssignedToMe &&
      (workOrder.service_start_date || workOrder.service_start_time)
    ) {
      const hasStart = items.some((it) => it.title.toLowerCase().includes("start"));
      if (!hasStart) {
        const startIso = workOrder.service_start_time
          ? `${workOrder.service_start_date}T${workOrder.service_start_time}`
          : (workOrder.service_start_date || new Date().toISOString());
        const d = new Date(startIso);
        items.push({
          id: "my-work-started",
          title: "Service Started by You",
          description: "In-progress timer active",
          user: user?.name || "You",
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: d.toLocaleDateString([], { month: "short", day: "numeric" }),
          timestamp: d.getTime(),
          iconName: "construct",
          iconColor: "#D97706",
          dotBg: "#FEF3C7",
        });
      }
    }

    // Sort descending by event timestamp
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [workOrder, user]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="person-circle-outline" size={17} color="#0F172A" />
            <Text style={styles.cardTitle}>My Activity Log</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{timelineItems.length} Events</Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>
          Only showing actions, status updates, and uploads logged by you.
        </Text>

        {timelineItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Activity Logs by You Yet</Text>
            <Text style={styles.emptySub}>
              Actions you perform on this work order will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {timelineItems.map((item, index) => {
              const isLast = index === timelineItems.length - 1;

              return (
                <View key={item.id} style={styles.timelineRow}>
                  {/* Left Column: Dot & Connector Line */}
                  <View style={styles.leftCol}>
                    <View style={[styles.dot, { backgroundColor: item.dotBg }]}>
                      <Ionicons
                        name={item.iconName}
                        size={13}
                        color={item.iconColor}
                      />
                    </View>
                    {!isLast && <View style={styles.line} />}
                  </View>

                  {/* Right Column: Event Content */}
                  <View style={[styles.rightCol, isLast && styles.rightColLast]}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                      <Text style={styles.eventTime}>{item.time}</Text>
                    </View>

                    {Boolean(item.description) && (
                      <Text style={styles.eventDesc}>{item.description}</Text>
                    )}

                    <View style={styles.eventFooter}>
                      <Text style={styles.eventDate}>{item.date}</Text>
                      {Boolean(item.user) && (
                        <View style={styles.userPill}>
                          <Ionicons name="person-outline" size={10} color="#475569" />
                          <Text style={styles.userPillText}>{item.user}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function formatActionTitle(action: string): string {
  if (!action) return "Event";
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    elevation: 0,
    shadowColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  cardDesc: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 16,
    lineHeight: 17,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 64,
  },
  leftCol: {
    alignItems: "center",
    width: 28,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  rightCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 18,
  },
  rightColLast: {
    paddingBottom: 4,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  eventTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  eventDesc: {
    fontSize: 12,
    color: "#475569",
    marginTop: 3,
    lineHeight: 16,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  eventDate: {
    fontSize: 10,
    color: "#94A3B8",
  },
  userPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  userPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
});
