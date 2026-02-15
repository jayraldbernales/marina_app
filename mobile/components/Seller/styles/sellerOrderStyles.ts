import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants";

export const sellerOrderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    paddingTop: 48,
    padding: 16,
    borderBottomWidth: 0, // Removed to match orderStyles
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: COLORS.common.white, // Added to match orderStyles
    maxHeight: 60,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20, // Changed from 12 to match orderStyles
    backgroundColor: "transparent", // Changed to match orderStyles
  },
  activeTab: {
    backgroundColor: COLORS.light.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.light.oceanMedium,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.common.white,
    fontWeight: "bold",
  },
  ordersContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  orderCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 16,
    padding: 16, // Increased from 12
    marginBottom: 12,
    marginTop: 12, // Added to match orderStyles
    shadowColor: "#000", // Added to match orderStyles
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1, // Reduced from 2
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, // Changed from 12 to match orderStyles
  },
  statusText: {
    color: COLORS.common.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  itemVendor: {
    fontSize: 13,
    color: COLORS.light.oceanMedium,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14, // Increased from 13
    fontWeight: "bold", // Added to match orderStyles
    color: COLORS.light.primary,
    marginTop: 4,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0", // Changed from #cce3de
    paddingTop: 12, // Increased from 8
    marginTop: 4, // Changed from 0
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.light.oceanMedium,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  deliveryAddress: {
    fontSize: 13,
    color: COLORS.light.oceanMedium,
    marginBottom: 12,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: COLORS.common.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "transparent", // Changed to match orderStyles
    borderWidth: 1,
    borderColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: COLORS.light.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.light.oceanMedium,
    textAlign: "center",
  },
  // Price summary styles (added to match orderStyles)
  priceSummary: {
    marginBottom: 16,
    paddingTop: 0,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    color: "#333",
  },
  itemContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 12,
  },
  itemLeftColumn: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  itemRightColumn: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 80,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  totalItems: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  // Rider assignment (kept from original seller styles)
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // Updated to match
    marginBottom: 8,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  riderAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  riderAvatarText: {
    color: COLORS.common.white,
    fontWeight: "700",
    fontSize: 16,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.light.primary,
  },
  riderStatus: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginTop: 2,
  },
  riderAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.light.oceanMedium,
  },
  riderActionText: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    fontWeight: "600",
  },
  unassignedRow: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  unassignedText: {
    fontSize: 13,
    color: "#999",
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  leftColumn: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginTop: 2,
  },
  customerName: {
    fontSize: 14,
    color: COLORS.light.primary,
    marginTop: 4,
    fontWeight: "600",
  },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  preOrderBadge: {
    backgroundColor: "#64748b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  preOrderBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  // Add these to your sellerOrderStyles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  modalOrderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalOrderLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  modalOrderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalOrderDate: {
    fontSize: 14,
    color: "#666",
  },
  modalCustomerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  modalAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  modalPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalPaymentLabel: {
    fontSize: 14,
    color: "#666",
  },
  modalPaymentValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  modalItemRow: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  modalItemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  modalItemPrice: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modalItemPriceText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modalItemQuantity: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  modalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalPriceLabel: {
    fontSize: 14,
    color: "#666",
  },
  modalPriceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  modalTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  moreItemsText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 8,
  }, // Add to sellerOrderStyles
  specialInstructionsBox: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    alignItems: "flex-start",
    gap: 8,
  },
  specialInstructionsText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  pendingVerificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3e8ff",
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
    gap: 6,
  },
  pendingVerificationText: {
    fontSize: 12,
    color: COLORS.light.primary,
    fontWeight: "500",
    textAlign: "center",
  },
  gcashDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  gcashReference: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
    flex: 1,
  },
  proofLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  proofImageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  proofImage: {
    width: "100%",
    height: "100%",
  },
  proofOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  proofOverlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  verificationActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  verifyButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
