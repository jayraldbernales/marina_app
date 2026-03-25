// services/notificationService.ts
import { supabase } from "../lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

export type Notification = {
  notification_id: string;
  user_id: string;
  user_type: "buyer" | "vendor" | "rider";
  type: string;
  title: string;
  message?: string | null;
  metadata?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
  related_id?: string | null;
};

export type CreateNotificationParams = {
  userId: string;
  userType: "buyer" | "vendor" | "rider";
  type: string;
  title: string;
  message?: string;
  metadata?: Record<string, any>;
  relatedId?: string;
};

export async function fetchNotifications(
  userId: string,
  options?: { filter?: string; limit?: number },
): Promise<Notification[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.filter && options.filter !== "all") {
    query = query.eq("type", options.filter);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  return (data ?? []) as Notification[];
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("notification_id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function markAllAsRead(
  userId: string,
): Promise<{ count: number }> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select();

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }

  return { count: data?.length ?? 0 };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }

  return count ?? 0;
}

export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: params.userId,
        user_type: params.userType,
        type: params.type,
        title: params.title,
        message: params.message || null,
        metadata: params.metadata || {},
        related_id: params.relatedId || null,
        is_read: false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }

  return data as Notification;
}

export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("notification_id", notificationId);

  if (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

export async function deleteAllReadNotifications(
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("is_read", true)
    .select();

  if (error) {
    console.error("Error deleting read notifications:", error);
    throw error;
  }

  return data?.length ?? 0;
}

// FIXED: subscribeToNotifications with better connection handling
export function subscribeToNotifications(
  userId: string,
  callbacks: {
    onInsert?: (notification: Notification) => void;
    onUpdate?: (notification: Notification) => void;
    onDelete?: (notification: Notification) => void;
  },
): () => Promise<void> {
  console.log(`🔌 Setting up notification subscription for user: ${userId}`);

  // Create a unique channel name
  const channelName = `notifications:${userId}:${Date.now()}`;
  const channel: RealtimeChannel = supabase.channel(channelName);

  // Handle INSERT events
  if (callbacks.onInsert) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("📨 Real-time INSERT received:", payload.new);
        callbacks.onInsert?.(payload.new as Notification);
      },
    );
  }

  // Handle UPDATE events
  if (callbacks.onUpdate) {
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("📨 Real-time UPDATE received:", payload.new);
        callbacks.onUpdate?.(payload.new as Notification);
      },
    );
  }

  // Handle DELETE events
  if (callbacks.onDelete) {
    channel.on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("📨 Real-time DELETE received:", payload.old);
        callbacks.onDelete?.(payload.old as Notification);
      },
    );
  }

  // Subscribe with proper error handling
  channel.subscribe((status, err) => {
    if (status === "SUBSCRIBED") {
      console.log(
        `✅ Successfully subscribed to notifications for user ${userId}`,
      );
    } else if (status === "CHANNEL_ERROR") {
      console.error(`❌ Channel error for user ${userId}:`, err);
    } else if (status === "TIMED_OUT") {
      console.error(`⏱️ Subscription timed out for user ${userId}`);
    } else if (status === "CLOSED") {
      console.log(`🔒 Channel closed for user ${userId}`);
    }
  });

  // Return unsubscribe function
  return async () => {
    try {
      console.log(`🔌 Unsubscribing from notifications for user ${userId}`);
      await supabase.removeChannel(channel);
      console.log(
        `✅ Successfully unsubscribed from notifications for user ${userId}`,
      );
    } catch (e) {
      console.error("Error unsubscribing from notifications:", e);
    }
  };
}

