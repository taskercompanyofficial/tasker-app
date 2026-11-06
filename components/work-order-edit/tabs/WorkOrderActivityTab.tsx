import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkOrder } from "@/types/work-order";

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
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  dotBg: string;
}

export default function WorkOrderActivityTab({
  workOrder,
}: WorkOrderActivityTabProps) {
  // Format history from histories array + standard lifecycle milestones
  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];

    // 1. From database histories relation if available
    if (workOrder.histories && Array.isArray(workOrder.histories)) {
      workOrder.histories.forEach((h: any, idx: number) => {
        const action = (h.action_type || "").toLowerCase();
        let iconName: keyof typeof Ionicons.glyphMap = "time-outline";
        let iconColor = "#475569";
        let dotBg = "#F1F5F9";

        if (action.includes("created")) {
          iconName = "sparkles";
          iconColor = "#059669";
          dotBg = "#D1FAE5";
        } else if (action.includes("assigned")) {
          iconName = "person-add";
          iconColor = "#0284C7";
          dotBg = "#E0F2FE";
        } else if (action.includes("status") || action.includes("progress")) {
          iconName = "sync-outline";
          iconColor = "#D97706";
          dotBg = "#FEF3C7";
        } else if (action.includes("file") || action.includes("photo")) {
          iconName = "camera";
          iconColor = "#7C3AED";
          dotBg = "#EDE9FE";
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
          description: h.metadata?.notes || h.field_name ? `Field: ${h.field_name}` : undefined,
          user: h.user_name || "System",
          time: timeStr,
          date: dateStr,
          iconName,
          iconColor,
          dotBg,
        });
      });
    }

    // 2. Synthesize key milestone timestamps if not in histories
    if (items.length === 0) {
      if (workOrder.completed_at) {
        items.push(createMilestone("Completed", "Work finished & verified", workOrder.completed_at, "checkmark-circle", "#059669", "#D1FAE5"));
      }
      if (workOrder.service_start_date) {
        const startIso = workOrder.service_start_time
          ? `${workOrder.service_start_date}T${workOrder.service_start_time}`
          : workOrder.service_start_date;
        items.push(createMilestone("Work Started", "Technician started service timer", startIso, "construct", "#D97706", "#FEF3C7"));
      }
      if (workOrder.accepted_at) {
        items.push(createMilestone("Job Accepted", "Vendor accepted work order dispatch", workOrder.accepted_at, "checkmark-done", "#0284C7", "#E0F2FE"));
      }
      if (workOrder.assigned_at) {
        items.push(createMilestone("Order Dispatched", "Work order assigned to vendor", workOrder.assigned_at, "paper-plane", "#475569", "#F1F5F9"));
      }
      if (workOrder.created_at) {
        items.push(createMilestone("Order Created", "Customer placed service request", workOrder.created_at, "sparkles", "#059669", "#D1FAE5"));
      }
    }

    return items;
  }, [workOrder]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="git-commit-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Work Order Lifecycle Trail</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{timelineItems.length} Events</Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>
          Chronological record of status changes, file uploads, and milestone timestamps.
        </Text>

        {timelineItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Activity Logs Yet</Text>
            <Text style={styles.emptySub}>
              Actions performed on this work order will appear here in chronological order.
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

function createMilestone(
  title: string,
  desc: string,
  isoString: string,
  iconName: keyof typeof Ionicons.glyphMap,
  iconColor: string,
  dotBg: string
): TimelineItem {
  const d = new Date(isoString);
  return {
    id: `milestone-${title}`,
    title,
    description: desc,
    time: isNaN(d.getTime())
      ? "--:--"
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    date: isNaN(d.getTime())
      ? "Recent"
      : d.toLocaleDateString([], { month: "short", day: "numeric" }),
    iconName,
    iconColor,
    dotBg,
  };
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
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
