import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants";

export const sellerDashboardStyles = StyleSheet.create({
  // Header Styles (matching cart screen)
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    paddingTop: 48,
    padding: 16,
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

  // Welcome Section
  welcomeSection: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: COLORS.light.accent,
    fontSize: 14,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  scrollArea: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginHorizontal: 16,
  },
  seeAllText: {
    color: COLORS.light.accent,
    fontSize: 14,
    fontWeight: "600",
  },

  // Stats Cards
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginLeft: 16,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.common.gray,
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    marginHorizontal: 16,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginTop: 8,
    textAlign: "center",
  },

  // Orders
  ordersCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginHorizontal: 16,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.common.gray,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 12,
    color: COLORS.common.gray,
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 11,
    color: COLORS.common.gray,
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },

  // Stock Alerts
  stockCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginHorizontal: 16,
  },
  stockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.common.gray,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  stockLevel: {
    fontSize: 12,
    color: COLORS.light.coral,
  },
  restockButton: {
    backgroundColor: COLORS.light.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  restockButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});
