// contexts/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useNotifications } from "@/services/notificationService";
import { useAuth } from "@/hooks/useAuth";

// contexts/NotificationContext.tsx
interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  buyerUnreadCount: number;
  vendorUnreadCount: number;
  riderUnreadCount: number;
  messageUnreadCount: number; // ADD THIS
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const notificationData = useNotifications(user?.id || null);

  const refreshNotifications = useCallback(async () => {
    if (user?.id && notificationData.refetch) {
      await notificationData.refetch();
    }
  }, [user?.id, notificationData.refetch]);

  const contextValue = useMemo<NotificationContextType>(
    () => ({
      notifications: notificationData.notifications,
      unreadCount: notificationData.unreadCount,
      buyerUnreadCount: notificationData.buyerUnreadCount,
      vendorUnreadCount: notificationData.vendorUnreadCount,
      riderUnreadCount: notificationData.riderUnreadCount,
      messageUnreadCount: notificationData.messageUnreadCount || 0, // ADD THIS
      loading: notificationData.loading,
      markAsRead: notificationData.markAsRead,
      markAllAsRead: notificationData.markAllAsRead,
      refreshNotifications,
    }),
    [notificationData, refreshNotifications],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider",
    );
  }
  return context;
};
