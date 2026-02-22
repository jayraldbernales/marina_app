import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants";

export const sellerProductsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  mainContent: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    paddingTop: 48,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cce3de",
  },
  headerBackBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    flex: 1,
  },
  addProductButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addProductButtonText: {
    color: COLORS.common.white,
    fontWeight: "600",
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  activeTab: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  tabText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  activeTabText: {
    color: COLORS.common.white,
    fontWeight: "700",
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  productsGrid: {
    gap: 16,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    flexDirection: "row",
  },
  imageContainer: {
    position: "relative",
    width: 140,
    height: 142,
  },
  productImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f8fafc",
  },
  stockStatusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  productName: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontWeight: "800",
    color: COLORS.light.coral,
    fontSize: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stockContainer: {
    flex: 1,
  },
  productStock: {
    fontSize: 13,
    fontWeight: "600",
  },
  salesText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  statusButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  statusButtonInactive: {
    backgroundColor: "transparent",
    borderColor: "#6b7280",
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusButtonTextActive: {
    color: "#fff",
  },
  statusButtonTextInactive: {
    color: "#6b7280",
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.light.primary,
  },
  viewButtonText: {
    color: COLORS.common.white,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  sold: {
    fontSize: 12,
    color: "#64748b",
  },
  // Add these new styles for horizontal scrolling filters
  horizontalFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  horizontalTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeHorizontalTab: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  horizontalTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.light.oceanMedium,
  },
  activeHorizontalTabText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