// services/notificationService.ts (updated with messageUnreadCount)
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [buyerUnreadCount, setBuyerUnreadCount] = useState(0);
  const [vendorUnreadCount, setVendorUnreadCount] = useState(0);
  const [riderUnreadCount, setRiderUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Define loadNotifications outside useEffect so it can be called from refetch
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      console.log(`📥 Fetching notifications for user: ${userId}`);
      const notifsData = await fetchNotifications(userId);

      console.log(`📊 Fetched ${notifsData.length} notifications`);
      setNotifications(notifsData);

      const totalUnread = notifsData.filter((n) => !n.is_read).length;
      const buyerUnread = notifsData.filter(
        (n) => n.user_type === "buyer" && !n.is_read,
      ).length;
      const vendorUnread = notifsData.filter(
        (n) => n.user_type === "vendor" && !n.is_read,
      ).length;
      const riderUnread = notifsData.filter(
        (n) => n.user_type === "rider" && !n.is_read,
      ).length;
      const messageUnread = notifsData.filter(
        (n) => n.type === "message" && !n.is_read,
      ).length;

      setUnreadCount(totalUnread);
      setBuyerUnreadCount(buyerUnread);
      setVendorUnreadCount(vendorUnread);
      setRiderUnreadCount(riderUnread);
      setMessageUnreadCount(messageUnread);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setBuyerUnreadCount(0);
      setVendorUnreadCount(0);
      setRiderUnreadCount(0);
      setMessageUnreadCount(0);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => Promise<void>) | null = null;

    const loadNotificationsWithMountCheck = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        console.log(`📥 Fetching notifications for user: ${userId}`);
        const notifsData = await fetchNotifications(userId);

        if (isMounted) {
          console.log(`📊 Fetched ${notifsData.length} notifications`);
          setNotifications(notifsData);

          const totalUnread = notifsData.filter((n) => !n.is_read).length;
          const buyerUnread = notifsData.filter(
            (n) => n.user_type === "buyer" && !n.is_read,
          ).length;
          const vendorUnread = notifsData.filter(
            (n) => n.user_type === "vendor" && !n.is_read,
          ).length;
          const riderUnread = notifsData.filter(
            (n) => n.user_type === "rider" && !n.is_read,
          ).length;
          const messageUnread = notifsData.filter(
            (n) => n.type === "message" && !n.is_read,
          ).length;

          setUnreadCount(totalUnread);
          setBuyerUnreadCount(buyerUnread);
          setVendorUnreadCount(vendorUnread);
          setRiderUnreadCount(riderUnread);
          setMessageUnreadCount(messageUnread);
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up real-time subscription
    unsubscribe = subscribeToNotifications(userId, {
      onInsert: (newNotification) => {
        console.log("🆕 New notification received:", newNotification);
        if (isMounted) {
          setNotifications((prev) => {
            if (
              prev.some(
                (n) => n.notification_id === newNotification.notification_id,
              )
            ) {
              return prev;
            }
            return [newNotification, ...prev];
          });

          if (!newNotification.is_read) {
            setUnreadCount((prev) => prev + 1);

            if (newNotification.user_type === "buyer") {
              setBuyerUnreadCount((prev) => prev + 1);
            } else if (newNotification.user_type === "vendor") {
              setVendorUnreadCount((prev) => prev + 1);
            } else if (newNotification.user_type === "rider") {
              setRiderUnreadCount((prev) => prev + 1);
            }

            if (newNotification.type === "message") {
              setMessageUnreadCount((prev) => prev + 1);
            }
          }
        }
      },
      onUpdate: (updatedNotification) => {
        console.log("🔄 Notification updated:", updatedNotification);
        if (isMounted) {
          setNotifications((prev) => {
            const oldNotification = prev.find(
              (n) => n.notification_id === updatedNotification.notification_id,
            );

            if (!oldNotification) return prev;

            const wasUnread = !oldNotification.is_read;
            const isNowRead = updatedNotification.is_read;

            if (wasUnread && isNowRead) {
              setUnreadCount((prev) => Math.max(0, prev - 1));

              if (updatedNotification.user_type === "buyer") {
                setBuyerUnreadCount((prev) => Math.max(0, prev - 1));
              } else if (updatedNotification.user_type === "vendor") {
                setVendorUnreadCount((prev) => Math.max(0, prev - 1));
              } else if (updatedNotification.user_type === "rider") {
                setRiderUnreadCount((prev) => Math.max(0, prev - 1));
              }

              if (updatedNotification.type === "message") {
                setMessageUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }

            return prev.map((n) =>
              n.notification_id === updatedNotification.notification_id
                ? updatedNotification
                : n,
            );
          });
        }
      },
      onDelete: (deletedNotification) => {
        console.log("🗑️ Notification deleted:", deletedNotification);
        if (isMounted) {
          setNotifications((prev) => {
            const wasUnread = !deletedNotification.is_read;

            if (wasUnread) {
              setUnreadCount((prev) => Math.max(0, prev - 1));

              if (deletedNotification.user_type === "buyer") {
                setBuyerUnreadCount((prev) => Math.max(0, prev - 1));
              } else if (deletedNotification.user_type === "vendor") {
                setVendorUnreadCount((prev) => Math.max(0, prev - 1));
              } else if (deletedNotification.user_type === "rider") {
                setRiderUnreadCount((prev) => Math.max(0, prev - 1));
              }

              if (deletedNotification.type === "message") {
                setMessageUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }

            return prev.filter(
              (n) => n.notification_id !== deletedNotification.notification_id,
            );
          });
        }
      },
    });

    // Load initial notifications
    loadNotificationsWithMountCheck();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);

      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n,
        );

        const newTotalUnread = updated.filter((n) => !n.is_read).length;
        const newBuyerUnread = updated.filter(
          (n) => n.user_type === "buyer" && !n.is_read,
        ).length;
        const newVendorUnread = updated.filter(
          (n) => n.user_type === "vendor" && !n.is_read,
        ).length;
        const newRiderUnread = updated.filter(
          (n) => n.user_type === "rider" && !n.is_read,
        ).length;
        const newMessageUnread = updated.filter(
          (n) => n.type === "message" && !n.is_read,
        ).length;

        setUnreadCount(newTotalUnread);
        setBuyerUnreadCount(newBuyerUnread);
        setVendorUnreadCount(newVendorUnread);
        setRiderUnreadCount(newRiderUnread);
        setMessageUnreadCount(newMessageUnread);

        return updated;
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead(userId);

      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, is_read: true }));

        setUnreadCount(0);
        setBuyerUnreadCount(0);
        setVendorUnreadCount(0);
        setRiderUnreadCount(0);
        setMessageUnreadCount(0);

        return updated;
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    buyerUnreadCount,
    vendorUnreadCount,
    riderUnreadCount,
    messageUnreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refetch: loadNotifications,
  };
}

