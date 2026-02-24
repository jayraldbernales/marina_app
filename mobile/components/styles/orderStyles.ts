import { StyleSheet } from "react-native";
import { COLORS } from "../../constants";

export const orderStyles = StyleSheet.create({
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
    shadowColor: COLORS.light.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
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
    paddingTop: 160,
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
    marginBottom: 16,
    color: COLORS.light.oceanMedium,
    textAlign: "center",
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
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
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

  // ─── Search ────────────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  searchResultInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchResultText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },

  // ─── Modal Shell ───────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#f8fbf9",
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

  // ─── Modal body padding ────────────────────────────────────────────────────
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

  // ─── Address card ──────────────────────────────────────────────────────────
  modalAddressCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  modalAddressIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  modalAddress: {
    fontSize: 13,
    color: "#555",
    flex: 1,
    lineHeight: 19,
  },

  // ─── Special instructions ──────────────────────────────────────────────────
  specialInstructionsBox: {
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    padding: 14,
  },
  specialInstructionsText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },

  // ─── Payment card ──────────────────────────────────────────────────────────
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
  gcashProofSection: {
    marginTop: 4,
  },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  referenceLabel: {
    fontSize: 13,
    color: "#888",
    flex: 1,
  },
  referenceValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.light.primary,
    letterSpacing: 0.5,
  },

  // ─── View Proof Button ─────────────────────────────────────────────────────
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

  // ─── Rider card ────────────────────────────────────────────────────────────
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    borderRadius: 14,
    padding: 14,
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  riderStatus: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    textTransform: "capitalize",
  },
  riderVehicle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
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
    marginBottom: 2,
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

  // ─── Legacy aliases (kept for existing refs) ───────────────────────────────
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

  // ─── Rating Modal ──────────────────────────────────────────────────────────
  ratingModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
    width: "100%",
  },
  ratingOrderInfo: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ratingOrderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  ratingOrderDate: {
    fontSize: 14,
    color: "#666",
  },
  productsSummary: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  productsSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  productItem: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
    paddingLeft: 8,
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingHeader: {
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  ratingDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  ratingHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
    marginTop: 4,
  },
  ratingDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  ratingCommentContainer: {
    marginBottom: 24,
  },
  ratingCommentInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 100,
    textAlignVertical: "top",
    marginTop: 8,
  },
  ratingActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  ratingDeleteButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  ratingDeleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  ratingSubmitButton: {
    backgroundColor: COLORS.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  ratingSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  ratingNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  reviewStatusContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  reviewStatusText: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
  },
  updateReviewButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  updateReviewButtonText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "500",
  },
  rateOrderButton: {
    backgroundColor: COLORS.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  rateOrderButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  productsContainer: {
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  productItemCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  productMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productQuantity: {
    fontSize: 13,
    color: "#666",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  productVendor: {
    fontSize: 12,
    color: "#999",
  },
  productRatingSection: {
    alignItems: "center",
  },
  productRatingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  productStarsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  productRatingHint: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  serviceRatingsContainer: {
    marginBottom: 16,
  },
  serviceRatingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  inlineRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 4,
  },
  inlineRatingLabel: {
    fontSize: 15,
    color: "#4B5563",
    flex: 1,
  },
  inlineStarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineStar: {
    marginHorizontal: 2,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  }, // Add these to your orderStyles
  productRatingContainer: {
    marginBottom: 16,
  },
  productRatingStars: {
    marginTop: 12,
    marginBottom: 8,
  },

  starIcon: {
    marginRight: 8,
  },

  productCommentContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
});
