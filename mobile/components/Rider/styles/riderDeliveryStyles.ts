import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants";

export const RiderDeliveryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    padding: 16,
    borderBottomWidth: 0,
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
    backgroundColor: COLORS.common.white,
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
    borderRadius: 20,
    backgroundColor: "transparent",
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
    padding: 16,
    marginBottom: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
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
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginTop: 4,
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
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 4,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginBottom: 2,
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
    marginTop: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.common.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "transparent",
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
  moreItemsText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 8,
  },
  // Price summary styles
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

  // ─── Modal Shell ───────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#f8f9fb",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 0,
    maxHeight: "92%",
  },

  // ─── Modal Header ──────────────────────────────────────────────────────────
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.common.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Scrollable modal body padding ────────────────────────────────────────
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ─── Section label (small ALL-CAPS) ───────────────────────────────────────
  modalSection: {
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  // ─── Order meta pill row ───────────────────────────────────────────────────
  modalOrderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modalOrderLabel: {
    fontSize: 11,
    color: "#aaa",
    marginBottom: 3,
    fontWeight: "500",
  },
  modalOrderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.2,
  },
  modalOrderDate: {
    fontSize: 13,
    color: "#555",
  },

  // ─── Contact Cards (Customer & Vendor) ────────────────────────────────────
  // The card itself
  modalContactCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  // Top row: avatar icon + name block
  modalContactTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalContactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalContactAvatarVendor: {
    backgroundColor: "#fff7ed",
  },
  modalContactNameBlock: {
    flex: 1,
  },
  modalContactName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  modalContactRole: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  // Divider between name and details
  modalContactDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 10,
  },
  // Phone row
  modalContactPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalContactPhoneIcon: {
    marginRight: 8,
  },
  modalContactPhone: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    fontWeight: "500",
  },
  // Address row
  modalContactAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  modalContactAddressIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  modalContactAddress: {
    fontSize: 13,
    color: "#666",
    flex: 1,
    lineHeight: 19,
  },
  // Call button inside the card
  modalCallButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.primary,
    padding: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 5,
  },
  modalCallButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  // ─── Legacy aliases kept for backward compat ──────────────────────────────
  modalCustomerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  modalAddress: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },
  modalVendorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  // ─── Items list ───────────────────────────────────────────────────────────
  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  modalItemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  modalItemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 3,
  },
  modalItemVendor: {
    fontSize: 12,
    color: "#aaa",
  },
  modalItemPrice: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modalItemPriceText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.light.primary,
  },
  modalItemQuantity: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 2,
  },

  // ─── Price Summary ─────────────────────────────────────────────────────────
  modalPriceSummaryCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalPriceLabel: {
    fontSize: 14,
    color: "#888",
  },
  modalPriceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  modalTotalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.light.primary,
    letterSpacing: -0.5,
  },

  // ─── Proof styles ──────────────────────────────────────────────────────────
  proofSection: {
    marginBottom: 12,
  },
  proofLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  proofImageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
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
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  proofOverlayText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },

  // ─── Utility styles ────────────────────────────────────────────────────────
  riderDistance: {
    fontSize: 11,
    color: "#10b981",
    marginTop: 2,
  },
  riderVehicle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f59e0b",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#fff3e0",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  dispatchStatus: {
    fontSize: 13,
    color: "#f97316",
    marginTop: 4,
    fontWeight: "500",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  contactNumber: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  callButton: {
    backgroundColor: COLORS.light.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  // Add to RiderDeliveryStyles

  receiptHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.light.primary,
    marginTop: 8,
  },
  receiptNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  receiptSection: {
    marginBottom: 16,
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  receiptCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  receiptLabel: {
    fontSize: 13,
    color: "#666",
    width: 80,
  },
  receiptValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  receiptCustomerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  receiptVendorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f97316",
    marginBottom: 8,
  },
  receiptAddress: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  receiptPhone: {
    fontSize: 13,
    color: COLORS.light.primary,
    flex: 1,
  },
  receiptItemsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  receiptItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  receiptItemInfo: {
    flex: 2,
  },
  receiptItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  receiptItemVendor: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  receiptItemQuantity: {
    width: 50,
    alignItems: "center",
  },
  receiptItemQtyText: {
    fontSize: 13,
    color: "#666",
  },
  receiptItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    width: 80,
    textAlign: "right",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
  receiptSummaryCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  receiptSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  receiptSummaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  receiptSummaryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  receiptTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  receiptTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.light.primary,
  },
  receiptStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  receiptStatusInfo: {
    flex: 1,
  },
  receiptStatusLabel: {
    fontSize: 12,
    color: "#2e7d32",
  },
  receiptStatusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
  },
  receiptProofContainer: {
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  receiptProofImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
  },
  receiptProofOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  receiptProofText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  receiptFooter: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  receiptFooterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  receiptFooterSmall: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    marginBottom: 12,
  },
});
