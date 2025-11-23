import { StyleSheet } from "react-native";
import { COLORS } from "../../constants";

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    backgroundColor: COLORS.light.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#ffffff",
    backgroundColor: "#fff",
  },

  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  scrollArea: {
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  userCard: {
    borderRadius: 16,
    padding: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f7f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.light.oceanMedium,
  },
  logoutButton: {
    backgroundColor: COLORS.light.coral,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginBottom: 10,
  },
});
