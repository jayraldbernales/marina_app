import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  AppState,
  ImageSourcePropType,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { COLORS } from "../constants";
import { supabase } from "../lib/supabase";
import { chatService, Message, ConversationWithDetails } from "../lib/chat";
import { RealtimeChannel } from "@supabase/supabase-js";
import { chatStyles } from "./Buyer/styles/chat.styles";

// Constants
const DEFAULT_AVATAR = require("../assets/img/user.jpg");

// Utility function for avatar source with caching
const getAvatarSource = (uri?: string | null): ImageSourcePropType => {
  if (!uri) return DEFAULT_AVATAR;
  return {
    uri,
    cache: "force-cache",
    headers: {
      "Cache-Control": "max-age=86400",
    },
  };
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const vendorUserId = params?.vendor_user_id as string;
  const vendorName = params?.vendor_name as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    [],
  );
  const [inputText, setInputText] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const messageChannel = useRef<RealtimeChannel | null>(null);
  const conversationChannel = useRef<RealtimeChannel | null>(null);

  // ==================== AUTHENTICATION ====================
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  // ==================== CONVERSATIONS LIST ====================
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== INDIVIDUAL CHAT ====================
  const initializeConversation = useCallback(async () => {
    if (!vendorUserId || !currentUserId) return;

    try {
      setIsLoading(true);

      // Get or create conversation
      const conversationId =
        await chatService.getOrCreateConversation(vendorUserId);
      setCurrentConversationId(conversationId);

      // Load messages
      const messagesData = await chatService.getMessages(conversationId);
      setMessages(messagesData);

      // Mark messages as read
      await chatService.markMessagesAsRead(conversationId);

      // Get other user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, vendor_profiles(*)")
        .eq("user_id", vendorUserId)
        .single();

      setOtherUserProfile(profile);
    } catch (error) {
      console.error("Error initializing conversation:", error);
      Alert.alert("Error", "Failed to load chat");
    } finally {
      setIsLoading(false);
    }
  }, [vendorUserId, currentUserId]);

  // ==================== SUBSCRIPTIONS ====================
  useEffect(() => {
    if (currentConversationId) {
      // Subscribe to new messages
      messageChannel.current = chatService.subscribeToMessages(
        currentConversationId,
        (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
          // Mark as read if it's from someone else
          if (newMessage.sender_id !== currentUserId) {
            chatService.markMessagesAsRead(currentConversationId);
          }
        },
      );

      return () => {
        if (messageChannel.current) {
          chatService.unsubscribe(messageChannel.current);
        }
      };
    }
  }, [currentConversationId, currentUserId]);

  // Subscribe to new conversations when on the list screen
  useEffect(() => {
    if (!vendorUserId) {
      conversationChannel.current = chatService.subscribeToNewConversations(
        () => {
          loadConversations();
        },
      );

      return () => {
        if (conversationChannel.current) {
          chatService.unsubscribe(conversationChannel.current);
        }
      };
    }
  }, [vendorUserId]);

  // Load conversations when on list screen
  useEffect(() => {
    if (!vendorUserId && currentUserId) {
      loadConversations();
    }
  }, [vendorUserId, currentUserId]);

  // Initialize conversation when on chat screen
  useEffect(() => {
    if (vendorUserId && currentUserId) {
      initializeConversation();
    }
  }, [vendorUserId, currentUserId, initializeConversation]);

  // Mark messages as read when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentConversationId && currentUserId) {
        chatService.markMessagesAsRead(currentConversationId);
      }
    }, [currentConversationId, currentUserId]),
  );

  // Mark messages as read when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && currentConversationId && currentUserId) {
        chatService.markMessagesAsRead(currentConversationId);
      }
    });

    return () => subscription.remove();
  }, [currentConversationId, currentUserId]);

  // ==================== ACTIONS ====================
  const handleSend = async () => {
    if (!inputText.trim() || !currentConversationId || isSending) return;

    try {
      setIsSending(true);
      const message = await chatService.sendMessage(
        currentConversationId,
        inputText.trim(),
      );
      setMessages((prev) => [...prev, message]);
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // ==================== RENDERERS ====================
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleImageError = useCallback((event: any) => {
    // Force fallback to default avatar on error
    event.currentTarget.source = DEFAULT_AVATAR;
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === currentUserId;

    return (
      <View
        style={[
          chatStyles.messageContainer,
          isOwnMessage
            ? chatStyles.ownMessageContainer
            : chatStyles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <Image
            source={getAvatarSource(
              item.sender?.avatar_url ||
                otherUserProfile?.vendor_profiles?.[0]?.avatar_url,
            )}
            style={chatStyles.messageAvatar}
            onError={handleImageError}
          />
        )}

        <View
          style={[
            chatStyles.messageBubble,
            isOwnMessage
              ? chatStyles.ownMessageBubble
              : chatStyles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              chatStyles.messageText,
              isOwnMessage
                ? chatStyles.ownMessageText
                : chatStyles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>

          <View style={chatStyles.messageFooter}>
            <Text
              style={[
                chatStyles.messageTime,
                isOwnMessage
                  ? chatStyles.ownMessageTime
                  : chatStyles.otherMessageTime,
              ]}
            >
              {formatTime(item.created_at)}
            </Text>
            {isOwnMessage && (
              <Ionicons
                name={item.is_read ? "checkmark-done" : "checkmark"}
                size={14}
                color={item.is_read ? COLORS.light.primary : "#9e9e9e"}
                style={chatStyles.messageStatus}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: ConversationWithDetails }) => {
    const lastMessage = item.last_message;
    const otherUser = item.other_participant;
    const vendorName = otherUser?.shop_name || otherUser?.full_name || "Vendor";

    return (
      <TouchableOpacity
        style={chatStyles.conversationItem}
        onPress={() =>
          router.push({
            pathname: "/buyer/chat",
            params: {
              vendor_user_id: otherUser?.user_id,
              vendor_name: vendorName,
            },
          })
        }
      >
        <View style={chatStyles.conversationAvatarContainer}>
          <Image
            source={getAvatarSource(otherUser?.avatar_url)}
            style={chatStyles.conversationAvatar}
            onError={handleImageError}
          />
          {otherUser?.is_online && <View style={chatStyles.onlineIndicator} />}
        </View>

        <View style={chatStyles.conversationInfo}>
          <View style={chatStyles.conversationHeader}>
            <Text style={chatStyles.conversationName}>{vendorName}</Text>
            <Text style={chatStyles.conversationTime}>
              {lastMessage ? formatTime(lastMessage.created_at) : ""}
            </Text>
          </View>

          <View style={chatStyles.conversationFooter}>
            <Text style={chatStyles.conversationLastMessage} numberOfLines={1}>
              {lastMessage?.content || "Start a conversation"}
            </Text>
            {item.unread_count > 0 && (
              <View style={chatStyles.unreadBadge}>
                <Text style={chatStyles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ==================== RENDER ====================
  // If we're in a specific chat (vendor_user_id is provided)
  if (vendorUserId) {
    if (isLoading) {
      return (
        <SafeAreaView style={chatStyles.container}>
          <View style={chatStyles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.light.primary} />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={chatStyles.container}>
        <KeyboardAvoidingView
          style={chatStyles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Chat Header */}
          <View style={chatStyles.chatHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={chatStyles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={chatStyles.chatHeaderInfo}
              onPress={() => {
                // Navigate to vendor profile
                router.push({
                  pathname: "/buyer/view-vendor",
                  params: { vendor_user_id: vendorUserId },
                });
              }}
            >
              <View style={chatStyles.vendorAvatarContainer}>
                <Image
                  source={getAvatarSource(
                    otherUserProfile?.vendor_profiles?.[0]?.avatar_url ||
                      otherUserProfile?.avatar_url,
                  )}
                  style={chatStyles.chatHeaderAvatar}
                  onError={handleImageError}
                />
                <View style={chatStyles.onlineIndicatorSmall} />
              </View>
              <View style={chatStyles.chatHeaderText}>
                <Text style={chatStyles.chatHeaderName}>
                  {otherUserProfile?.vendor_profiles?.[0]?.shop_name ||
                    otherUserProfile?.full_name ||
                    vendorName ||
                    "Vendor"}
                </Text>
                <Text style={chatStyles.chatHeaderStatus}>Online</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={chatStyles.headerAction}>
              <Ionicons
                name="call-outline"
                size={22}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Messages List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.message_id}
            contentContainerStyle={chatStyles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />

          {/* Input Area */}
          <View style={chatStyles.inputContainer}>
            <TouchableOpacity style={chatStyles.attachButton}>
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>

            <View style={chatStyles.textInputWrapper}>
              <TextInput
                style={chatStyles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isSending}
              />
              <TouchableOpacity
                style={[
                  chatStyles.sendButton,
                  (!inputText.trim() || isSending) &&
                    chatStyles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={inputText.trim() ? "#fff" : "#9ca3af"}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Otherwise, show conversations list
  return (
    <SafeAreaView style={chatStyles.container}>
      <View style={chatStyles.mainContent}>
        {/* Header */}
        <View style={chatStyles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={chatStyles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={chatStyles.headerTitle}>Messages</Text>
          <TouchableOpacity style={chatStyles.headerAction}>
            <Ionicons name="search" size={24} color={COLORS.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Conversations List */}
        {isLoading ? (
          <View style={chatStyles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.light.primary} />
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.conversation_id}
            contentContainerStyle={chatStyles.conversationsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={chatStyles.emptyState}>
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={64}
                  color="#cbd5e1"
                />
                <Text style={chatStyles.emptyStateTitle}>
                  No conversations yet
                </Text>
                <Text style={chatStyles.emptyStateText}>
                  Start chatting with vendors when you browse products
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
