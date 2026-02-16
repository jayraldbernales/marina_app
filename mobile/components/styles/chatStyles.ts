import { StyleSheet } from "react-native";
import { COLORS } from "../../constants";

export const chatStyles = StyleSheet.create({
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.light.primary,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.common.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  conversationDetails: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: COLORS.light.oceanMedium,
  },
  conversationMeta: {
    alignItems: "flex-end",
  },
  conversationTimestamp: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: COLORS.common.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  messagesContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  messageContainer: {
    alignSelf: "flex-start",
    marginVertical: 4,
    maxWidth: "80%",
  },
  ownMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: "100%",
  },
  ownMessageBubble: {
    backgroundColor: COLORS.light.primary,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.common.gray,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: COLORS.common.white,
  },
  otherMessageText: {
    color: COLORS.light.primary,
  },
  timestamp: {
    color: COLORS.common.gray,
    fontSize: 10,
    opacity: 0.7,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.common.white,
    borderTopWidth: 1,
    borderTopColor: "#cce3de",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  sendButton: {
    backgroundColor: COLORS.light.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.common.gray,
  },
});
