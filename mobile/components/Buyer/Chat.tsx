// app/chat.tsx - Fixed with proper party type display
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";
import { chatService } from "../../lib/chat";

// Type definitions
interface Message {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: string;
}

// Helper function to get party type display name
const getPartyTypeDisplay = (type: string): string => {
  switch (type) {
    case "vendor":
      return "Vendor";
    case "buyer":
      return "Buyer";
    case "rider":
      return "Rider";
    default:
      return "User";
  }
};

// Helper function to get party icon
const getPartyIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case "vendor":
      return "storefront";
    case "buyer":
      return "person";
    case "rider":
      return "bicycle";
    default:
      return "person";
  }
};

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const conversationId = params.conversationId as string;
  const otherPartyName = params.otherPartyName as string;
  const otherPartyId = params.otherPartyId as string;
  const otherPartyType = params.otherPartyType as string;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && conversationId) {
      loadMessages();

      // Set up subscription
      const subscription = setupSubscription();

      // Cleanup subscription on unmount
      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    }
  }, [currentUserId, conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when keyboard appears
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await chatService.getMessages(conversationId);

    if (error) {
      console.error("Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } else {
      // Convert database messages to your UI format with proper typing
      const formattedMessages: Message[] = (data || []).map((msg) => ({
        id: msg.id,
        text: msg.message,
        sender: (msg.sender_id === currentUserId ? "user" : "other") as
          | "user"
          | "other",
        timestamp: new Date(msg.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      }));
      setMessages(formattedMessages);

      // Mark messages as read
      if (currentUserId) {
        await chatService.markMessagesAsRead(conversationId, currentUserId);
      }
    }
    setLoading(false);
  };

  // Separate function to set up subscription
  const setupSubscription = () => {
    return chatService.subscribeToMessages(conversationId, (newMessage) => {
      console.log("Processing new message in component:", newMessage);

      // Check if message already exists to avoid duplicates
      setMessages((prevMessages) => {
        // Don't add if we already have this message
        if (prevMessages.some((msg) => msg.id === newMessage.id)) {
          return prevMessages;
        }

        // Convert to UI format
        const formattedMessage: Message = {
          id: newMessage.id,
          text: newMessage.message,
          sender: (newMessage.sender_id === currentUserId
            ? "user"
            : "other") as "user" | "other",
          timestamp: new Date(newMessage.created_at).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
            },
          ),
        };

        return [...prevMessages, formattedMessage];
      });

      // Mark as read if we're the receiver
      if (currentUserId && newMessage.sender_id !== currentUserId) {
        chatService.markMessagesAsRead(conversationId, currentUserId);
      }
    });
  };

  const handleSend = async () => {
    if (!message.trim() || !currentUserId || sending) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      text: message.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setSending(true);

    const { data, error } = await chatService.sendMessage(
      conversationId,
      currentUserId,
      newMessage.text,
    );

    if (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
      // Optionally remove the optimistic message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }

    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons
                name={getPartyIcon(otherPartyType)}
                size={16}
                color={COLORS.light.primary}
              />
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.otherTimestamp,
            ]}
          >
            {item.timestamp}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatarContainer}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={16} color={COLORS.light.primary} />
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Ionicons
                name={getPartyIcon(otherPartyType)}
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{otherPartyName}</Text>
              <Text style={styles.headerSubtitle}>
                {getPartyTypeDisplay(otherPartyType)}
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Ionicons
              name={getPartyIcon(otherPartyType)}
              size={20}
              color={COLORS.light.primary}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{otherPartyName}</Text>
            <Text style={styles.headerSubtitle}>
              {getPartyTypeDisplay(otherPartyType)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={COLORS.light.primary}
          />
        </TouchableOpacity>
      </View>

      {/* KeyboardAvoidingView wraps the content that needs to move */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Ionicons
              name="add-circle"
              size={28}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!sending}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() && !sending ? COLORS.common.white : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0f2ed",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.light.primary,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
  },
  userAvatarContainer: {
    marginLeft: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.common.white,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "70%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: COLORS.light.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.common.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.common.white,
  },
  otherMessageText: {
    color: "#333",
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  otherTimestamp: {
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.common.white,
    borderTopWidth: 1,
    borderTopColor: "#e0f2ed",
  },
  attachButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 14,
    color: "#333",
    minHeight: 36,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#e5e5e5",
  },
});
