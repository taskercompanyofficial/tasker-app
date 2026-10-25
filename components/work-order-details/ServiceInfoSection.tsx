import AppText from "@/components/common/AppText";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { fieldStyles, sectionStyles } from "./styles";

interface ServiceInfoSectionProps {
  product?: { name: string };
  category?: { name: string };
  parentService?: { name: string };
  service?: { name: string };
  serviceConcern?: { name: string } | null;
  serviceSubConcern?: { name: string } | null;
  warrantyType?: { name: string } | null;
  isWarrantyCase: boolean;
  warrantyStatus?: string | null;
  subStatus?: { name: string };
  customerDescription?: string;
  reminders?: string | null;
  assignmentMessage?: string | null;
}

export default function ServiceInfoSection({
  product,
  category,
  parentService,
  service,
  serviceConcern,
  serviceSubConcern,
  warrantyType,
  isWarrantyCase,
  warrantyStatus,
  subStatus,
  customerDescription,
  reminders,
  assignmentMessage,
}: ServiceInfoSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={sectionStyles.section}>
      <TouchableOpacity
        style={sectionStyles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <AppText style={sectionStyles.sectionTitle}>Service Info</AppText>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={sectionStyles.sectionContent}>
          {/* Service & Category */}
          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Service</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {parentService?.name || service?.name || "N/A"}
              </AppText>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Category</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {category?.name || "N/A"}
              </AppText>
            </View>
          </View>

          {/* Product & Sub Status */}
          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Product</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {product?.name || "N/A"}
              </AppText>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Current Status</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {subStatus?.name || "N/A"}
              </AppText>
            </View>
          </View>

          {/* Service Concern & Sub Concern */}
          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Service Concern</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {serviceConcern?.name || "N/A"}
              </AppText>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Sub Concern</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {serviceSubConcern?.name || "N/A"}
              </AppText>
            </View>
          </View>

          {/* Warranty Type & Status */}
          <View style={fieldStyles.fieldRow}>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Warranty Type</AppText>
              <View style={styles.badgeRow}>
                <AppText style={fieldStyles.fieldValue}>
                  {warrantyType?.name || "N/A"}
                </AppText>
                {isWarrantyCase && (
                  <View style={styles.warrantyBadge}>
                    <AppText style={styles.warrantyBadgeText}>In Warranty</AppText>
                  </View>
                )}
              </View>
            </View>
            <View style={fieldStyles.fieldHalf}>
              <AppText style={fieldStyles.fieldLabel}>Warranty Status</AppText>
              <AppText style={fieldStyles.fieldValue}>
                {warrantyStatus ||
                  (isWarrantyCase ? "In warranty" : "Out of warranty")}
              </AppText>
            </View>
          </View>

          {/* Customer Description */}
          {customerDescription && (
            <View style={fieldStyles.fieldGroup}>
              <AppText style={fieldStyles.fieldLabel}>Customer Remarks</AppText>
              <AppText style={[fieldStyles.fieldValue, styles.description]}>
                {customerDescription}
              </AppText>
            </View>
          )}
          {/* Assignment Message */}
          {assignmentMessage && (
            <View style={[fieldStyles.fieldGroup, styles.messageBox]}>
              <AppText style={fieldStyles.fieldLabel}>Assignment Message</AppText>
              <AppText style={[fieldStyles.fieldValue, styles.description]}>
                {assignmentMessage}
              </AppText>
            </View>
          )}
          {/* Reminders Section */}
          {(() => {
            if (!reminders) return null;
            let reminderItems = [];
            try {
              const parsed = JSON.parse(reminders);
              reminderItems = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              reminderItems = [{ message: reminders }];
            }

            if (reminderItems.length === 0) return null;

            return (
              <View style={[fieldStyles.fieldGroup, styles.reminderBox]}>
                <View style={styles.reminderHeader}>
                  <Ionicons name="notifications" size={14} color="#D97706" />
                  <AppText style={styles.reminderLabel}>Reminders</AppText>
                </View>
                <View style={styles.reminderList}>
                  {reminderItems.map((item, index) => (
                    <View key={index} style={styles.reminderCard}>
                      <View style={styles.reminderDot} />
                      <View style={styles.reminderContent}>
                        {item.remark || item.message || item.notes ? (
                          <AppText style={styles.reminderMessage}>
                            {item.remark || item.message || item.notes}
                          </AppText>
                        ) : null}

                        <View style={styles.reminderMeta}>
                          {item.sent_at || item["set at"] || item.set_at ? (
                            <View style={styles.metaItem}>
                              <Ionicons
                                name="time-outline"
                                size={10}
                                color="#9CA3AF"
                              />
                              <AppText style={styles.metaText}>
                                {item.sent_at || item["set at"] || item.set_at}
                              </AppText>
                            </View>
                          ) : null}

                          {item.sent_by_name || item["sent by name"] ? (
                            <View style={styles.metaItem}>
                              <Ionicons
                                name="person-outline"
                                size={10}
                                color="#9CA3AF"
                              />
                              <AppText style={styles.metaText}>
                                By: {item.sent_by_name || item["sent by name"]}
                              </AppText>
                            </View>
                          ) : null}

                          {item.staff_id || item.workorder_staff_id ? (
                            <View style={styles.metaItem}>
                              <Ionicons
                                name="id-card-outline"
                                size={10}
                                color="#9CA3AF"
                              />
                              <AppText style={styles.metaText}>
                                For: {item.staff_name || "Staff"} (ID:{" "}
                                {item.staff_id || item.workorder_staff_id})
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  warrantyBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  warrantyBadgeText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#059669",
  },
  description: {
    lineHeight: 16,
  },
  messageBox: {
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  reminderBox: {
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    marginTop: 10,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  reminderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
  },
  reminderList: {
    marginTop: 8,
    gap: 8,
  },
  reminderCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D97706",
    marginTop: 6,
    marginRight: 8,
  },
  reminderContent: {
    flex: 1,
  },
  reminderMessage: {
    fontSize: 12,
    color: "#1F2937",
    fontWeight: "500",
    marginBottom: 6,
    lineHeight: 16,
  },
  reminderMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: "#6B7280",
  },
});
