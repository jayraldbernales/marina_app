// lib/chat.ts - FULLY FIXED WITH TYPES

import { supabase } from "./supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export type Profile = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

export type Message = {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "product" | "order";
  is_read: boolean;
  created_at: string;
  sender?: Profile;
};

export type Conversation = {
  conversation_id: string;
  created_at: string;
  last_message_at: string | null;
  related_order_id: string | null;
  related_vendor_id: string | null;
  related_rider_id: string | null;
};

export type ConversationParticipant = {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
};

export type ConversationWithDetails = {
  conversation_id: string;
  created_at: string;
  last_message_at: string | null;
  related_order_id: string | null;
  related_vendor_id: string | null;
  related_rider_id: string | null;
  other_participant: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    shop_name?: string;
    is_online?: boolean;
  };
  last_message: Message | null;
  unread_count: number;
};

class ChatService {
  // Get or create a conversation with another user
  async getOrCreateConversation(otherUserId: string): Promise<string> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { data: existingConvo, error: findError } = await supabase.rpc(
        "get_or_create_conversation",
        {
          other_user: otherUserId,
        },
      );

      if (findError) throw findError;
      return existingConvo;
    } catch (error) {
      console.error("Error getting/creating conversation:", error);
      throw error;
    }
  }

  // Get all conversations for current user with details - FIXED RECURSION & TYPES
  async getConversations(): Promise<ConversationWithDetails[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      // STEP 1: Get all conversation IDs the user is in
      const { data: userConversations, error: userConvosError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (userConvosError) throw userConvosError;
      if (!userConversations || userConversations.length === 0) return [];

      const conversationIds = userConversations.map((c) => c.conversation_id);

      // STEP 2: Get conversations data
      const { data: conversations, error: conversationsError } = await supabase
        .from("conversations")
        .select("*")
        .in("conversation_id", conversationIds);

      if (conversationsError) throw conversationsError;
      if (!conversations) return [];

      // STEP 3: Get all participants for these conversations
      const { data: allParticipants, error: participantsError } = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation_id,
          user_id,
          profiles!conversation_participants_user_id_fkey (
            user_id,
            full_name,
            avatar_url,
            role
          )
        `,
        )
        .in("conversation_id", conversationIds);

      if (participantsError) throw participantsError;

      // STEP 4: Get last message for each conversation
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // STEP 5: Get unread counts (without using .group())
      const unreadCounts: Record<string, number> = {};

      for (const convoId of conversationIds) {
        const { count, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convoId)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        if (!countError) {
          unreadCounts[convoId] = count || 0;
        }
      }

      // STEP 6: Get vendor profiles
      const vendorIds =
        allParticipants
          ?.filter((p) => p.profiles?.[0]?.role === "vendor")
          .map((p) => p.user_id) || [];

      let vendorProfiles: any[] = [];
      if (vendorIds.length > 0) {
        const { data: vendors, error: vendorError } = await supabase
          .from("vendor_profiles")
          .select("user_id, shop_name, avatar_url")
          .in("user_id", vendorIds);

        if (!vendorError) vendorProfiles = vendors || [];
      }

      // STEP 7: Create a map of messages by conversation
      const messagesByConversation = new Map<string, Message[]>();
      messages?.forEach((message) => {
        if (!messagesByConversation.has(message.conversation_id)) {
          messagesByConversation.set(message.conversation_id, []);
        }
        messagesByConversation.get(message.conversation_id)!.push(message);
      });

      // STEP 8: Build conversations
      const conversationsWithDetails: ConversationWithDetails[] =
        conversations.map((conv) => {
          const conversationParticipants =
            allParticipants?.filter(
              (cp) => cp.conversation_id === conv.conversation_id,
            ) || [];

          const otherParticipant = conversationParticipants.find(
            (cp) => cp.user_id !== user.id,
          );

          const otherUserProfile = otherParticipant?.profiles?.[0];
          const vendorProfile = vendorProfiles.find(
            (v) => v.user_id === otherParticipant?.user_id,
          );

          const convoMessages =
            messagesByConversation.get(conv.conversation_id) || [];
          const lastMessage = convoMessages[0] || null;

          return {
            conversation_id: conv.conversation_id,
            created_at: conv.created_at,
            last_message_at: conv.last_message_at,
            related_order_id: conv.related_order_id,
            related_vendor_id: conv.related_vendor_id,
            related_rider_id: conv.related_rider_id,
            other_participant: {
              user_id: otherParticipant?.user_id || "",
              full_name: otherUserProfile?.full_name || null,
              avatar_url:
                vendorProfile?.avatar_url ||
                otherUserProfile?.avatar_url ||
                null,
              role: otherUserProfile?.role || "user",
              shop_name: vendorProfile?.shop_name,
              is_online: false,
            },
            last_message: lastMessage,
            unread_count: unreadCounts[conv.conversation_id] || 0,
          };
        });

      // Sort by last message time
      return conversationsWithDetails.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles!sender_id(
            user_id,
            full_name,
            avatar_url,
            role
          )
        `,
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  // Send a new message
  async sendMessage(
    conversationId: string,
    content: string,
    type: "text" | "product" | "order" = "text",
  ): Promise<Message> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: type,
          is_read: false,
        })
        .select(
          `
          *,
          sender:profiles!sender_id(
            user_id,
            full_name,
            avatar_url,
            role
          )
        `,
        )
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("conversation_id", conversationId);

      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }

  // Subscribe to new messages
  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void,
  ): RealtimeChannel {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:profiles!sender_id(
                user_id,
                full_name,
                avatar_url,
                role
              )
            `,
            )
            .eq("message_id", payload.new.message_id)
            .single();

          if (data) callback(data);
        },
      )
      .subscribe();
  }

  // Subscribe to new conversations
  subscribeToNewConversations(
    callback: (conversationId: string) => void,
  ): RealtimeChannel {
    return supabase
      .channel("new-conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_participants",
        },
        async (payload) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user && payload.new.user_id === user.id) {
            callback(payload.new.conversation_id);
          }
        },
      )
      .subscribe();
  }

  // Unsubscribe from channel
  unsubscribe(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  }
}

export const chatService = new ChatService();
