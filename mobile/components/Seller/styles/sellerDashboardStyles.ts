import { StyleSheet } from "react-native";
import { COLORS } from "../../../constants";

export const sellerDashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
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
  headerMessageBtn: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.light.primary,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
  },
  statSubtext: {
    fontSize: 10,
    color: COLORS.light.oceanMedium,
    marginTop: 2,
  },
  orderItem: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  orderCustomer: {
    fontSize: 13,
    color: COLORS.light.oceanMedium,
    marginTop: 2,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    color: COLORS.common.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  orderItemContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderAddress: {
    fontSize: 13,
    color: COLORS.light.oceanMedium,
    marginLeft: 6,
    flex: 1,
  },
  orderItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cce3de",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  orderItems: {
    fontSize: 13,
    color: COLORS.light.oceanMedium,
  },
});
