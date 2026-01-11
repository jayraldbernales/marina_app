import { StyleSheet } from "react-native";
import { COLORS } from "../../constants";

export const notificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    backgroundColor: COLORS.light.primary,
    paddingTop: 64,
    padding: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: COLORS.light.accent,
    fontSize: 14,
  },
  markAllReadButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllReadText: {
    color: "#fff",
    fontSize: 12,
  },
  filterTabsContent: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    height: 40,
    marginTop: 6,
    marginBottom: 6,
    paddingVertical: 10,
    borderRadius: 16,
  },
  filterTabSelected: {
    backgroundColor: "#fff",
  },
  filterTabUnselected: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  filterTabText: {
    fontSize: 14,
  },
  filterTabTextSelected: {
    color: COLORS.light.primary,
    fontWeight: "600",
  },
  filterTabTextUnselected: {
    color: "#fff",
    fontWeight: "400",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    marginTop: 16,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  notificationRead: {
    backgroundColor: "#fff",
  },
  notificationUnread: {
    backgroundColor: COLORS.light.seafoam,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    color: "#999",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.light.coral,
    marginLeft: 8,
  },
});
