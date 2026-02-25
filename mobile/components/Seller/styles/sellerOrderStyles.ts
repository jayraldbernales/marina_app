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
    flexShrink: 0,
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
    shadowOffset: { width: 0, height: 1 },
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

  // ─── Rider (card list) ─────────────────────────────────────────────────────
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    padding: 12,
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
    color: "#111",
  },
  riderStatus: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginTop: 2,
  },
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

  // ─── Modal body padding wrapper ────────────────────────────────────────────
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ─── Section labels ────────────────────────────────────────────────────────
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

  // ─── Order meta card ───────────────────────────────────────────────────────
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

  // ─── Customer info card ────────────────────────────────────────────────────
  modalCustomerCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modalCustomerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalCustomerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalCustomerNameBlock: {
    flex: 1,
  },
  modalCustomerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  modalCustomerRole: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  modalCustomerDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 10,
  },
  modalCustomerAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  modalCustomerAddressIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  modalAddress: {
    fontSize: 13,
    color: "#666",
    flex: 1,
    lineHeight: 19,
  },

  // ─── Payment info card ─────────────────────────────────────────────────────
  modalPaymentCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modalPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalPaymentLabel: {
    fontSize: 13,
    color: "#888",
  },
  modalPaymentValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  modalPaymentDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 10,
  },

  // ─── GCash reference ───────────────────────────────────────────────────────
  gcashDetails: {
    marginTop: 4,
  },
  gcashReference: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.light.primary,
    letterSpacing: 0.5,
  },

  // ─── View Proof Button ─────────────────────────────────────────────────────
  // Used for both payment proof and delivery proof photos
  proofRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  proofRowLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  viewProofButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewProofButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.light.primary,
  },

  // ─── Verification actions ──────────────────────────────────────────────────
  verificationActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  verifyButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#10b981",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // ─── Rider info card ───────────────────────────────────────────────────────
  modalRiderCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  // ─── Items ─────────────────────────────────────────────────────────────────
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

  // ─── Price Summary card ────────────────────────────────────────────────────
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

  // ─── Misc ──────────────────────────────────────────────────────────────────
  specialInstructionsBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 12,
  },
  specialInstructionsText: {
    fontSize: 13,
    color: "#555",
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

  // Legacy aliases kept for any existing refs
  proofLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
});
