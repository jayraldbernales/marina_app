import { supabase } from "./supabase";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  buyer_id: string | null;
  vendor_id: string | null;
  rider_id: string | null;
  last_message: string | null;
  last_message_time: string;
  last_message_sender_id: string | null;
  buyer_unread_count: number;
  vendor_unread_count: number;
  rider_unread_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  buyer?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  vendor?: {
    shop_name: string;
    avatar_url: string | null;
  } | null;
  rider?: {
    vehicle_type: string | null;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
}

export const chatService = {
  // Get or create a conversation between two parties - WITHOUT order_id
  async getOrCreateConversation(participants: {
    buyerId?: string;
    vendorId?: string;
    riderId?: string;
  }) {
    const { buyerId, vendorId, riderId } = participants;

    // Build query based on provided participants
    let query = supabase.from("conversations").select(`
        *,
        buyer:profiles!buyer_id(
          full_name,
          avatar_url
        ),
        vendor:vendor_profiles!vendor_id(
          shop_name,
          avatar_url
        ),
        rider:rider_profiles!rider_id(
          vehicle_type,
          profiles!rider_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        )
      `);

    // Add filters based on provided IDs
    if (buyerId) query = query.eq("buyer_id", buyerId);
    if (vendorId) query = query.eq("vendor_id", vendorId);
    if (riderId) query = query.eq("rider_id", riderId);

    // Try to get existing conversation
    const { data: existingConv, error: fetchError } = await query.maybeSingle();

    if (existingConv) {
      return { data: existingConv, error: null };
    }

    // If no conversation exists, create one
    const insertData: any = {};
    if (buyerId) insertData.buyer_id = buyerId;
    if (vendorId) insertData.vendor_id = vendorId;
    if (riderId) insertData.rider_id = riderId;

    // Set unread counts based on participants
    insertData.buyer_unread_count = 0;
    insertData.vendor_unread_count = 0;
    insertData.rider_unread_count = 0;

    const { data: newConv, error: createError } = await supabase
      .from("conversations")
      .insert([insertData])
      .select(
        `
        *,
        buyer:profiles!buyer_id(
          full_name,
          avatar_url
        ),
        vendor:vendor_profiles!vendor_id(
          shop_name,
          avatar_url
        ),
        rider:rider_profiles!rider_id(
          vehicle_type,
          profiles!rider_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        )
      `,
      )
      .single();

    return { data: newConv, error: createError };
  },

  // Get all conversations for a vendor
  async getVendorConversations(vendorId: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        buyer:profiles!buyer_id(
          full_name,
          avatar_url
        ),
        vendor:vendor_profiles!vendor_id(
          shop_name,
          avatar_url
        ),
        rider:rider_profiles!rider_id(
          vehicle_type,
          profiles!rider_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("vendor_id", vendorId) // Only fetch vendor conversations
      .order("last_message_time", { ascending: false }); // Sort by last message time

    return { data, error };
  },

  // Get all conversations for a buyer
  async getBuyerConversations(buyerId: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        buyer:profiles!buyer_id(
          full_name,
          avatar_url
        ),
        vendor:vendor_profiles!vendor_id(
          shop_name,
          avatar_url
        ),
        rider:rider_profiles!rider_id(
          vehicle_type,
          profiles!rider_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("buyer_id", buyerId)
      .order("last_message_time", { ascending: false });

    return { data, error };
  },

  // Get all conversations for a rider
  async getRiderConversations(riderId: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        buyer:profiles!buyer_id(
          full_name,
          avatar_url
        ),
        vendor:vendor_profiles!vendor_id(
          shop_name,
          avatar_url
        ),
        rider:rider_profiles!rider_id(
          vehicle_type,
          profiles!rider_profiles_user_id_fkey(
            full_name,
            avatar_url
          )
        )
      `,
      )
      .eq("rider_id", riderId)
      .order("last_message_time", { ascending: false });

    return { data, error };
  },

  // Get messages for a conversation
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    return { data, error };
  },

  // Send a message
  async sendMessage(conversationId: string, senderId: string, message: string) {
    try {
      // First, get the conversation to know who the participants are
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select(
          "buyer_id, vendor_id, rider_id, buyer_unread_count, vendor_unread_count, rider_unread_count",
        )
        .eq("id", conversationId)
        .single();

      if (convError || !conversation) {
        console.error("Error fetching conversation:", convError);
        return { data: null, error: convError };
      }

      // Insert the message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            message: message,
            is_read: false,
          },
        ])
        .select()
        .single();

      if (messageError) {
        console.error("Error inserting message:", messageError);
        return { data: null, error: messageError };
      }

      // Update conversation's last message and unread counts
      const updates: any = {
        last_message: message,
        last_message_time: new Date().toISOString(),
        last_message_sender_id: senderId,
      };

      // Increment the appropriate unread counts for other participants
      if (conversation.buyer_id && conversation.buyer_id !== senderId) {
        updates.buyer_unread_count = (conversation.buyer_unread_count || 0) + 1;
      }
      if (conversation.vendor_id && conversation.vendor_id !== senderId) {
        updates.vendor_unread_count =
          (conversation.vendor_unread_count || 0) + 1;
      }
      if (conversation.rider_id && conversation.rider_id !== senderId) {
        updates.rider_unread_count = (conversation.rider_unread_count || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from("conversations")
        .update(updates)
        .eq("id", conversationId);

      if (updateError) {
        console.error("Error updating conversation:", updateError);
      }

      return { data: messageData, error: null };
    } catch (err) {
      console.error("Error in sendMessage:", err);
      return { data: null, error: err };
    }
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string) {
    // Mark individual messages as read
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false);

    // Reset unread count for the user
    const { data: conv } = await supabase
      .from("conversations")
      .select("buyer_id, vendor_id, rider_id")
      .eq("id", conversationId)
      .single();

    if (conv) {
      const updates: any = {};
      if (conv.buyer_id === userId) {
        updates.buyer_unread_count = 0;
      }
      if (conv.vendor_id === userId) {
        updates.vendor_unread_count = 0;
      }
      if (conv.rider_id === userId) {
        updates.rider_unread_count = 0;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("conversations")
          .update(updates)
          .eq("id", conversationId);
      }
    }
  },

  // Subscribe to new messages in a conversation
  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void,
  ) {
    const subscription = supabase.channel(`messages:${conversationId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log("New message received via subscription:", payload);
        callback(payload.new as Message);
      },
    );

    return subscription;
  },
};
