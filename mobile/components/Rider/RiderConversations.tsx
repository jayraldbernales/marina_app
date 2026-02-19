// app/rider/conversations.tsx - Optimized rider conversations screen
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  AppState,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";
import { chatService, Conversation } from "../../lib/chat";

// Type definitions for UI
interface UIConversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  rawTime: string;
  unreadCount: number;
  avatar?: string | null;
  isOnline: boolean;
  otherPartyId: string;
  otherPartyType: "buyer" | "vendor";
}

const RiderConversationsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [riderName, setRiderName] = useState("");

  // Refs to manage subscriptions
  const conversationsSubscription = useRef<any>(null);
  const messagesSubscription = useRef<any>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
      loadRiderName();
      setupSubscriptions();

      // Listen for app state changes to refresh when app comes to foreground
      const subscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (
            appState.current.match(/inactive|background/) &&
            nextAppState === "active"
          ) {
            // App has come to the foreground, refresh conversations
            loadConversations();
          }
          appState.current = nextAppState;
        },
      );

      return () => {
        subscription.remove();
      };
    }
  }, [currentUserId]);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (currentUserId) {
        loadConversations();
      }
    }, [currentUserId]),
  );

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadRiderName = async () => {
    if (!currentUserId) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", currentUserId)
      .single();

    if (data) {
      setRiderName(data.full_name || "Rider");
    }
  };

  const loadConversations = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      // Use the optimized rider-specific query
      const { data, error } =
        await chatService.getRiderConversations(currentUserId);

      if (error) {
        console.error("Error loading conversations:", error);
      } else {
        // Data is already filtered for rider conversations and sorted by last_message_time
        const uiConversations = formatConversations(data || []);
        setConversations(uiConversations);
      }
    } catch (error) {
      console.error("Error in loadConversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatConversations = (convos: Conversation[]): UIConversation[] => {
    // No need for Promise.all or await since we're not fetching avatars separately
    const formattedConvos = convos.map((conv) => {
      // Since we're using getRiderConversations, current user is always the rider
      let otherPartyName = "";
      let otherPartyId = "";
      let otherPartyType: "buyer" | "vendor" = "buyer";
      let unreadCount = 0;
      let avatar: string | null | undefined = undefined;

      // Current user is rider, show buyer or vendor
      if (conv.buyer_id) {
        otherPartyName = conv.buyer?.full_name || "Buyer";
        otherPartyId = conv.buyer_id;
        otherPartyType = "buyer";
        unreadCount = conv.rider_unread_count || 0;
        // Use avatar from joined data - NO EXTRA FETCH
        avatar = conv.buyer?.avatar_url;
      } else if (conv.vendor_id) {
        otherPartyName = conv.vendor?.shop_name || "Vendor";
        otherPartyId = conv.vendor_id;
        otherPartyType = "vendor";
        unreadCount = conv.rider_unread_count || 0;
        // Use avatar from joined data - NO EXTRA FETCH
        avatar = conv.vendor?.avatar_url;
      }

      const rawTime = conv.last_message_time || "";
      const timestamp = formatTimestamp(rawTime);

      // Check if last message was from me
      const isLastMessageFromMe = conv.last_message_sender_id === currentUserId;
      const lastMessageDisplay = isLastMessageFromMe
        ? `You: ${conv.last_message || ""}`
        : conv.last_message || "No messages yet";

      return {
        id: conv.id,
        name: otherPartyName,
        lastMessage: lastMessageDisplay,
        timestamp,
        rawTime,
        unreadCount,
        avatar,
        isOnline: false,
        otherPartyId,
        otherPartyType,
      };
    });

    // No need to sort - data already comes sorted from the database query
    return formattedConvos;
  };

  // DELETE these functions entirely:
  // - fetchBuyerAvatar()
  // - fetchVendorAvatar()

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const setupSubscriptions = () => {
    if (!currentUserId) return;

    // Clean up existing subscriptions
    if (conversationsSubscription.current) {
      conversationsSubscription.current.unsubscribe();
    }
    if (messagesSubscription.current) {
      messagesSubscription.current.unsubscribe();
    }

    // Subscribe to conversations table changes - only where user is rider
    conversationsSubscription.current = supabase
      .channel("rider-conversations-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `rider_id=eq.${currentUserId}`, // Only listen to conversations where user is rider
        },
        (payload) => {
          console.log("Rider conversation updated:", payload);
          // Small delay to ensure any related message updates are processed
          setTimeout(() => {
            loadConversations();
          }, 100);
        },
      )
      .subscribe();

    // Also subscribe to messages table for more immediate updates
    // First, get all conversation IDs where user is rider
    supabase
      .from("conversations")
      .select("id")
      .eq("rider_id", currentUserId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const conversationIds = data.map((c) => c.id);

          messagesSubscription.current = supabase
            .channel("rider-messages-channel")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `conversation_id=in.(${conversationIds.join(",")})`,
              },
              (payload) => {
                console.log("New message for rider:", payload);
                // Immediately refresh conversations when a new message is sent
                loadConversations();
              },
            )
            .subscribe();
        }
      });
  };

  // Clean up subscriptions on unmount
  useEffect(() => {
    return () => {
      if (conversationsSubscription.current) {
        conversationsSubscription.current.unsubscribe();
      }
      if (messagesSubscription.current) {
        messagesSubscription.current.unsubscribe();
      }
    };
  }, []);

  const handleConversationPress = (conversation: UIConversation) => {
    router.push({
      pathname: "../buyer/chat",
      params: {
        conversationId: conversation.id,
        otherPartyName: conversation.name,
        otherPartyId: conversation.otherPartyId,
        otherPartyType: conversation.otherPartyType,
        otherPartyAvatar: conversation.avatar,
      },
    });
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderConversation = ({ item }: { item: UIConversation }) => {
    // Determine icon based on party type (used as fallback when no avatar)
    const getIconName = () => {
      switch (item.otherPartyType) {
        case "buyer":
          return "person";
        case "vendor":
          return "storefront";
        default:
          return "person";
      }
    };

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        activeOpacity={0.7}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarWrapper}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.conversationAvatarImage}
            />
          ) : (
            <View style={styles.conversationAvatarPlaceholder}>
              <Ionicons
                name={getIconName()}
                size={24}
                color={COLORS.light.primary}
              />
            </View>
          )}
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.conversationTime}>{item.timestamp}</Text>
          </View>
          <View style={styles.conversationFooter}>
            <Text
              style={[
                styles.conversationMessage,
                item.unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 32 }} />
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
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.light.primary]}
              tintColor={COLORS.light.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No conversations found</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery
              ? "Try a different search term"
              : "Start a conversation with a buyer or vendor"}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default RiderConversationsScreen;

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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  headerButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.common.white,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  conversationsList: {
    paddingBottom: 16,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  conversationAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  conversationAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e0f2ed",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: COLORS.common.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conversationMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  unreadMessage: {
    color: "#333",
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: COLORS.common.white,
    fontSize: 11,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
