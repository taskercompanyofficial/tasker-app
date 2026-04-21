import Colors from "@/constants/Colors";
import { Spacing, BorderRadius, Typography } from "@/constants/Styles";
import { WORK_ORDER_URL } from "@/lib/api-endpoints";
import myAxios from "@/lib/axios.config";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderNumber: string;
}

export default function ReviewModal({
  visible,
  onClose,
  onSuccess,
  orderNumber,
}: ReviewModalProps) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({ type: "error", text1: "Please select a rating" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await myAxios.post(
        `${WORK_ORDER_URL}/${orderNumber}/review`,
        {
          rating,
          comment: comment.trim() || null,
        }
      );
      if (res.data.status === "success") {
        Toast.show({
          type: "success",
          text1: "Thank you!",
          text2: "Your feedback has been submitted.",
        });
        onSuccess();
        setRating(0);
        setComment("");
        onClose();
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to submit review.";
      Toast.show({ type: "error", text1: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const starLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Illustration */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={Colors.success}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Job Completed! 🎉</Text>
          <Text style={styles.subtitle}>
            Your job has been completed. Please rate our service.
          </Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color={star <= rating ? "#FBBF24" : Colors.neutral.gray[300]}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{starLabels[rating]}</Text>
          )}

          {/* Comment */}
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience (optional)"
            placeholderTextColor={Colors.text.tertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.neutral.white} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>

          {/* Skip */}
          <TouchableOpacity onPress={onClose} style={styles.skipButton}>
            <Text style={styles.skipText}>Maybe Later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.neutral.gray[300],
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  starsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
    color: Colors.themes.customer.primary,
    marginBottom: Spacing.md,
  },
  commentInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    backgroundColor: Colors.neutral.gray[50],
    minHeight: 80,
    marginBottom: Spacing.md,
  },
  submitButton: {
    width: "100%",
    backgroundColor: Colors.themes.customer.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
    color: Colors.neutral.white,
  },
  skipButton: {
    paddingVertical: Spacing.md,
  },
  skipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
});