// ========== PUSH NOTIFICATION FUNCTIONS (ADDED) ==========

// Get user's push token from database
export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("user_push_tokens")
      .select("expo_push_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching push token:", error);
      return null;
    }

    return data?.expo_push_token || null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Send push notification to a specific user
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<boolean> {
  try {
    const pushToken = await getUserPushToken(userId);

    if (!pushToken) {
      console.log(`No push token found for user: ${userId}`);
      return false;
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title: title,
        body: body,
        data: data || {},
        priority: "high",
      }),
    });

    const result = await response.json();

    if (result.data?.status === "ok") {
      console.log(`✅ Push sent to user ${userId}`);
      return true;
    } else {
      console.log(`❌ Push failed for user ${userId}:`, result);

      // If token is invalid, delete it from database
      if (
        result.data?.status === "error" &&
        (result.data?.message?.includes("DeviceNotRegistered") ||
          result.data?.message?.includes("InvalidCredentials"))
      ) {
        await supabase
          .from("user_push_tokens")
          .delete()
          .eq("expo_push_token", pushToken);
        console.log(`🗑️ Removed invalid token for user ${userId}`);
      }

      return false;
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

// Send notification to multiple users
export async function sendPushToMultipleUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, title, body, data);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// Save or update push token for current user
export async function savePushToken(
  userId: string,
  expoPushToken: string,
  deviceType: string,
): Promise<void> {
  try {
    const { error } = await supabase.from("user_push_tokens").upsert(
      {
        user_id: userId,
        expo_push_token: expoPushToken,
        device_type: deviceType,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "expo_push_token",
      },
    );

    if (error) {
      console.error("Error saving push token:", error);
      throw error;
    }

    console.log(`✅ Push token saved for user ${userId}`);
  } catch (error) {
    console.error("Error saving push token:", error);
  }
}

// Enhanced createNotification that also sends push notifications
export async function createNotificationWithPush(
  params: CreateNotificationParams,
  sendPush: boolean = true,
): Promise<Notification> {
  // First, create the in-app notification
  const notification = await createNotification(params);

  // Then send push notification if requested
  if (sendPush) {
    await sendPushToUser(
      params.userId,
      params.title,
      params.message || params.title,
      {
        type: params.type,
        notification_id: notification.notification_id,
        related_id: params.relatedId,
        ...params.metadata,
      },
    );
  }

  return notification;
}
