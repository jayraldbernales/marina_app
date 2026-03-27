// components/SimpleReportModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/constants";

type ReportType = "buyer" | "seller" | "rider" | "order";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportType: ReportType;
  targetId: string;
  targetName: string;
  reporterId: string;
  orderId?: string;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = {
  buyer: [
    "Non-payment / Refuses to pay",
    "False claims about products",
    "Abusive or harassing behavior",
    "Scam attempt",
    "Fake cancellation",
    "Other",
  ],
  seller: [
    "Spoiled/Expired goods",
    "Wrong items delivered",
    "Missing items",
    "Poor quality products",
    "Delivery issues",
    "Unresponsive seller",
    "Overpricing",
    "Other",
  ],
  rider: [
    "Rude or unprofessional",
    "Damaged items during delivery",
    "Excessive delay",
    "Delivered to wrong address",
    "No-show/Accepted but didn't deliver",
    "Suspected theft",
    "Other",
  ],
  order: [
    "Order not received",
    "Payment issue",
    "System/Technical error",
    "Other",
  ],
};

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  reportType,
  targetId,
  targetName,
  reporterId,
  orderId,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = REPORT_REASONS[reportType];

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        report_type: reportType,
        reported_user_id: reportType !== "order" ? targetId : null,
        reported_by_user_id: reporterId,
        reason: selectedReason,
        description: description.trim() || null,
        order_id: orderId || null,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      Alert.alert(
        "Report Submitted",
        "Thank you for your report. Our team will review it.",
        [
          {
            text: "OK",
            onPress: () => {
              onClose();
              onReportSubmitted?.();
            },
          },
        ],
      );
    } catch (error: any) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", error.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}
            >
              Report{" "}
              {reportType === "buyer"
                ? "Buyer"
                : reportType === "seller"
                  ? "Seller"
                  : reportType === "rider"
                    ? "Rider"
                    : "Issue"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Target Info */}
            <View
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>
                Reporting:
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#1f2937" }}
              >
                {targetName}
              </Text>
              {orderId && (
                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Order #{orderId.slice(0, 8)}...
                </Text>
              )}
            </View>

            {/* Reason Selection */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 12,
                color: "#1f2937",
              }}
            >
              Why are you reporting?
            </Text>

            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor:
                    selectedReason === reason
                      ? `${COLORS.light.primary}10`
                      : "#fff",
                  borderRadius: 10,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor:
                    selectedReason === reason
                      ? COLORS.light.primary
                      : "#e5e7eb",
                }}
                onPress={() => setSelectedReason(reason)}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={selectedReason === reason ? "#fff" : "#6b7280"}
                />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 14,
                    color: selectedReason === reason ? "#fff" : "#374151",
                    fontWeight: selectedReason === reason ? "500" : "400",
                  }}
                >
                  {reason}
                </Text>
                {selectedReason === reason && (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}

            {/* Description */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginTop: 20,
                marginBottom: 12,
                color: "#1f2937",
              }}
            >
              Description (Optional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                padding: 12,
                minHeight: 100,
                textAlignVertical: "top",
                fontSize: 14,
              }}
              placeholder="Please provide more details..."
              multiline
              value={description}
              onChangeText={setDescription}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={{
                backgroundColor: selectedReason
                  ? COLORS.light.primary
                  : "#9ca3af",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 20,
                marginBottom: 30,
              }}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                >
                  Submit Report
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
